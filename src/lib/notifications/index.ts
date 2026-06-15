// Orquestador de notificaciones de Sellio.
// Fan-out a todos los canales activos respetando las preferencias del cliente.
// Para agregar un canal nuevo (WhatsApp, Wallet, email…) basta con añadirlo
// al array `channels` — el resto del código no cambia.

import { eq } from 'drizzle-orm'
import { db } from '@/lib/drizzle/db'
import { customers } from '@/lib/drizzle/schema'
import { webPushChannel } from './web-push-channel'
import type { NotificationChannel, NotificationKind, NotificationPayload } from './types'

// Re-exportar tipos y canal por conveniencia para quien importe desde aquí
export { webPushChannel }
export type { NotificationChannel, NotificationKind, NotificationPayload }

// ─── Canales activos ──────────────────────────────────────────────────────────

/**
 * Lista de canales de notificación habilitados.
 * Extensible sin modificar notifyCustomer: agregar WhatsApp, Apple Wallet, etc.
 */
const channels: NotificationChannel[] = [webPushChannel]

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Envía una notificación al cliente, respetando sus preferencias.
 *
 * Flujo:
 * 1. Lee el registro del cliente para verificar preferencias.
 * 2. Si la preferencia está desactivada (o el cliente no existe), retorna sin hacer nada.
 * 3. Hace fan-out a todos los canales activos en paralelo con Promise.allSettled,
 *    de modo que un canal caído no bloquea los demás.
 *
 * @param tenantId   - ID del negocio (tenant) dueño de la tarjeta.
 * @param customerId - ID del cliente que recibirá la notificación.
 * @param kind       - Tipo de notificación: 'reward' | 'new_stamp'.
 * @param payload    - Contenido visible: título, cuerpo y URL de destino.
 */
export async function notifyCustomer({
  tenantId,
  customerId,
  kind,
  payload,
}: {
  tenantId: string
  customerId: string
  kind: NotificationKind
  payload: NotificationPayload
}): Promise<void> {
  // Leer preferencias del cliente (db bypassea RLS — sólo se usa server-side)
  const [customer] = await db
    .select({
      notifyReward: customers.notifyReward,
      notifyNewStamp: customers.notifyNewStamp,
    })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1)

  // Cliente no encontrado → no hay a quien notificar
  if (!customer) return

  // Respetar preferencias individuales
  if (kind === 'reward' && !customer.notifyReward) return
  if (kind === 'new_stamp' && !customer.notifyNewStamp) return

  // Fan-out a todos los canales; un canal caído no aborta los demás
  await Promise.allSettled(
    channels.map((channel) =>
      channel.send({ tenantId, customerId, payload }).catch((err: unknown) => {
        // Capa de seguridad extra: si el canal lanza síncronamente o promesa rechazada
        // no capturada internamente, lo registramos aquí sin propagar.
        console.error(`[notifications] Canal "${channel.name}" falló:`, err)
      })
    )
  )
}
