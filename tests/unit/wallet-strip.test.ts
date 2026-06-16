// Tests unitarios de buildStripSvg — función pura, sin red ni sharp.
// Se mockean 'sharp' y el módulo de DB para que el import del route no requiera
// conexión real ni la librería de procesado de imágenes en el entorno de tests.

import { describe, it, expect, vi, beforeAll } from 'vitest'

// ── Mocks declarados ANTES de que Vitest importe el módulo bajo test ──────────

// Mock de sharp: la función pura buildStripSvg no lo usa, pero el módulo lo
// importa en el nivel superior, así que Vitest necesita resolverlo.
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    png: vi.fn(() => ({
      toBuffer: vi.fn(async () => Buffer.from('')),
    })),
  })),
}))

// Mock del cliente de base de datos: mismo motivo (import top-level).
vi.mock('@/lib/drizzle/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(async () => []),
            })),
          })),
        })),
      })),
    })),
  },
}))

// ─────────────────────────────────────────────────────────────────────────────

let buildStripSvg: (opts: { stamps: number; required: number; businessName: string }) => string

beforeAll(async () => {
  const mod = await import('@/app/api/wallet/strip/[cardId]/route')
  buildStripSvg = mod.buildStripSvg
})

// ─── Caso base: tarjeta en curso ──────────────────────────────────────────────

describe('buildStripSvg — caso en curso (3/10)', () => {
  it('es un SVG válido con el ancho correcto', () => {
    const svg = buildStripSvg({ stamps: 3, required: 10, businessName: 'Café Luna' })
    expect(svg).toContain('<svg')
    expect(svg).toContain('width="1032"')
    expect(svg).toContain('height="336"')
  })

  it('contiene exactamente 10 celdas de sello (10 elementos <circle>)', () => {
    const svg = buildStripSvg({ stamps: 3, required: 10, businessName: 'Café Luna' })
    // Cada sello —lleno o vacío— genera exactamente un <circle data-stamp=...>
    const matches = svg.match(/<circle data-stamp=/g)
    expect(matches).not.toBeNull()
    expect(matches?.length).toBe(10)
  })

  it('muestra el contador "3 / 10 sellos"', () => {
    const svg = buildStripSvg({ stamps: 3, required: 10, businessName: 'Café Luna' })
    expect(svg).toContain('3 / 10 sellos')
  })

  it('muestra el nombre del negocio', () => {
    const svg = buildStripSvg({ stamps: 3, required: 10, businessName: 'Café Luna' })
    expect(svg).toContain('Café Luna')
  })

  it('usa el degradado ámbar (color oscuro #92400e)', () => {
    const svg = buildStripSvg({ stamps: 3, required: 10, businessName: 'Café Luna' })
    expect(svg).toContain('#92400e')
  })

  it('tiene 3 círculos rellenos (filled)', () => {
    const svg = buildStripSvg({ stamps: 3, required: 10, businessName: 'Café Luna' })
    const filled = svg.match(/data-stamp="filled"/g)
    expect(filled?.length).toBe(3)
  })

  it('tiene 7 círculos vacíos (empty)', () => {
    const svg = buildStripSvg({ stamps: 3, required: 10, businessName: 'Café Luna' })
    const empty = svg.match(/data-stamp="empty"/g)
    expect(empty?.length).toBe(7)
  })
})

// ─── Caso recompensa completa ─────────────────────────────────────────────────

describe('buildStripSvg — recompensa completa (10/10)', () => {
  it('incluye colores verdes del degradado de recompensa', () => {
    const svg = buildStripSvg({ stamps: 10, required: 10, businessName: 'Tienda Azul' })
    expect(svg).toContain('#064e3b')
    expect(svg).toContain('#047857')
  })

  it('tiene 10 círculos rellenos', () => {
    const svg = buildStripSvg({ stamps: 10, required: 10, businessName: 'Tienda Azul' })
    const filled = svg.match(/data-stamp="filled"/g)
    expect(filled?.length).toBe(10)
  })

  it('no tiene círculos vacíos', () => {
    const svg = buildStripSvg({ stamps: 10, required: 10, businessName: 'Tienda Azul' })
    const empty = svg.match(/data-stamp="empty"/g)
    expect(empty).toBeNull()
  })

  it('muestra "10 / 10 sellos"', () => {
    const svg = buildStripSvg({ stamps: 10, required: 10, businessName: 'Tienda Azul' })
    expect(svg).toContain('10 / 10 sellos')
  })
})

// ─── Saneamiento de entradas extremas ────────────────────────────────────────

describe('buildStripSvg — entradas extremas', () => {
  it('stamps > required no rompe: se clampea al total', () => {
    expect(() => buildStripSvg({ stamps: 999, required: 5, businessName: 'X' })).not.toThrow()
    const svg = buildStripSvg({ stamps: 999, required: 5, businessName: 'X' })
    // Todos deben ser filled (5/5)
    const filled = svg.match(/data-stamp="filled"/g)
    expect(filled?.length).toBe(5)
    expect(svg.match(/data-stamp="empty"/g)).toBeNull()
  })

  it('stamps negativo se clampea a 0', () => {
    const svg = buildStripSvg({ stamps: -5, required: 8, businessName: 'Y' })
    const filled = svg.match(/data-stamp="filled"/g)
    expect(filled).toBeNull() // 0 sellos filled
    const empty = svg.match(/data-stamp="empty"/g)
    expect(empty?.length).toBe(8)
  })

  it('required muy grande (p.ej. 30) genera múltiples filas sin errores', () => {
    expect(() => buildStripSvg({ stamps: 15, required: 30, businessName: 'Mega' })).not.toThrow()
    const svg = buildStripSvg({ stamps: 15, required: 30, businessName: 'Mega' })
    const circles = svg.match(/<circle data-stamp=/g)
    expect(circles?.length).toBe(30)
  })

  it('escapa caracteres XML especiales en el nombre del negocio', () => {
    const svg = buildStripSvg({ stamps: 1, required: 3, businessName: 'A & B <test>' })
    expect(svg).toContain('A &amp; B &lt;test&gt;')
    expect(svg).not.toContain('A & B <test>')
  })
})
