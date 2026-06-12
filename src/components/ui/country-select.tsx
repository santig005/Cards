'use client'

import { useId } from 'react'
import type { Country } from '@/lib/countries'

interface CountrySelectProps {
  /** Display name property to use based on UI locale */
  locale: 'es' | 'en' | 'pt'
  countries: Country[]
  value: string
  onChange: (countryCode: string) => void
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
}

const LOCALE_NAME: Record<'es' | 'en' | 'pt', keyof Pick<Country, 'nameEs' | 'nameEn' | 'namePt'>> = {
  es: 'nameEs',
  en: 'nameEn',
  pt: 'namePt',
}

export function CountrySelect({
  locale,
  countries,
  value,
  onChange,
  label,
  placeholder,
  error,
  disabled = false,
}: CountrySelectProps) {
  const id = useId()
  const nameKey = LOCALE_NAME[locale]

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
        {countries.map((c) => (
          <option key={c.iso2} value={c.iso2}>
            {c.flag} {c[nameKey]}
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
