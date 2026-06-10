import { describe, it, expect } from 'vitest'
import {
  normalizePhoneToE164,
  applyStamp,
  canRedeem,
  isWithinCooldown,
  DEFAULT_COUNTRY_CODE,
} from '../../src/lib/loyalty'

describe('normalizePhoneToE164', () => {
  it('antepone el código de país por defecto (+57) cuando no hay +', () => {
    expect(normalizePhoneToE164('3001234567')).toBe('+573001234567')
  })

  it('respeta el + y el código que ya trae el usuario', () => {
    expect(normalizePhoneToE164('+13001234567')).toBe('+13001234567')
  })

  it('limpia espacios, guiones y paréntesis', () => {
    expect(normalizePhoneToE164('+57 (300) 123-4567')).toBe('+573001234567')
    expect(normalizePhoneToE164('300 123 4567')).toBe('+573001234567')
  })

  it('devuelve null si hay menos de 7 dígitos', () => {
    expect(normalizePhoneToE164('12345')).toBeNull()
    expect(normalizePhoneToE164('+')).toBeNull()
  })

  it('permite sobreescribir el código de país por defecto', () => {
    expect(normalizePhoneToE164('5512345678', '+52')).toBe('+525512345678')
  })

  it('expone +57 como default de Colombia', () => {
    expect(DEFAULT_COUNTRY_CODE).toBe('+57')
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
