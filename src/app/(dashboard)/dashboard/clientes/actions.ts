'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/drizzle/db'
import { tenants, loyaltyCards, loyaltyPrograms, stampEvents } from '@/lib/drizzle/schema'
import { and, desc, eq } from 'drizzle-orm'
import { applyStamp, canRedeem, isWithinCooldown } from '@/lib/loyalty'

// Anti-fraude / anti-doble-tap: no se puede registrar otro sello en la misma
// tarjeta antes de que pasen estos segundos. Límite a nivel DB (sirve aunque
// haya varias instancias serverless).
const STAMP_COOLDOWN_MS = 3000
// Ventana para deshacer un sello mal registrado (error del cajero).
const UNDO_WINDOW_MS = 5 * 60 * 1000

function revalidate() {
  revalidatePath('/dashboard/clientes')
  revalidatePath('/dashboard')
}

type AddStampResult =
  | { error: string }
  | { success: true; full: boolean; stamps: number; stampsRequired: number }

/**
 * Agrega un sello. NO canjea automáticamente: cuando la tarjeta se llena queda
 * "lista" y espera el canje manual del cajero (`redeemReward`).
 */
export async function addStamp(cardId: string): Promise<AddStampResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const result = await withAuth(user.id, async (tx): Promise<AddStampResult> => {
    const [tenant] = await tx.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1)
    if (!tenant) return { error: 'Negocio no encontrado' }

    const [card] = await tx.select().from(loyaltyCards).where(eq(loyaltyCards.id, cardId)).limit(1)
    if (!card || card.tenantId !== tenant.id) return { error: 'Tarjeta no encontrada' }

    const [program] = await tx
      .select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.id, card.programId))
      .limit(1)
    if (!program) return { error: 'Programa no encontrado' }

    // Cooldown sobre el último sello de esta tarjeta.
    const [lastStamp] = await tx
      .select({ createdAt: stampEvents.createdAt })
      .from(stampEvents)
      .where(and(eq(stampEvents.cardId, card.id), eq(stampEvents.eventType, 'stamp')))
      .orderBy(desc(stampEvents.createdAt))
      .limit(1)

    if (isWithinCooldown(lastStamp?.createdAt ?? null, new Date(), STAMP_COOLDOWN_MS)) {
      return { error: 'Esperá unos segundos antes de registrar otro sello.' }
    }

    const outcome = applyStamp(card.currentStamps, program.stampsRequired)
    if (!outcome.ok) {
      return { error: 'La tarjeta ya está completa. Registrá el canje del premio.' }
    }

    await tx
      .update(loyaltyCards)
      .set({ currentStamps: outcome.next, updatedAt: new Date() })
      .where(eq(loyaltyCards.id, cardId))
    await tx.insert(stampEvents).values({
      tenantId: tenant.id,
      cardId: card.id,
      customerId: card.customerId,
      registeredById: user.id,
      eventType: 'stamp',
    })

    return { success: true, full: outcome.full, stamps: outcome.next, stampsRequired: program.stampsRequired }
  })

  if ('success' in result) revalidate()
  return result
}

type RedeemResult = { error: string } | { success: true; rewardDescription: string }

/**
 * Canje MANUAL: el cajero confirma que entregó el premio. Recién acá se reinicia
 * la tarjeta y se cuenta el canje.
 */
export async function redeemReward(cardId: string): Promise<RedeemResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const result = await withAuth(user.id, async (tx): Promise<RedeemResult> => {
    const [tenant] = await tx.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1)
    if (!tenant) return { error: 'Negocio no encontrado' }

    const [card] = await tx.select().from(loyaltyCards).where(eq(loyaltyCards.id, cardId)).limit(1)
    if (!card || card.tenantId !== tenant.id) return { error: 'Tarjeta no encontrada' }

    const [program] = await tx
      .select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.id, card.programId))
      .limit(1)
    if (!program) return { error: 'Programa no encontrado' }

    if (!canRedeem(card.currentStamps, program.stampsRequired)) {
      return { error: 'La tarjeta todavía no está completa.' }
    }

    await tx
      .update(loyaltyCards)
      .set({ currentStamps: 0, totalRedeemed: card.totalRedeemed + 1, updatedAt: new Date() })
      .where(eq(loyaltyCards.id, cardId))
    await tx.insert(stampEvents).values({
      tenantId: tenant.id,
      cardId: card.id,
      customerId: card.customerId,
      registeredById: user.id,
      eventType: 'redeem',
    })

    return { success: true, rewardDescription: program.rewardDescription }
  })

  if ('success' in result) revalidate()
  return result
}

type UndoResult = { error: string } | { success: true; stamps: number }

/** Deshace el último sello (corrección de error del cajero), dentro de una ventana. */
export async function undoLastStamp(cardId: string): Promise<UndoResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const result = await withAuth(user.id, async (tx): Promise<UndoResult> => {
    const [tenant] = await tx.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1)
    if (!tenant) return { error: 'Negocio no encontrado' }

    const [card] = await tx.select().from(loyaltyCards).where(eq(loyaltyCards.id, cardId)).limit(1)
    if (!card || card.tenantId !== tenant.id) return { error: 'Tarjeta no encontrada' }

    if (card.currentStamps <= 0) return { error: 'No hay sellos para deshacer.' }

    const [last] = await tx
      .select()
      .from(stampEvents)
      .where(and(eq(stampEvents.cardId, card.id), eq(stampEvents.eventType, 'stamp')))
      .orderBy(desc(stampEvents.createdAt))
      .limit(1)

    if (!last) return { error: 'No hay sellos para deshacer.' }
    if (Date.now() - last.createdAt.getTime() > UNDO_WINDOW_MS) {
      return { error: 'Ya pasó el tiempo para deshacer este sello.' }
    }

    await tx.delete(stampEvents).where(eq(stampEvents.id, last.id))
    await tx
      .update(loyaltyCards)
      .set({ currentStamps: card.currentStamps - 1, updatedAt: new Date() })
      .where(eq(loyaltyCards.id, cardId))

    return { success: true, stamps: card.currentStamps - 1 }
  })

  if ('success' in result) revalidate()
  return result
}
