'use client'

import { useId } from 'react'

/**
 * Common IANA timezones grouped by region for usability.
 * We surface the most relevant ones for LATAM + common global zones.
 */
export const COMMON_TIMEZONES: string[] = [
  // LATAM
  'America/Bogota',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Santiago',
  'America/Lima',
  'America/Caracas',
  'America/Argentina/Buenos_Aires',
  'America/Montevideo',
  'America/Guayaquil',
  'America/Asuncion',
  'America/La_Paz',
  'America/Costa_Rica',
  'America/El_Salvador',
  'America/Guatemala',
  'America/Managua',
  'America/Panama',
  'America/Tegucigalpa',
  'America/Santo_Domingo',
  'America/Havana',
  // North America
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  // Europe
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Lisbon',
  'Europe/Rome',
  // Other
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Africa/Nairobi',
  'Africa/Lagos',
  'Pacific/Auckland',
  'UTC',
]

interface TimezoneSelectProps {
  value: string
  onChange: (tz: string) => void
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
}

export function TimezoneSelect({
  value,
  onChange,
  label,
  placeholder,
  error,
  disabled = false,
}: TimezoneSelectProps) {
  const id = useId()

  // Ensure the current value is in the list (may be a country default not in COMMON_TIMEZONES)
  const allTimezones = COMMON_TIMEZONES.includes(value) || !value
    ? COMMON_TIMEZONES
    : [value, ...COMMON_TIMEZONES]

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-fg select-none">
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          h-11 w-full rounded-xl border px-3.5 text-sm transition-all duration-150 bg-surface text-fg
          focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-400 focus:ring-red-300/40' : 'border-border hover:border-border-strong'}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {allTimezones.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5zm.75 7a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
