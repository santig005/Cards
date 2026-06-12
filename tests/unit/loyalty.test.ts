import { describe, it, expect } from 'vitest'
import {
  normalizePhoneToE164,
  applyStamp,
  canRedeem,
  isWithinCooldown,
  DEFAULT_COUNTRY_CODE,
} from '../../src/lib/loyalty'

describe('normalizePhoneToE164', () => {
  it('usa Colombia por defecto (móvil local sin +)', () => {
    expect(normalizePhoneToE164('3001234567')).toBe('+573001234567')
  })

  it('respeta el indicativo cuando el usuario escribe el +', () => {
    // Número de EE.UU. en E.164 — se preserva aunque el país base sea CO.
    expect(normalizePhoneToE164('+12015550123')).toBe('+12015550123')
  })

  it('limpia espacios, guiones y paréntesis', () => {
    expect(normalizePhoneToE164('+57 (300) 123-4567')).toBe('+573001234567')
    expect(normalizePhoneToE164('300 123 4567')).toBe('+573001234567')
  })

  // México: móvil local de 10 dígitos. Con el viejo default '+57' esto producía
  // '+575512345678' (un número colombiano inválido); ahora se parsea como MX.
  it('normaliza un móvil de México con country_code MX', () => {
    expect(normalizePhoneToE164('5512345678', 'MX')).toBe('+525512345678')
    // Sin pasar MX, el mismo input se interpretaría como CO (regresión que evitamos).
    expect(normalizePhoneToE164('5512345678', 'MX')).not.toBe('+575512345678')
  })

  // EE.UU.: número local de 10 dígitos (área 201). Antes el default lo volvía
  // '+572015550123'; ahora es un E.164 válido de US.
  it('normaliza un número local de EE.UU. con country_code US', () => {
    expect(normalizePhoneToE164('2015550123', 'US')).toBe('+12015550123')
  })

  it('acepta el ISO en minúsculas', () => {
    expect(normalizePhoneToE164('5512345678', 'mx')).toBe('+525512345678')
  })

  it('rechaza números inválidos para el país (longitud incorrecta)', () => {
    expect(normalizePhoneToE164('12345')).toBeNull()
    expect(normalizePhoneToE164('+')).toBeNull()
    expect(normalizePhoneToE164('')).toBeNull()
    // 9 dígitos no es un móvil colombiano válido.
    expect(normalizePhoneToE164('300123456')).toBeNull()
  })

  it('expone CO como país por defecto', () => {
    expect(DEFAULT_COUNTRY_CODE).toBe('CO')
  })
})

describe('applyStamp', () => {
  it('suma un sello cuando la tarjeta no está llena', () => {
    expect(applyStamp(3, 10)).toEqual({ ok: true, next: 4, full: false })
  })

  it('marca full cuando el sello completa la tarjeta', () => {
    expect(applyStamp(9, 10)).toEqual({ ok: true, next: 10, full: true })
  })

  it('NO sella de más: rechaza si la tarjeta ya está llena (no auto-canjea)', () => {
    expect(applyStamp(10, 10)).toEqual({ ok: false, next: 10, full: true })
    expect(applyStamp(11, 10)).toEqual({ ok: false, next: 11, full: true })
  })
})

describe('canRedeem', () => {
  it('permite canjear solo con los sellos requeridos', () => {
    expect(canRedeem(10, 10)).toBe(true)
    expect(canRedeem(11, 10)).toBe(true)
    expect(canRedeem(9, 10)).toBe(false)
  })

  it('nunca permite canjear con un requerido inválido', () => {
    expect(canRedeem(5, 0)).toBe(false)
  })
})

describe('isWithinCooldown', () => {
  const now = new Date('2026-06-10T12:00:00Z')

  it('es true si el último sello fue hace menos del cooldown', () => {
    const last = new Date(now.getTime() - 1000) // hace 1s
    expect(isWithinCooldown(last, now, 3000)).toBe(true)
  })

  it('es false si ya pasó el cooldown', () => {
    const last = new Date(now.getTime() - 4000) // hace 4s
    expect(isWithinCooldown(last, now, 3000)).toBe(false)
  })

  it('es false cuando no hay sello previo', () => {
    expect(isWithinCooldown(null, now, 3000)).toBe(false)
    expect(isWithinCooldown(undefined, now, 3000)).toBe(false)
  })
})
