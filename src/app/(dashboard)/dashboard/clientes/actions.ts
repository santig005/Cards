'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/drizzle/db'
import {
  tenants,
  loyaltyCards,
  loyaltyPrograms,
  stampEvents,
} from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'

export async function addStamp(cardId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.ownerId, user.id),
  })

  if (!tenant) return { error: 'Negocio no encontrado' }

  const card = await db.query.loyaltyCards.findFirst({
    where: eq(loyaltyCards.id, cardId),
  })

  if (!card || card.tenantId !== tenant.id) {
    return { error: 'Tarjeta no encontrada' }
  }

  const program = await db.query.loyaltyPrograms.findFirst({
    where: eq(loyaltyPrograms.id, card.programId),
  })

  if (!program) return { error: 'Programa no encontrado' }

  const newStampCount = card.currentStamps + 1
  const shouldRedeem = newStampCount >= program.stampsRequired

  if (shouldRedeem) {
    // Reset stamps, increment totalRedeemed
    await db
      .update(loyaltyCards)
      .set({
        currentStamps: 0,
        totalRedeemed: card.totalRedeemed + 1,
        updatedAt: new Date(),
      })
      .where(eq(loyaltyCards.id, cardId))

    // Insert stamp event
    await db.insert(stampEvents).values({
      tenantId: tenant.id,
      cardId: card.id,
      customerId: card.customerId,
      registeredById: user.id,
      eventType: 'stamp',
    })

    // Insert redeem event
    await db.insert(stampEvents).values({
      tenantId: tenant.id,
      cardId: card.id,
      customerId: card.customerId,
      registeredById: user.id,
      eventType: 'redeem',
    })
  } else {
    // Just increment stamps
    await db
      .update(loyaltyCards)
      .set({
        currentStamps: newStampCount,
        updatedAt: new Date(),
      })
      .where(eq(loyaltyCards.id, cardId))

    await db.insert(stampEvents).values({
      tenantId: tenant.id,
      cardId: card.id,
      customerId: card.customerId,
      registeredById: user.id,
      eventType: 'stamp',
    })
  }

  revalidatePath('/dashboard/clientes')
  revalidatePath('/dashboard')

  return {
    success: true,
    redeemed: shouldRedeem,
    rewardDescription: program.rewardDescription,
  }
}
