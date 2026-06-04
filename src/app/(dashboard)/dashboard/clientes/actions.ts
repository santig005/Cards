'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/drizzle/db'
import { tenants, loyaltyCards, loyaltyPrograms, stampEvents } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'

export async function addStamp(cardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const [tenant] = await db.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1)
  if (!tenant) return { error: 'Negocio no encontrado' }

  const [card] = await db.select().from(loyaltyCards).where(eq(loyaltyCards.id, cardId)).limit(1)
  if (!card || card.tenantId !== tenant.id) return { error: 'Tarjeta no encontrada' }

  const [program] = await db.select().from(loyaltyPrograms).where(eq(loyaltyPrograms.id, card.programId)).limit(1)
  if (!program) return { error: 'Programa no encontrado' }

  const newStampCount = card.currentStamps + 1
  const shouldRedeem = newStampCount >= program.stampsRequired

  if (shouldRedeem) {
    await db.update(loyaltyCards).set({ currentStamps: 0, totalRedeemed: card.totalRedeemed + 1, updatedAt: new Date() }).where(eq(loyaltyCards.id, cardId))
    await db.insert(stampEvents).values({ tenantId: tenant.id, cardId: card.id, customerId: card.customerId, registeredById: user.id, eventType: 'stamp' })
    await db.insert(stampEvents).values({ tenantId: tenant.id, cardId: card.id, customerId: card.customerId, registeredById: user.id, eventType: 'redeem' })
  } else {
    await db.update(loyaltyCards).set({ currentStamps: newStampCount, updatedAt: new Date() }).where(eq(loyaltyCards.id, cardId))
    await db.insert(stampEvents).values({ tenantId: tenant.id, cardId: card.id, customerId: card.customerId, registeredById: user.id, eventType: 'stamp' })
  }

  revalidatePath('/dashboard/clientes')
  revalidatePath('/dashboard')

  return { success: true, redeemed: shouldRedeem, rewardDescription: program.rewardDescription }
}
