// Construcción de bodies y operaciones sobre Loyalty Class/Object de Google Wallet.
// Las funciones "build*" y "stripImageUrl"/"buildSaveJwtClaims" son PURAS
// (sin red ni dependencias de entorno) para poder testearse en aislamiento.
// Las operaciones async usan `walletRequest` de client.ts.

import jwt from 'jsonwebtoken'
import { getWalletConfig } from './config'
import { walletRequest } from './client'

// ─── Tipos de los bodies de la API ──────────────────────────────────────────────

type ImageRef = { sourceUri: { uri: string } }

/** Body de creación de Loyalty Class. */
export type LoyaltyClassBody = {
  id: string
  issuerName: string
  programName: string
  reviewStatus: 'UNDER_REVIEW'
  programLogo?: ImageRef
}

/** Bloque de puntos de fidelidad (sellos). */
type LoyaltyPoints = {
  label: string
  balance: { string: string }
}

/** Body de creación de Loyalty Object. */
export type LoyaltyObjectBody = {
  id: string
  classId: string
  state: 'ACTIVE'
  accountName: string
  accountId: string
  loyaltyPoints: LoyaltyPoints
  heroImage: ImageRef
}

/** Body parcial para PATCH del Loyalty Object. */
export type PatchObjectBody = {
  loyaltyPoints: LoyaltyPoints
  heroImage: ImageRef
}

/** Claims del Save JWT (botón "Save to Google Wallet"). */
export type SaveJwtClaims = {
  iss: string
  aud: 'google'
  typ: 'savetowallet'
  iat: number
  origins: string[]
  payload: { loyaltyObjects: Array<{ id: string }> }
}

// ─── Entrada de dominio para las operaciones ────────────────────────────────────

type TenantInfo = { id: string; name: string; logoUrl: string | null }
type CustomerInfo = { id: string; name: string | null; phone: string }
type CardInfo = { id: string; currentStamps: number }
type ProgramInfo = { stampsRequired: number; rewardDescription: string }

// ─── Helpers de IDs ─────────────────────────────────────────────────────────────

/** classId = `${issuerId}.tenant_${tenantId}` */
export function buildClassId(issuerId: string, tenantId: string): string {
  return `${issuerId}.tenant_${tenantId}`
}

/** objectId = `${issuerId}.card_${cardId}` */
export function buildObjectId(issuerId: string, cardId: string): string {
  return `${issuerId}.card_${cardId}`
}

// ─── Helpers PUROS ───────────────────────────────────────────────────────────────

/**
 * URL de la imagen "strip" (hero) del pase, versionada por número de sellos
 * para forzar el refresco de caché en Google al cambiar el balance.
 * El endpoint lo sirve otro agente: `/api/wallet/strip/:cardId?s=:stamps`.
 */
export function stripImageUrl(appUrl: string, cardId: string, stamps: number): string {
  return `${appUrl}/api/wallet/strip/${encodeURIComponent(cardId)}?s=${stamps}`
}

/** Arma el body de la Loyalty Class. */
export function buildLoyaltyClass(args: {
  classId: string
  tenant: TenantInfo
}): LoyaltyClassBody {
  const { classId, tenant } = args
  return {
    id: classId,
    issuerName: tenant.name,
    programName: `Sellio · ${tenant.name}`,
    reviewStatus: 'UNDER_REVIEW',
    programLogo: tenant.logoUrl ? { sourceUri: { uri: tenant.logoUrl } } : undefined,
  }
}

/** Arma el body del Loyalty Object. */
export function buildLoyaltyObject(args: {
  objectId: string
  classId: string
  customer: CustomerInfo
  stamps: number
  required: number
  stripUrl: string
}): LoyaltyObjectBody {
  const { objectId, classId, customer, stamps, required, stripUrl } = args
  return {
    id: objectId,
    classId,
    state: 'ACTIVE',
    accountName: customer.name ?? customer.phone,
    accountId: customer.id,
    loyaltyPoints: {
      label: 'Sellos',
      balance: { string: `${stamps}/${required}` },
    },
    heroImage: { sourceUri: { uri: stripUrl } },
  }
}

/** Arma el body parcial para el PATCH del Loyalty Object. */
export function buildPatchBody(args: {
  stamps: number
  required: number
  stripUrl: string
}): PatchObjectBody {
  const { stamps, required, stripUrl } = args
  return {
    loyaltyPoints: {
      label: 'Sellos',
      balance: { string: `${stamps}/${required}` },
    },
    heroImage: { sourceUri: { uri: stripUrl } },
  }
}

/** Arma los claims del Save JWT (sin firmar). */
export function buildSaveJwtClaims(args: {
  clientEmail: string
  appUrl: string
  objectId: string
  nowSeconds: number
}): SaveJwtClaims {
  const { clientEmail, appUrl, objectId, nowSeconds } = args
  return {
    iss: clientEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: nowSeconds,
    origins: [appUrl],
    payload: { loyaltyObjects: [{ id: objectId }] },
  }
}

// ─── Firma del Save JWT ──────────────────────────────────────────────────────────

/**
 * Firma el Save JWT para un objeto dado y devuelve la URL final de "Save to
 * Google Wallet". Devuelve null si no hay credenciales configuradas (NO-OP-safe).
 */
export function signSaveJwt(objectId: string): string | null {
  const config = getWalletConfig()
  if (!config) return null

  const claims = buildSaveJwtClaims({
    clientEmail: config.clientEmail,
    appUrl: config.appUrl,
    objectId,
    nowSeconds: Math.floor(Date.now() / 1000),
  })

  const token = jwt.sign(claims, config.privateKey, { algorithm: 'RS256' })
  return `https://pay.google.com/gp/v/save/${token}`
}

// ─── Operaciones (async, usan la red) ────────────────────────────────────────────

/**
 * Crea la Loyalty Class del tenant si no existe (idempotente).
 * Requiere configuración válida; los callers públicos ya lo verifican.
 */
export async function ensureClass(tenant: TenantInfo): Promise<{ classId: string }> {
  const config = getWalletConfig()
  if (!config) throw new Error('[google-wallet] ensureClass llamado sin configuración')

  const classId = buildClassId(config.issuerId, tenant.id)
  const body = buildLoyaltyClass({ classId, tenant })
  // 409 (exists) se trata como éxito idempotente dentro de walletRequest.
  await walletRequest<LoyaltyClassBody>('POST', '/loyaltyClass', body)
  return { classId }
}

/**
 * Crea la Loyalty Class y el Loyalty Object si faltan (idempotente).
 * Devuelve los ids generados para persistirlos en `wallet_passes`.
 */
export async function ensureObject(args: {
  card: CardInfo
  customer: CustomerInfo
  tenant: TenantInfo
  program: ProgramInfo
}): Promise<{ classId: string; objectId: string }> {
  const config = getWalletConfig()
  if (!config) throw new Error('[google-wallet] ensureObject llamado sin configuración')

  const { card, customer, tenant, program } = args
  const { classId } = await ensureClass(tenant)

  const objectId = buildObjectId(config.issuerId, card.id)
  const stripUrl = stripImageUrl(config.appUrl, card.id, card.currentStamps)
  const body = buildLoyaltyObject({
    objectId,
    classId,
    customer,
    stamps: card.currentStamps,
    required: program.stampsRequired,
    stripUrl,
  })
  await walletRequest<LoyaltyObjectBody>('POST', '/loyaltyObject', body)

  return { classId, objectId }
}

/**
 * Actualiza el balance de sellos (y la imagen versionada) de un Loyalty Object.
 */
export async function patchObject(args: {
  objectId: string
  stamps: number
  required: number
  cardId: string
}): Promise<void> {
  const config = getWalletConfig()
  if (!config) return

  const { objectId, stamps, required, cardId } = args
  const stripUrl = stripImageUrl(config.appUrl, cardId, stamps)
  const body = buildPatchBody({ stamps, required, stripUrl })
  await walletRequest<PatchObjectBody>('PATCH', `/loyaltyObject/${objectId}`, body)
}

/**
 * Agrega un mensaje al Loyalty Object (ej. "¡Recompensa lista!").
 * NO-OP si faltan credenciales (defensa simétrica con patchObject: aunque sus
 * callers ya hacen el guard, evita que un futuro caller dispare una excepción).
 */
export async function addRewardMessage(objectId: string, header: string, body: string): Promise<void> {
  if (!getWalletConfig()) return
  await walletRequest<unknown>('POST', `/loyaltyObject/${objectId}/addMessage`, {
    message: { header, body },
  })
}
