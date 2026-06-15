// Tipos compartidos para el sistema de notificaciones de Sellio.
// Diseñado como interfaz de canal desde el día 1 para poder agregar
// WhatsApp, Apple Wallet, etc. sin cambiar el código del orquestador.

/** Tipo de notificación que determina qué preferencia del cliente se respeta */
export type NotificationKind = 'reward' | 'new_stamp'

/** Payload que se serializa y envía al navegador (o a cualquier canal) */
export type NotificationPayload = {
  title: string
  body: string
  url: string
}

/** Contrato que debe implementar cada canal de notificación */
export interface NotificationChannel {
  /** Nombre identificador del canal (para logs y futuros toggles) */
  name: string
  /** Envía la notificación al cliente indicado dentro del tenant */
  send(args: {
    tenantId: string
    customerId: string
    payload: NotificationPayload
  }): Promise<void>
}
