/**
 * Lógica de dominio PURA de fidelización (sin IO ni DB), para poder testearla
 * sin levantar Supabase. Las server actions la consumen.
 */

import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'
import { DEFAULT_COUNTRY } from '@/lib/countries'

// País por defecto (ISO 3166-1 alpha-2) cuando el negocio no tiene uno seteado.
// Coincide con el default de la columna tenants.country_code (ver ADR-007).
export const DEFAULT_COUNTRY_CODE = DEFAULT_COUNTRY // 'CO'

/**
 * Normaliza un teléfono a formato E.164 (lo que exige Supabase Auth) usando el
 * país del negocio (`tenants.country_code`, ISO 3166-1 alpha-2).
 *
 * - Si el usuario escribe el `+` con su indicativo, se respeta ese país.
 * - Si escribe el número local sin `+`, se interpreta con el país del negocio.
 *
 * Usa libphonenumber-js para parsear y validar (largos por país, prefijos
 * móviles, etc.), reemplazando el viejo "anteponer +57" que fallaba para
 * cualquier país distinto de Colombia.
 *
 * Devuelve el número en E.164 (ej. '+573001234567') o null si no es válido.
 */
export function normalizePhoneToE164(
  raw: string,
  countryCode: string = DEFAULT_COUNTRY_CODE
): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const parsed = parsePhoneNumberFromString(trimmed, countryCode.toUpperCase() as CountryCode)
  if (!parsed || !parsed.isValid()) return null

  return parsed.number // E.164
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
