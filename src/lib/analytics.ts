/**
 * Lógica de dominio PURA de analytics (sin IO ni DB), testeable sin Supabase.
 */

export interface DayBucket {
  label: string
  count: number
}

const WEEKDAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

/**
 * Construye los últimos 7 días (incluyendo "hoy" según `now`) en la zona horaria
 * dada, mapeando los conteos por fecha 'YYYY-MM-DD'. Días sin datos quedan en 0.
 *
 * Colombia no tiene DST, así que avanzar en pasos de 24h es seguro.
 */
export function buildLast7Days(
  now: Date,
  countsByDay: Map<string, number>,
  timeZone: string
): DayBucket[] {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const out: DayBucket[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = fmt.format(d) // 'YYYY-MM-DD' en la zona local
    // El día de semana de esa fecha calendario (mediodía UTC evita corrimientos).
    const weekday = new Date(`${key}T12:00:00Z`).getUTCDay()
    out.push({ label: WEEKDAY_LABELS[weekday], count: countsByDay.get(key) ?? 0 })
  }
  return out
}
