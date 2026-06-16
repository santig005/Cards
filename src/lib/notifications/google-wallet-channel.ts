// Canal de notificación Google Wallet.
// Para cada pase activo del cliente, sincroniza el balance de sellos del
// Loyalty Object (PATCH) y, si la notificación es de recompensa ('reward'),
// agrega un mensaje visible al pase.
// NO-OP-safe: si Google Wallet no está configurado, retorna de inmediato.

import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/drizzle/db'
import { walletPasses, loyaltyCards, loyaltyPrograms } from '@/lib/drizzle/schema'
import {
  isGoogleWalletConfigured,
} from '@/lib/wallet/google'
import { patchObject, addRewardMessage } from '@/lib/wallet/google/passes'
import type { NotificationChannel, NotificationSendArgs } from './types'

/**
 * Sincroniza un único pase: carga la tarjeta y su programa para conocer el
 * balance actual de sellos, hace PATCH y, si es recompensa, agrega un mensaje.
 */
async function syncSinglePass(
  pass: { objectId: string; cardId: string },
  args: NotificationSendArgs,
): Promise<void> {
  // Cargar la tarjeta para conocer los sellos actuales.
  const [card] = await db
    .select({ currentStamps: loyaltyCards.currentStamps, programId: loyaltyCards.programId })
    .from(loyaltyCards)
    .where(eq(loyaltyCards.id, pass.cardId))
    .limit(1)

  if (!card) return

  // Cargar el programa para conocer cuántos sellos se requieren.
  const [program] = await db
    .select({ stampsRequired: loyaltyPrograms.stampsRequired })
    .from(loyaltyPrograms)
    .where(eq(loyaltyPrograms.id, card.programId))
    .limit(1)

  if (!program) return

  // Actualizar el balance del pase en Google.
  await patchObject({
    objectId: pass.objectId,
    stamps: card.currentStamps,
    required: program.stampsRequired,
    cardId: pass.cardId,
  })

  // Si la notificación es de recompensa lista, además agregar un mensaje visible.
  if (args.kind === 'reward') {
    await addRewardMessage(pass.objectId, args.payload.title, args.payload.body)
  }
}

/**
 * Canal Google Wallet de Sellio.
 * - Lee todos los pases activos del cliente (channel 'google').
 * - Sincroniza cada uno en paralelo con Promise.allSettled (un fallo por
 *   suscripción no rompe el fan-out general).
 */
export const googleWalletChannel: NotificationChannel = {
  name: 'google_wallet',

  async send(args: NotificationSendArgs): Promise<void> {
    // NO-OP si no hay credenciales configuradas.
    if (!isGoogleWalletConfigured()) return

    // Leer todos los pases activos de Google del cliente.
    const passes = await db
      .select({ objectId: walletPasses.objectId, cardId: walletPasses.cardId })
      .from(walletPasses)
      .where(
        and(
          eq(walletPasses.customerId, args.customerId),
          eq(walletPasses.channel, 'google'),
          eq(walletPasses.status, 'active'),
        ),
      )

    if (passes.length === 0) return

    // Procesar cada pase de forma aislada; un error en uno no aborta los demás.
    const results = await Promise.allSettled(passes.map((pass) => syncSinglePass(pass, args)))

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('[google-wallet] Error al sincronizar pase:', result.reason)
      }
    }
  },
}
