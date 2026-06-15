/**
 * Utilidades cliente para Web Push.
 * Este módulo NO tiene 'use server' — se ejecuta solo en el navegador.
 */

// Forma del objeto que devuelve `subscription.toJSON()` en el navegador.
export type PushSubscriptionPayload = {
  endpoint?: string
  keys?: {
    p256dh?: string
    auth?: string
  }
}

/**
 * Convierte una clave VAPID en formato base64url a Uint8Array,
 * formato requerido por `applicationServerKey` de la Web Push API.
 * Implementación canónica estándar.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  // Padding para que base64url sea válido como base64 estándar
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Verifica si el navegador soporta Web Push notifications.
 */
export function isPushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Suscribe al usuario a Web Push usando la clave VAPID pública dada.
 * Lanza si `pushManager.subscribe` falla (ej. permiso denegado en el SO).
 * El permiso de Notification debe pedirse ANTES de llamar esta función.
 */
export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscriptionPayload> {
  const registration = await navigator.serviceWorker.ready
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    // Cast necesario: TypeScript estricto requiere ArrayBuffer, pero Uint8Array con
    // buffer SharedArrayBuffer-compatible falla la asignación directa.
    applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
  })

  // toJSON() devuelve { endpoint, keys: { p256dh, auth } }
  return subscription.toJSON() as PushSubscriptionPayload
}

/**
 * Obtiene la suscripción Web Push activa del navegador, o null si no existe.
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}
