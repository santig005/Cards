// API pública del servicio de Google Wallet de Sellio.
// NO-OP-safe: sin credenciales configuradas, `createSaveUrlForCard` devuelve
// null y `syncCardToWallet`/`sendRewardMessageForCard` no hacen nada.
// El estado de cada pase se persiste en la tabla `wallet_passes`.

import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/drizzle/db'
import { walletPasses } from '@/lib/drizzle/schema'
import { isGoogleWalletConfigured } from './config'
import {
  ensureObject,
  patchObject,
  addRewardMessage,
  signSaveJwt,
} from './passes'

// Re-export para consumidores externos (canal de notificaciones, route handlers).
export { isGoogleWalletConfigured }

// ─── Aviso único cuando falta configuración ──────────────────────────────────────

let warnedMissingConfig = false

/** Registra un único aviso de "no configurado" por proceso. */
function warnOnce(): void {
  if (warnedMissingConfig) return
  warnedMissingConfig = true
  console.warn(
    '[google-wallet] credenciales ausentes — el servicio actúa como NO-OP. ' +
      'Define GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SA_EMAIL y GOOGLE_WALLET_SA_PRIVATE_KEY.',
  )
}

// ─── Tipos de entrada ────────────────────────────────────────────────────────────

type TenantArg = { id: string; name: string; logoUrl: string | null }
type CustomerArg = { id: string; name: string | null; phone: string }
type CardArg = { id: string; currentStamps: number }
type ProgramArg = { stampsRequired: number; rewardDescription: string }

// ─── Crear/asegurar el pase y devolver la URL de "Save to Google Wallet" ──────────

/**
 * Asegura class + object en Google, upserta la fila en `wallet_passes` y
 * devuelve la URL del botón "Save to Google Wallet".
 * Devuelve null si el servicio no está configurado (NO-OP-safe).
 */
export async function createSaveUrlForCard(args: {
  card: CardArg
  customer: CustomerArg
  tenant: TenantArg
  program: ProgramArg
}): Promise<{ url: string } | null> {
  if (!isGoogleWalletConfigured()) {
    warnOnce()
    return null
  }

  const { card, customer, tenant, program } = args

  // Crea (idempotente) la Loyalty Class y el Loyalty Object.
  const { classId, objectId } = await ensureObject({ card, customer, tenant, program })

  // Upsert de la fila en wallet_passes (clave única: cardId + channel).
  await db
    .insert(walletPasses)
    .values({
      tenantId: tenant.id,
      customerId: customer.id,
      cardId: card.id,
      channel: 'google',
      objectId,
      classId,
      status: 'active',
    })
    .onConflictDoUpdate({
      target: [walletPasses.cardId, walletPasses.channel],
      set: { objectId, classId, status: 'active', updatedAt: new Date() },
    })

  // Firma el Save JWT. signSaveJwt no devuelve null aquí porque ya validamos config.
  const url = signSaveJwt(objectId)
  if (!url) return null
  return { url }
}

// ─── Sincronizar el balance de sellos hacia el pase ───────────────────────────────

/**
 * Actualiza el balance de sellos del pase en Google.
 * NO-OP si no está configurado o si no existe pase activo para ese card/channel.
 */
export async function syncCardToWallet(args: {
  tenantId: string
  customerId: string
  cardId: string
  stamps: number
  required: number
}): Promise<void> {
  if (!isGoogleWalletConfigured()) {
    warnOnce()
    return
  }

  const { cardId, stamps, required } = args

  const [pass] = await db
    .select({ objectId: walletPasses.objectId })
    .from(walletPasses)
    .where(
      and(
        eq(walletPasses.cardId, cardId),
        eq(walletPasses.channel, 'google'),
        eq(walletPasses.status, 'active'),
      ),
    )
    .limit(1)

  if (!pass) return

  await patchObject({ objectId: pass.objectId, stamps, required, cardId })
}

// ─── Enviar mensaje de recompensa al pase ─────────────────────────────────────────

/**
 * Agrega un mensaje (ej. recompensa lista) al pase del cliente en Google.
 * NO-OP si no está configurado o si no existe pase activo.
 */
export async function sendRewardMessageForCard(args: {
  cardId: string
  header: string
  body: string
}): Promise<void> {
  if (!isGoogleWalletConfigured()) {
    warnOnce()
    return
  }

  const { cardId, header, body } = args

  const [pass] = await db
    .select({ objectId: walletPasses.objectId })
    .from(walletPasses)
    .where(
      and(
        eq(walletPasses.cardId, cardId),
        eq(walletPasses.channel, 'google'),
        eq(walletPasses.status, 'active'),
      ),
    )
    .limit(1)

  if (!pass) return

  await addRewardMessage(pass.objectId, header, body)
}
