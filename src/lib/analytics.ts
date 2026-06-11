/**
 * Lógica de dominio PURA de analytics (sin IO ni DB), testeable sin Supabase.
 */

export interface DayBucket {
  label: string
  count: number
}

/**
 * Construye los últimos 7 días (incluyendo "hoy" según `now`) en la zona horaria
 * dada, mapeando los conteos por fecha 'YYYY-MM-DD'. Días sin datos quedan en 0.
 *
 * Colombia no tiene DST, así que avanzar en pasos de 24h es seguro.
 * El parámetro `locale` controla el idioma de la etiqueta del día de semana.
 */
export function buildLast7Days(
  now: Date,
  countsByDay: Map<string, number>,
  timeZone: string,
  locale = 'es'
): DayBucket[] {
  const dateFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' })

  const out: DayBucket[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = dateFmt.format(d)
    const midday = new Date(key + 'T12:00:00Z')
    const label = weekdayFmt.format(midday)
    out.push({ label, count: countsByDay.get(key) ?? 0 })
  }
  return out
}
