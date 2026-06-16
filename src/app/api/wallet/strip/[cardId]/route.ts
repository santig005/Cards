// Genera la imagen "strip" (heroImage) del pase de Google Wallet para una tarjeta de sellos.
// El SVG se convierte a PNG con sharp (requiere runtime nodejs — no corre en edge).

import sharp from 'sharp'
import { db } from '@/lib/drizzle/db'
import { loyaltyCards, loyaltyPrograms, tenants } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

// ─── Dimensiones recomendadas por Google Wallet para heroImage ───────────────
const STRIP_W = 1032
const STRIP_H = 336

// ─── Opciones para buildStripSvg ─────────────────────────────────────────────

export interface StripSvgOptions {
  /** Sellos actuales del cliente. */
  stamps: number
  /** Total de sellos necesarios para la recompensa. */
  required: number
  /** Nombre del negocio que aparece en el banner. */
  businessName: string
}

// ─── Función pura de construcción del SVG ────────────────────────────────────

/**
 * Genera el SVG del banner de la tarjeta sin tocar red ni base de datos.
 * Exportado para poder testearse en aislamiento con Vitest.
 *
 * Distribución de círculos:
 * - Máximo 10 círculos por fila.
 * - Si hay más de 10 sellos requeridos se usan múltiples filas.
 * - El radio de cada círculo se ajusta adaptativamente al espacio disponible,
 *   con un mínimo de 14 px y un máximo de 28 px, para que siempre quepan.
 */
export function buildStripSvg(opts: StripSvgOptions): string {
  // Clamp: stamps nunca puede ser negativo ni superar required
  const required = Math.max(1, opts.required)
  const stamps = Math.min(Math.max(0, opts.stamps), required)
  const businessName = opts.businessName

  const isComplete = stamps >= required

  // ── Degradado de fondo ────────────────────────────────────────────────────
  // Ámbar para tarjeta en curso, verde cuando se completó la recompensa
  const gradStart = isComplete ? '#064e3b' : '#92400e'
  const gradEnd = isComplete ? '#047857' : '#f59e0b'
  const stampFill = isComplete ? '#6ee7b7' : '#fbbf24'
  const stampStroke = isComplete ? '#a7f3d0' : '#fef3c7'
  const emptyStroke = isComplete ? '#34d399' : '#fcd34d'
  const textColor = '#ffffff'
  const checkColor = isComplete ? '#064e3b' : '#92400e'

  // ── Distribución de círculos ──────────────────────────────────────────────
  const COLS = Math.min(required, 10)
  const ROWS = Math.ceil(required / COLS)

  // Zona reservada para texto (parte inferior del banner)
  const textZoneH = 64
  const stampZoneH = STRIP_H - textZoneH

  // Radio adaptativo: el diámetro no debe ser mayor al espacio disponible
  const maxRByW = Math.floor((STRIP_W * 0.85) / COLS / 2) - 4
  const maxRByH = Math.floor((stampZoneH * 0.8) / ROWS / 2) - 4
  const r = Math.max(14, Math.min(28, maxRByW, maxRByH))
  const diameter = r * 2
  const gap = Math.max(8, Math.floor(r * 0.6))

  // Calcular ancho y alto total de la grilla para centrarla
  const gridW = COLS * diameter + (COLS - 1) * gap
  const gridH = ROWS * diameter + (ROWS - 1) * gap

  const gridOffsetX = (STRIP_W - gridW) / 2
  const gridOffsetY = (stampZoneH - gridH) / 2

  // ── Generación de círculos ────────────────────────────────────────────────
  const circles: string[] = []

  for (let i = 0; i < required; i++) {
    const col = i % COLS
    const row = Math.floor(i / COLS)

    const cx = gridOffsetX + col * (diameter + gap) + r
    const cy = gridOffsetY + row * (diameter + gap) + r

    const filled = i < stamps

    if (filled) {
      // Círculo relleno con check ✓
      circles.push(
        // data-stamp="filled" es el marcador para tests
        `<circle data-stamp="filled" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${stampFill}" stroke="${stampStroke}" stroke-width="2"/>`,
        // Check mark centrado en el círculo
        `<text x="${cx.toFixed(1)}" y="${(cy + r * 0.35).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="${(r * 0.85).toFixed(1)}" fill="${checkColor}" font-weight="bold">✓</text>`,
      )
    } else {
      // Círculo vacío (contorno)
      circles.push(
        // data-stamp="empty" es el marcador para tests
        `<circle data-stamp="empty" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="none" stroke="${emptyStroke}" stroke-width="2.5" stroke-dasharray="4 2"/>`,
      )
    }
  }

  // ── Texto de estado y nombre del negocio ──────────────────────────────────
  const labelY = STRIP_H - 20
  const statusText = `${stamps} / ${required} sellos`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${STRIP_W}" height="${STRIP_H}" viewBox="0 0 ${STRIP_W} ${STRIP_H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStart}"/>
      <stop offset="100%" stop-color="${gradEnd}"/>
    </linearGradient>
  </defs>
  <!-- Fondo degradado -->
  <rect width="${STRIP_W}" height="${STRIP_H}" fill="url(#bg)"/>
  <!-- Sellos -->
  ${circles.join('\n  ')}
  <!-- Texto: nombre del negocio (izquierda) y contador de sellos (derecha) -->
  <text x="24" y="${labelY}" font-family="sans-serif" font-size="22" font-weight="700" fill="${textColor}" opacity="0.95">${escapeXml(businessName)}</text>
  <text x="${STRIP_W - 24}" y="${labelY}" text-anchor="end" font-family="sans-serif" font-size="22" font-weight="700" fill="${textColor}" opacity="0.95">${statusText}</text>
</svg>`

  return svg
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

/** Escapa caracteres especiales XML para usarlos en texto SVG. */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> },
): Promise<Response> {
  try {
    const { cardId } = await params
    const url = new URL(req.url)

    // ── 1. Leer tarjeta, programa y tenant desde la DB ─────────────────────
    const rows = await db
      .select({
        currentStamps: loyaltyCards.currentStamps,
        programId: loyaltyCards.programId,
        tenantId: loyaltyCards.tenantId,
        stampsRequired: loyaltyPrograms.stampsRequired,
        tenantName: tenants.name,
      })
      .from(loyaltyCards)
      .innerJoin(loyaltyPrograms, eq(loyaltyPrograms.id, loyaltyCards.programId))
      .innerJoin(tenants, eq(tenants.id, loyaltyCards.tenantId))
      .where(eq(loyaltyCards.id, cardId))
      .limit(1)

    if (rows.length === 0) {
      return new Response(null, { status: 404 })
    }

    const card = rows[0]

    // ── 2. Determinar cantidad de sellos a mostrar ─────────────────────────
    const required = card.stampsRequired
    let stamps = card.currentStamps

    const sParam = url.searchParams.get('s')
    if (sParam !== null) {
      const parsed = parseInt(sParam, 10)
      if (!isNaN(parsed)) {
        // Clamp al rango válido
        stamps = Math.min(Math.max(0, parsed), required)
      }
    }

    // ── 3. Generar SVG ─────────────────────────────────────────────────────
    const svg = buildStripSvg({
      stamps,
      required,
      businessName: card.tenantName,
    })

    // ── 4. Convertir SVG → PNG con sharp ──────────────────────────────────
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer()
    // Buffer extiende Uint8Array pero TypeScript (DOM lib) espera `ArrayBuffer`
    // en el constructor de Response. Se usa `Buffer.toJSON` para obtener un
    // ArrayBuffer limpio sin riesgo de SharedArrayBuffer.
    const pngBody: ArrayBuffer = pngBuffer.buffer.slice(
      pngBuffer.byteOffset,
      pngBuffer.byteOffset + pngBuffer.byteLength,
    ) as ArrayBuffer

    return new Response(pngBody, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        // La URL ya lleva ?s= como cache-buster, así que es seguro cachear 5 min
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (err) {
    console.error('[wallet/strip] Error generando imagen:', err)
    // Devuelve 500 con cuerpo vacío para no bloquear la generación del pase
    return new Response(null, { status: 500 })
  }
}
