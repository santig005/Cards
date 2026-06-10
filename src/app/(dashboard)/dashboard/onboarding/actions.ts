'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/drizzle/db'
import { tenants, loyaltyPrograms } from '@/lib/drizzle/schema'
import { createProgramSchema } from '@/lib/validations/onboarding'
import { eq } from 'drizzle-orm'

const LOGO_BUCKET = 'logos'
const ALLOWED_LOGO_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}
const MAX_LOGO_BYTES = 2 * 1024 * 1024 // 2 MB

/** Sube el logo al bucket público y devuelve la URL pública (o un error). */
async function uploadLogo(tenantId: string, file: File): Promise<{ url: string } | { error: string }> {
  const ext = ALLOWED_LOGO_TYPES[file.type]
  if (!ext) return { error: 'El logo debe ser PNG, JPG o WEBP.' }
  if (file.size > MAX_LOGO_BYTES) return { error: 'El logo no puede pesar más de 2 MB.' }

  const admin = createAdminClient()
  const path = `${tenantId}/${Date.now()}.${ext}`
  const { error } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true })
  if (error) return { error: 'No se pudo subir el logo. Intentá de nuevo.' }

  return { url: admin.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl }
}

export async function createProgram(formData: FormData) {
  const raw = {
    businessName: formData.get('businessName') as string,
    stampsRequired: formData.get('stampsRequired') as string,
    rewardType: formData.get('rewardType') as string,
    rewardDescription: formData.get('rewardDescription') as string,
  }

  const result = createProgramSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const [tenant] = await withAuth(user.id, (tx) =>
    tx.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1)
  )
  if (!tenant) return { error: 'Negocio no encontrado' }

  // Logo opcional: se sube antes del upsert para guardar la URL en el mismo update.
  let logoUrl: string | null = null
  const logoFile = formData.get('logo')
  if (logoFile instanceof File && logoFile.size > 0) {
    const uploaded = await uploadLogo(tenant.id, logoFile)
    if ('error' in uploaded) return { error: uploaded.error }
    logoUrl = uploaded.url
  }

  const outcome = await withAuth(user.id, async (tx) => {
    await tx
      .update(tenants)
      .set({
        name: result.data.businessName,
        ...(logoUrl ? { logoUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenant.id))

    const [existing] = await tx
      .select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.tenantId, tenant.id))
      .limit(1)

    if (existing) {
      await tx
        .update(loyaltyPrograms)
        .set({
          stampsRequired: result.data.stampsRequired,
          rewardType: result.data.rewardType,
          rewardDescription: result.data.rewardDescription,
          updatedAt: new Date(),
        })
        .where(eq(loyaltyPrograms.id, existing.id))
    } else {
      await tx.insert(loyaltyPrograms).values({
        tenantId: tenant.id,
        stampsRequired: result.data.stampsRequired,
        rewardType: result.data.rewardType,
        rewardDescription: result.data.rewardDescription,
        isActive: true,
      })
    }

    return { error: null }
  })

  // redirect() throws, so it must run outside the transaction callback.
  if (outcome.error) return { error: outcome.error }

  redirect('/dashboard')
}
