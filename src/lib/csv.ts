/**
 * Generación de CSV PURA (sin DOM/IO), testeable.
 */

type CsvValue = string | number | null | undefined

/** Escapa un campo CSV (comillas, comas y saltos de línea). */
export function escapeCsvField(value: CsvValue): string {
  const s = value == null ? '' : String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Arma un CSV (CRLF entre filas) a partir de encabezados + filas. */
export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers.map(escapeCsvField).join(',')]
  for (const row of rows) lines.push(row.map(escapeCsvField).join(','))
  return lines.join('\r\n')
}
