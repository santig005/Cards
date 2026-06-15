'use server'

import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/drizzle/db'
import { getAuthedTenant } from '@/lib/tenant'
import { tenants, loyaltyPrograms } from '@/lib/drizzle/schema'
import { buildCreateProgramSchema } from '@/lib/validations/onboarding'
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
  const t = await getTranslations('errors')
  const ext = ALLOWED_LOGO_TYPES[file.type]
  if (!ext) return { error: t('logoType') }
  if (file.size > MAX_LOGO_BYTES) return { error: t('logoSize') }

  const admin = createAdminClient()
  const path = `${tenantId}/${Date.now()}.${ext}`
  const { error } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true })
  if (error) return { error: t('logoUploadFailed') }

  return { url: admin.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl }
}

export async function createProgram(formData: FormData) {
  const raw = {
    businessName: formData.get('businessName') as string,
    stampsRequired: formData.get('stampsRequired') as string,
    rewardType: formData.get('rewardType') as string,
    rewardDescription: formData.get('rewardDescription') as string,
    countryCode: formData.get('countryCode') as string | undefined,
    timezone: formData.get('timezone') as string | undefined,
    locale: formData.get('locale') as string | undefined,
  }

  const v = await getTranslations('validation')
  const schema = buildCreateProgramSchema({
    stampsMin: v('stampsMin'),
    stampsMax: v('stampsMax'),
    rewardTypeRequired: v('rewardTypeRequired'),
    descMin3: v('descMin3'),
    descMax200: v('descMax200'),
    nameMin2: v('nameMin2'),
    nameMax80: v('nameMax80'),
    countryRequired: v('countryRequired'),
    timezoneRequired: v('timezoneRequired'),
  })
  const result = schema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const authed = await getAuthedTenant()
  if ('error' in authed) return authed
  const { user, tenant } = authed

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
        ...(result.data.countryCode ? { countryCode: result.data.countryCode } : {}),
        ...(result.data.timezone ? { timezone: result.data.timezone } : {}),
        ...(result.data.locale ? { locale: result.data.locale } : {}),
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
