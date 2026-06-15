// Canal Web Push — implementa NotificationChannel usando la librería `web-push`.
// Gestiona la configuración VAPID una sola vez (lazy, a nivel de módulo)
// y poda automáticamente las suscripciones muertas (HTTP 404/410).

import webpush from 'web-push'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/drizzle/db'
import { pushSubscriptions } from '@/lib/drizzle/schema'
import type { NotificationChannel, NotificationPayload } from './types'

// ─── Configuración VAPID (lazy, una sola vez por proceso) ────────────────────

/** true después de la primera llamada a initVapid() */
let vapidConfigured = false

/**
 * Inicializa webpush.setVapidDetails una única vez.
 * Si faltan las variables de entorno, registra un aviso y retorna false
 * para que el canal actúe como NO-OP sin romper el arranque de la app.
 */
function initVapid(): boolean {
  if (vapidConfigured) return true

  const subject = process.env.VAPID_SUBJECT
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!subject || !publicKey || !privateKey) {
    console.warn(
      '[web-push] VAPID keys missing, skipping — define VAPID_SUBJECT, VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY'
    )
    return false
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidConfigured = true
  return true
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Interpreta el rechazo de sendNotification para saber si la suscripción
 * expiró o fue revocada (códigos 404 y 410 son "suscripción muerta").
 */
function isExpiredSubscription(err: unknown): boolean {
  if (err !== null && typeof err === 'object' && 'statusCode' in err) {
    const code = (err as { statusCode: number }).statusCode
    return code === 404 || code === 410
  }
  return false
}

// ─── Implementación del canal ─────────────────────────────────────────────────

/**
 * Canal Web Push de Sellio.
 * - Lee todas las suscripciones activas del cliente desde `push_subscriptions`.
 * - Despacha en paralelo con Promise.allSettled (un fallo no cancela el resto).
 * - Borra las suscripciones expiradas (404/410) automáticamente.
 */
export const webPushChannel: NotificationChannel = {
  name: 'web_push',

  async send({
    customerId,
    payload,
  }: {
    tenantId: string
    customerId: string
    payload: NotificationPayload
  }): Promise<void> {
    // Si no hay claves VAPID configuradas, actuar como NO-OP
    if (!initVapid()) return

    // Leer todas las suscripciones activas del cliente
    const rows = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.customerId, customerId))

    if (rows.length === 0) return

    const serializedPayload = JSON.stringify(payload)

    // Despachar a todos los endpoints en paralelo; un fallo no cancela el resto
    const results = await Promise.allSettled(
      rows.map((row) =>
        webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: {
              p256dh: row.p256dh,
              auth: row.auth,
            },
          },
          serializedPayload
        )
      )
    )

    // Procesar resultados: podar suscripciones muertas, loguear el resto de errores
    await Promise.allSettled(
      results.map(async (result, index) => {
        if (result.status === 'fulfilled') return

        const err = result.reason
        const row = rows[index]

        if (isExpiredSubscription(err)) {
          // Suscripción expirada o revocada — borrar para no volver a intentar
          await db
            .delete(pushSubscriptions)
            .where(
              and(
                eq(pushSubscriptions.endpoint, row.endpoint),
                eq(pushSubscriptions.customerId, customerId)
              )
            )
        } else {
          // Error inesperado: loguear y continuar
          console.error(
            `[web-push] Error al enviar a endpoint ${row.endpoint}:`,
            err
          )
        }
      })
    )
  },
}
