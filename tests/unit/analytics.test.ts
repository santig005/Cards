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

  // ── Multi-país: el bucket de "hoy" depende de la timezone del tenant ────────
  it('respeta la timezone del tenant: el mismo instante cae en días distintos', () => {
    // 03:00 UTC. En Bogotá (UTC-5) son las 22:00 del día ANTERIOR (2026-06-09);
    // en Tokio (UTC+9) ya son las 12:00 del 2026-06-10.
    const now = new Date('2026-06-10T03:00:00Z')
    const counts = new Map<string, number>([
      ['2026-06-09', 4],
      ['2026-06-10', 9],
    ])

    const bogota = buildLast7Days(now, counts, 'America/Bogota')
    const tokyo = buildLast7Days(now, counts, 'Asia/Tokyo')

    // "Hoy" según cada zona apunta a un día calendario diferente.
    expect(bogota[6].count).toBe(4) // hoy en Bogotá = 2026-06-09
    expect(tokyo[6].count).toBe(9) // hoy en Tokio = 2026-06-10
  })

  it('agrupa por día local según la timezone (México vs Colombia)', () => {
    // 04:30 UTC: en CDMX (UTC-6) son las 22:30 del 2026-06-09;
    // en Bogotá (UTC-5) son las 23:30 del mismo 2026-06-09 → ambos 06-09 aquí,
    // pero verificamos que la TZ se propaga usando un evento del borde.
    const now = new Date('2026-06-10T05:30:00Z') // CDMX 23:30 06-09, Bogotá 00:30 06-10
    const counts = new Map<string, number>([
      ['2026-06-09', 2],
      ['2026-06-10', 7],
    ])

    const mexico = buildLast7Days(now, counts, 'America/Mexico_City')
    const bogota = buildLast7Days(now, counts, 'America/Bogota')

    expect(mexico[6].count).toBe(2) // hoy en CDMX = 2026-06-09
    expect(bogota[6].count).toBe(7) // hoy en Bogotá = 2026-06-10
  })

  it('localiza el label del día de semana según el locale', () => {
    const now = new Date('2026-06-10T15:00:00Z')
    const es = buildLast7Days(now, new Map(), TZ, 'es')
    const en = buildLast7Days(now, new Map(), TZ, 'en')
    // Ambos producen 7 labels de 1 carácter (narrow), posiblemente distintos por idioma.
    expect(es).toHaveLength(7)
    expect(en).toHaveLength(7)
    expect(es.every((d) => d.label.length === 1)).toBe(true)
    expect(en.every((d) => d.label.length === 1)).toBe(true)
  })
})
