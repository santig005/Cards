import { describe, it, expect } from 'vitest'
import { buildLast7Days } from '../../src/lib/analytics'

const TZ = 'America/Bogota' // UTC-5, sin DST

describe('buildLast7Days', () => {
  it('devuelve exactamente 7 días, el último es "hoy"', () => {
    const now = new Date('2026-06-10T15:00:00Z') // 10:00 en Bogotá → 2026-06-10
    const counts = new Map<string, number>([
      ['2026-06-10', 5],
      ['2026-06-08', 2],
    ])
    const result = buildLast7Days(now, counts, TZ)

    expect(result).toHaveLength(7)
    expect(result[6].count).toBe(5) // hoy
    expect(result[4].count).toBe(2) // hace 2 días (2026-06-08)
    expect(result[0].count).toBe(0) // 2026-06-04, sin datos
    expect(result.reduce((s, d) => s + d.count, 0)).toBe(7)
  })

  it('respeta la zona horaria en el borde de medianoche UTC', () => {
    // 02:00 UTC = 21:00 del día ANTERIOR en Bogotá → "hoy" local = 2026-06-09
    const now = new Date('2026-06-10T02:00:00Z')
    const counts = new Map<string, number>([['2026-06-09', 3]])
    const result = buildLast7Days(now, counts, TZ)

    expect(result[6].count).toBe(3)
  })

  it('rellena con 0 cuando no hay datos', () => {
    const now = new Date('2026-06-10T15:00:00Z')
    const result = buildLast7Days(now, new Map(), TZ)
    expect(result.every((d) => d.count === 0)).toBe(true)
    expect(result.every((d) => typeof d.label === 'string' && d.label.length === 1)).toBe(true)
  })
})
