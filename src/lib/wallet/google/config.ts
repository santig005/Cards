// Configuración del servicio de Google Wallet.
// Lee las credenciales del service account desde variables de entorno.
// Diseñado para ser NO-OP-safe: si faltan credenciales, `getWalletConfig()`
// devuelve null y todas las operaciones del servicio se vuelven no-ops.

// ─── Constantes de la API REST de Google Wallet ───────────────────────────────

/** Base de la API REST de Google Wallet Objects. */
export const WALLET_API_BASE = 'https://walletobjects.googleapis.com/walletobjects/v1'

/** Scope OAuth2 requerido para emitir/gestionar objetos de Wallet. */
export const WALLET_SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer'

// ─── Tipo de configuración resuelta ────────────────────────────────────────────

/** Configuración válida del service account de Google Wallet. */
export type WalletConfig = {
  /** ID numérico del emisor (issuer) en Google Wallet. */
  issuerId: string
  /** Email del service account (claim `iss` del Save JWT). */
  clientEmail: string
  /** Private key PEM ya des-escapada (con saltos de línea reales). */
  privateKey: string
  /** URL pública de la app (origen permitido para el Save JWT). */
  appUrl: string
}

// ─── Lectura de entorno ─────────────────────────────────────────────────────────

/**
 * Indica si Google Wallet está configurado.
 * Requiere issuer id + email del service account + private key.
 */
export function isGoogleWalletConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_WALLET_ISSUER_ID &&
      process.env.GOOGLE_WALLET_SA_EMAIL &&
      process.env.GOOGLE_WALLET_SA_PRIVATE_KEY,
  )
}

/**
 * Devuelve la configuración resuelta o null si falta alguna credencial.
 * La private key se almacena con `\n` escapados en el .env, así que aquí se
 * des-escapan a saltos de línea reales para que la firma RS256 funcione.
 */
export function getWalletConfig(): WalletConfig | null {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID
  const clientEmail = process.env.GOOGLE_WALLET_SA_EMAIL
  const rawPrivateKey = process.env.GOOGLE_WALLET_SA_PRIVATE_KEY

  if (!issuerId || !clientEmail || !rawPrivateKey) return null

  return {
    issuerId,
    clientEmail,
    // Des-escapar `\n` (formato de una sola línea típico en .env / Vercel).
    privateKey: rawPrivateKey.replace(/\\n/g, '\n'),
    // NEXT_PUBLIC_APP_URL ya existe en el proyecto; fallback razonable en dev.
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  }
}
