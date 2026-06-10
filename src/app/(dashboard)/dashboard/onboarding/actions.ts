'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/drizzle/db'
import { tenants, loyaltyPrograms } from '@/lib/drizzle/schema'
import { createProgramSchema } from '@/lib/validations/onboarding'
import { eq } from 'drizzle-orm'

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

  const outcome = await withAuth(user.id, async (tx) => {
    const [tenant] = await tx.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1)

    if (!tenant) return { error: 'Negocio no encontrado' as const }

    if (result.data.businessName !== tenant.name) {
      await tx.update(tenants).set({ name: result.data.businessName }).where(eq(tenants.id, tenant.id))
    }

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
