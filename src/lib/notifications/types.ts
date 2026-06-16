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

/** Argumentos que recibe un canal al enviar una notificación */
export type NotificationSendArgs = {
  tenantId: string
  customerId: string
  /**
   * Tipo de notificación. Permite a los canales decidir comportamiento según el
   * evento (ej. el canal de Google Wallet agrega un mensaje sólo en 'reward').
   * Los canales que no lo necesiten (ej. web push) pueden ignorarlo.
   */
  kind: NotificationKind
  payload: NotificationPayload
}

/** Contrato que debe implementar cada canal de notificación */
export interface NotificationChannel {
  /** Nombre identificador del canal (para logs y futuros toggles) */
  name: string
  /** Envía la notificación al cliente indicado dentro del tenant */
  send(args: NotificationSendArgs): Promise<void>
}
