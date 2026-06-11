/**
 * Lógica de dominio PURA de analytics (sin IO ni DB), testeable sin Supabase.
 */

export interface DayBucket {
  label: string
  count: number
}

// Labels de respaldo en español (D=domingo … S=sábado). Se usan cuando no se
// pasa un locale; preservan el comportamiento histórico (negocio en Colombia).
const WEEKDAY_LABELS_ES = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

/**
 * Construye los últimos 7 días (incluyendo "hoy" según `now`) en la zona horaria
 * dada, mapeando los conteos por fecha 'YYYY-MM-DD'. Días sin datos quedan en 0.
 *
 * `timeZone` (IANA) es la del negocio: el agrupamiento por día respeta su hora
 * local. `locale` (es | en | pt …) localiza el label del día de la semana; si se
 * omite se usan los labels en español por defecto.
 *
 * Las zonas con DST quedan cubiertas porque la fecha calendario local se calcula
 * con Intl.DateTimeFormat sobre la `timeZone`; avanzar en pasos de 24h sobre el
 * instante UTC y luego formatear a la zona da el día correcto en la práctica.
 */
export function buildLast7Days(
  now: Date,
  countsByDay: Map<string, number>,
  timeZone: string,
  locale?: string
): DayBucket[] {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  // Si hay locale, localizamos el día de semana con Intl (narrow = 1 carácter).
  const weekdayFmt = locale
    ? new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' })
    : null

  const out: DayBucket[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = fmt.format(d) // 'YYYY-MM-DD' en la zona local
    // El día de semana de esa fecha calendario (mediodía UTC evita corrimientos).
    const midday = new Date(`${key}T12:00:00Z`)
    const label = weekdayFmt
      ? weekdayFmt.format(midday)
      : WEEKDAY_LABELS_ES[midday.getUTCDay()]
    out.push({ label, count: countsByDay.get(key) ?? 0 })
  }
  return out
}
