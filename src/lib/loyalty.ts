/**
 * Lógica de dominio PURA de fidelización (sin IO ni DB), para poder testearla
 * sin levantar Supabase. Las server actions la consumen.
 */

// País por defecto cuando el cliente no incluye código (Colombia).
export const DEFAULT_COUNTRY_CODE = '+57'

/**
 * Normaliza un teléfono a formato E.164 (lo que exige Supabase Auth).
 * Devuelve null si no hay dígitos suficientes para ser un número válido.
 */
export function normalizePhoneToE164(
  raw: string,
  defaultCode: string = DEFAULT_COUNTRY_CODE
): string | null {
  const trimmed = raw.trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 7) return null
  return hasPlus ? `+${digits}` : `${defaultCode}${digits}`
}

export interface StampOutcome {
  /** false si la tarjeta ya estaba llena (no se debe sellar de más). */
  ok: boolean
  /** Conteo de sellos resultante. */
  next: number
  /** true si con este sello la tarjeta quedó completa. */
  full: boolean
}

/**
 * Calcula el efecto de agregar un sello. No reinicia ni canjea: la tarjeta llena
 * espera a un canje MANUAL (ver `canRedeem`). Esto evita resetear sin que el
 * cajero confirme que entregó el premio.
 */
export function applyStamp(current: number, required: number): StampOutcome {
  if (current >= required) return { ok: false, next: current, full: true }
  const next = current + 1
  return { ok: true, next, full: next >= required }
}

/** ¿La tarjeta tiene los sellos necesarios para canjear el premio? */
export function canRedeem(current: number, required: number): boolean {
  return required > 0 && current >= required
}

/**
 * ¿La acción cae dentro de la ventana de cooldown? (anti doble-tap / fraude)
 * `lastAt` es el momento del último sello; null si no hay ninguno.
 */
export function isWithinCooldown(
  lastAt: Date | null | undefined,
  now: Date,
  ms: number
): boolean {
  if (!lastAt) return false
  return now.getTime() - lastAt.getTime() < ms
}
