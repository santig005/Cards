'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/drizzle/db'
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

  const [tenant] = await db.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1)

  if (!tenant) return { error: 'Negocio no encontrado' }

  if (result.data.businessName !== tenant.name) {
    await db.update(tenants).set({ name: result.data.businessName }).where(eq(tenants.id, tenant.id))
  }

  const [existing] = await db.select().from(loyaltyPrograms).where(eq(loyaltyPrograms.tenantId, tenant.id)).limit(1)

  if (existing) {
    await db
      .update(loyaltyPrograms)
      .set({
        stampsRequired: result.data.stampsRequired,
        rewardType: result.data.rewardType,
        rewardDescription: result.data.rewardDescription,
        updatedAt: new Date(),
      })
      .where(eq(loyaltyPrograms.id, existing.id))
  } else {
    await db.insert(loyaltyPrograms).values({
      tenantId: tenant.id,
      stampsRequired: result.data.stampsRequired,
      rewardType: result.data.rewardType,
      rewardDescription: result.data.rewardDescription,
      isActive: true,
    })
  }

  redirect('/dashboard')
}
