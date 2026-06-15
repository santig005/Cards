'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { db, withAuth } from '@/lib/drizzle/db'
import { loyaltyCards, customers, pushSubscriptions } from '@/lib/drizzle/schema'
import { and, eq, inArray } from 'drizzle-orm'

type ActionResult = { success: true } | { error: string }

// Forma de la suscripción que entrega `pushManager.subscribe().toJSON()` en el
// navegador. Se valida con Zod antes de tocar la DB (regla de inputs saneados).
const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(255),
    auth: z.string().min(1).max(255),
  }),
})

const prefsSchema = z.object({
  notifyReward: z.boolean(),
  notifyNewStamp: z.boolean(),
})

/**
 * Verifica, vía RLS, que el usuario autenticado sea dueño de `cardId` y devuelve
 * el `tenantId`/`customerId` de la tarjeta. `withAuth` corre como el rol
 * `authenticated`, así que las políticas self del cliente (ADR-004 / 0002) sólo
 * dejan ver SUS propias tarjetas: si la tarjeta no es suya, vuelve `null`.
 */
async function verifyCardOwnership(
  userId: string,
  cardId: string
): Promise<{ tenantId: string; customerId: string } | null> {
  return withAuth(userId, async (tx) => {
    const [card] = await tx
      .select({ tenantId: loyaltyCards.tenantId, customerId: loyaltyCards.customerId })
      .from(loyaltyCards)
      .where(eq(loyaltyCards.id, cardId))
      .limit(1)
    return card ?? null
  })
}

/**
 * Guarda (o actualiza) la suscripción Web Push del navegador del cliente para su
 * tarjeta. La escritura va por la conexión de servicio tras verificar la
 * pertenencia de la tarjeta — mismo criterio que `verifyOtp` (ver actions.ts).
 */
export async function savePushSubscription(
  cardId: string,
  subscription: unknown
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const parsed = subscriptionSchema.safeParse(subscription)
  if (!parsed.success) return { error: 'invalidSubscription' }

  const owner = await verifyCardOwnership(user.id, cardId)
  if (!owner) return { error: 'cardNotFound' }

  const { endpoint, keys } = parsed.data

  // `endpoint` es único globalmente: si el navegador ya estaba suscrito (mismo
  // endpoint), reasignamos la fila al tenant/cliente actuales en vez de duplicar.
  await db
    .insert(pushSubscriptions)
    .values({
      tenantId: owner.tenantId,
      customerId: owner.customerId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { tenantId: owner.tenantId, customerId: owner.customerId, p256dh: keys.p256dh, auth: keys.auth },
    })

  return { success: true }
}

/**
 * Borra una suscripción por su `endpoint`, acotada al cliente autenticado (sólo
 * puede borrar suscripciones que le pertenecen).
 */
export async function deletePushSubscription(endpoint: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  if (typeof endpoint !== 'string' || endpoint.length === 0) {
    return { error: 'invalidSubscription' }
  }

  // Acotado a los customers del usuario autenticado: nunca borra ajenas.
  const myCustomers = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.authUserId, user.id))
  const myCustomerIds = myCustomers.map((c) => c.id)
  if (myCustomerIds.length === 0) return { success: true }

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.endpoint, endpoint),
        inArray(pushSubscriptions.customerId, myCustomerIds)
      )
    )

  return { success: true }
}

/**
 * Actualiza las preferencias granulares de notificación del cliente dueño de
 * `cardId` (recompensa lista / nuevo sello).
 */
export async function updateNotificationPrefs(
  cardId: string,
  prefs: unknown
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const parsed = prefsSchema.safeParse(prefs)
  if (!parsed.success) return { error: 'invalidData' }

  const owner = await verifyCardOwnership(user.id, cardId)
  if (!owner) return { error: 'cardNotFound' }

  await db
    .update(customers)
    .set({ notifyReward: parsed.data.notifyReward, notifyNewStamp: parsed.data.notifyNewStamp })
    .where(eq(customers.id, owner.customerId))

  return { success: true }
}
