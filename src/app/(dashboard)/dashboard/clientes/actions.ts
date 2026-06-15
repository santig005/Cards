'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { withTenantTx } from '@/lib/tenant'
import { customers, loyaltyCards, loyaltyPrograms, stampEvents } from '@/lib/drizzle/schema'
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
  const t = await getTranslations('errors')

  const result = await withTenantTx(async ({ user, tenant, tx }): Promise<AddStampResult> => {
    const [card] = await tx.select().from(loyaltyCards).where(eq(loyaltyCards.id, cardId)).limit(1)
    if (!card || card.tenantId !== tenant.id) return { error: t('cardNotFound') }

    const [program] = await tx
      .select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.id, card.programId))
      .limit(1)
    if (!program) return { error: t('programNotFound') }

    // Cooldown sobre el último sello de esta tarjeta.
    const [lastStamp] = await tx
      .select({ createdAt: stampEvents.createdAt })
      .from(stampEvents)
      .where(and(eq(stampEvents.cardId, card.id), eq(stampEvents.eventType, 'stamp')))
      .orderBy(desc(stampEvents.createdAt))
      .limit(1)

    if (isWithinCooldown(lastStamp?.createdAt ?? null, new Date(), STAMP_COOLDOWN_MS)) {
      return { error: t('cooldown') }
    }

    const outcome = applyStamp(card.currentStamps, program.stampsRequired)
    if (!outcome.ok) {
      return { error: t('cardAlreadyFull') }
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
  const t = await getTranslations('errors')

  const result = await withTenantTx(async ({ user, tenant, tx }): Promise<RedeemResult> => {
    const [card] = await tx.select().from(loyaltyCards).where(eq(loyaltyCards.id, cardId)).limit(1)
    if (!card || card.tenantId !== tenant.id) return { error: t('cardNotFound') }

    const [program] = await tx
      .select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.id, card.programId))
      .limit(1)
    if (!program) return { error: t('programNotFound') }

    if (!canRedeem(card.currentStamps, program.stampsRequired)) {
      return { error: t('cardNotFull') }
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
  const t = await getTranslations('errors')

  const result = await withTenantTx(async ({ tenant, tx }): Promise<UndoResult> => {
    const [card] = await tx.select().from(loyaltyCards).where(eq(loyaltyCards.id, cardId)).limit(1)
    if (!card || card.tenantId !== tenant.id) return { error: t('cardNotFound') }

    if (card.currentStamps <= 0) return { error: t('noStampsToUndo') }

    const [last] = await tx
      .select()
      .from(stampEvents)
      .where(and(eq(stampEvents.cardId, card.id), eq(stampEvents.eventType, 'stamp')))
      .orderBy(desc(stampEvents.createdAt))
      .limit(1)

    if (!last) return { error: t('noStampsToUndo') }
    if (Date.now() - last.createdAt.getTime() > UNDO_WINDOW_MS) {
      return { error: t('undoWindowExpired') }
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

// ─── Gestión de clientes ──────────────────────────────────────────────────────

function buildUpdateCustomerSchema(nameMax80: string, emailOrEmpty: string) {
  return z.object({
    name: z.string().trim().max(80, nameMax80).optional(),
    email: z.union([z.string().trim().email(emailOrEmpty), z.literal('')]).optional(),
  })
}

type UpdateCustomerResult = { error: string } | { success: true }

/** Edita el nombre/email de un cliente del negocio. */
export async function updateCustomer(
  customerId: string,
  input: { name?: string; email?: string }
): Promise<UpdateCustomerResult> {
  const t = await getTranslations('errors')
  const v = await getTranslations('validation')
  const schema = buildUpdateCustomerSchema(v('nameMax80'), v('emailOrEmpty'))
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? v('invalidData') }
  }

  const result = await withTenantTx(async ({ tenant, tx }): Promise<UpdateCustomerResult> => {
    const [customer] = await tx.select().from(customers).where(eq(customers.id, customerId)).limit(1)
    // RLS ya aísla por tenant; este check es defensa en profundidad.
    if (!customer || customer.tenantId !== tenant.id) return { error: t('customerNotFound') }

    await tx
      .update(customers)
      .set({
        name: parsed.data.name ? parsed.data.name : null,
        email: parsed.data.email ? parsed.data.email : null,
      })
      .where(eq(customers.id, customerId))

    return { success: true }
  })

  if ('success' in result) revalidate()
  return result
}

type DeleteCustomerResult = { error: string } | { success: true }

/** Elimina un cliente del negocio junto con sus tarjetas y eventos. */
export async function deleteCustomer(customerId: string): Promise<DeleteCustomerResult> {
  const t = await getTranslations('errors')

  const result = await withTenantTx(async ({ tenant, tx }): Promise<DeleteCustomerResult> => {
    const [customer] = await tx.select().from(customers).where(eq(customers.id, customerId)).limit(1)
    if (!customer || customer.tenantId !== tenant.id) return { error: t('customerNotFound') }

    // No hay FKs con cascade en el schema → borramos en orden manualmente,
    // siempre acotado por tenant (defensa en profundidad sobre RLS).
    await tx
      .delete(stampEvents)
      .where(and(eq(stampEvents.tenantId, tenant.id), eq(stampEvents.customerId, customerId)))
    await tx
      .delete(loyaltyCards)
      .where(and(eq(loyaltyCards.tenantId, tenant.id), eq(loyaltyCards.customerId, customerId)))
    await tx.delete(customers).where(eq(customers.id, customerId))

    return { success: true }
  })

  if ('success' in result) revalidate()
  return result
}
