import { describe, it, expect } from 'vitest'
import { buildLast7Days } from '../../src/lib/analytics'

const TZ = 'America/Bogota' // UTC-5, sin DST

describe('buildLast7Days', () => {
  it('devuelve exactamente 7 dias, el ultimo es hoy', () => {
    const now = new Date('2026-06-10T15:00:00Z')
    const counts = new Map([['2026-06-10', 5],['2026-06-08', 2]])
    const result = buildLast7Days(now, counts, TZ)
    expect(result).toHaveLength(7)
    expect(result[6].count).toBe(5)
    expect(result[4].count).toBe(2)
    expect(result[0].count).toBe(0)
    expect(result.reduce((s, d) => s + d.count, 0)).toBe(7)
  })

  it('respeta la zona horaria en medianoche UTC', () => {
    const now = new Date('2026-06-10T02:00:00Z')
    const counts = new Map([['2026-06-09', 3]])
    const result = buildLast7Days(now, counts, TZ)
    expect(result[6].count).toBe(3)
  })

  it('rellena con 0 cuando no hay datos', () => {
    const now = new Date('2026-06-10T15:00:00Z')
    const result = buildLast7Days(now, new Map(), TZ)
    expect(result.every((d) => d.count === 0)).toBe(true)
    expect(result.every((d) => typeof d.label === 'string' && d.label.length >= 1)).toBe(true)
  })

  it('genera labels en espanol por defecto', () => {
    const now = new Date('2026-06-10T15:00:00Z')
    const result = buildLast7Days(now, new Map(), TZ, 'es')
    expect(typeof result[6].label).toBe('string')
    expect(result[6].label.length).toBeGreaterThan(0)
  })

  it('genera labels validos en en', () => {
    const now = new Date('2026-06-10T15:00:00Z')
    const result = buildLast7Days(now, new Map(), TZ, 'en')
    expect(result).toHaveLength(7)
    result.forEach((d) => expect(typeof d.label).toBe('string'))
  })

  it('genera labels en portugues', () => {
    const now = new Date('2026-06-10T15:00:00Z')
    const result = buildLast7Days(now, new Map(), TZ, 'pt')
    expect(result).toHaveLength(7)
    result.forEach((d) => {
      expect(typeof d.label).toBe('string')
      expect(d.label.length).toBeGreaterThan(0)
    })
  })
})