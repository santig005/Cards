// Cliente HTTP autenticado contra la API REST de Google Wallet.
// Memoiza un GoogleAuth client por proceso y traduce los códigos de estado
// relevantes (409 = ya existe, 404 = no existe) a un resultado discriminado,
// para que las operaciones de `passes.ts` los manejen sin try/catch ruidosos.

import { GoogleAuth } from 'google-auth-library'
import { getWalletConfig, WALLET_API_BASE, WALLET_SCOPE } from './config'

// ─── Tipos ─────────────────────────────────────────────────────────────────────

/** Método HTTP soportado por las operaciones de Wallet. */
type HttpMethod = 'GET' | 'POST' | 'PATCH'

/**
 * Resultado discriminado de una request a Wallet.
 * - 'ok': éxito (2xx), incluye el body tipado.
 * - 'exists': el recurso ya existía (409) — tratado como éxito idempotente.
 * - 'notfound': el recurso no existe (404) — esperado en algunos GET.
 */
export type WalletResult<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'exists' }
  | { kind: 'notfound' }

/** Cliente autorizado mínimo que sabemos que expone `request`. */
type AuthedClient = {
  request<T>(opts: { url: string; method: HttpMethod; data?: unknown }): Promise<{ data: T }>
}

// ─── Memoización del client ────────────────────────────────────────────────────

let cachedAuth: GoogleAuth | null = null

/**
 * Devuelve un GoogleAuth memoizado con las credenciales del service account.
 * Lanza si no hay configuración: los callers deben verificar
 * `isGoogleWalletConfigured()` antes (el servicio público ya lo hace).
 */
function getAuth(): GoogleAuth {
  if (cachedAuth) return cachedAuth

  const config = getWalletConfig()
  if (!config) {
    throw new Error('[google-wallet] credenciales ausentes: getAuthedClient() no debe llamarse sin configurar')
  }

  cachedAuth = new GoogleAuth({
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    },
    scopes: [WALLET_SCOPE],
  })

  return cachedAuth
}

/**
 * Obtiene un client autorizado para hacer requests firmadas con OAuth2.
 * `getClient()` de google-auth-library expone `request`, que tipamos vía
 * la interfaz mínima `AuthedClient` para no recurrir a `any`.
 */
export async function getAuthedClient(): Promise<AuthedClient> {
  const auth = getAuth()
  const client = await auth.getClient()
  return client as unknown as AuthedClient
}

// ─── Helpers de error ───────────────────────────────────────────────────────────

/** Extrae el HTTP status de un error desconocido de gaxios. */
function statusOf(err: unknown): number | null {
  if (err !== null && typeof err === 'object') {
    // gaxios expone `response.status` y a veces `status` directo.
    const e = err as { status?: unknown; response?: { status?: unknown } }
    if (typeof e.status === 'number') return e.status
    if (e.response && typeof e.response.status === 'number') return e.response.status
  }
  return null
}

// ─── Request principal ──────────────────────────────────────────────────────────

/**
 * Ejecuta una request a la API de Wallet y devuelve un resultado discriminado.
 * - 409 → { kind: 'exists' } (creaciones idempotentes).
 * - 404 → { kind: 'notfound' } (GET de recurso ausente).
 * - Otros errores se propagan (los maneja el fan-out de notificaciones).
 *
 * @param method - Verbo HTTP.
 * @param path   - Ruta relativa a WALLET_API_BASE (ej. '/loyaltyClass').
 * @param data   - Body opcional para POST/PATCH.
 */
export async function walletRequest<T>(
  method: HttpMethod,
  path: string,
  data?: unknown,
): Promise<WalletResult<T>> {
  const client = await getAuthedClient()
  const url = `${WALLET_API_BASE}${path}`

  try {
    const res = await client.request<T>({ url, method, data })
    return { kind: 'ok', data: res.data }
  } catch (err: unknown) {
    const status = statusOf(err)
    if (status === 409) return { kind: 'exists' }
    if (status === 404) return { kind: 'notfound' }
    throw err
  }
}
