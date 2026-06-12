'use client'

import { useEffect, useId, useMemo, useRef, useState, type ComponentType } from 'react'
import { hasFlag } from 'country-flag-icons'
import * as Flags from 'country-flag-icons/react/3x2'
import { countriesSorted, getCountry, type Country } from '@/lib/countries'

type FlagComponent = ComponentType<{ className?: string; title?: string }>
const FLAGS = Flags as unknown as Record<string, FlagComponent | undefined>

const LOCALE_NAME: Record<'es' | 'en' | 'pt', keyof Pick<Country, 'nameEs' | 'nameEn' | 'namePt'>> = {
  es: 'nameEs',
  en: 'nameEn',
  pt: 'namePt',
}

const SEARCH_DEFAULT: Record<'es' | 'en' | 'pt', string> = {
  es: 'Buscar país…',
  en: 'Search country…',
  pt: 'Pesquisar país…',
}

function FlagIcon({ iso2, className }: { iso2: string; className?: string }): React.ReactElement {
  const code = iso2.toUpperCase()
  const Flag = hasFlag(code) ? FLAGS[code] : undefined
  if (!Flag) {
    return (
      <span className={`inline-flex items-center justify-center text-[10px] font-semibold text-muted ${className ?? ''}`}>
        {code}
      </span>
    )
  }
  return <Flag title={code} className={className} />
}

interface CountryDropdownProps {
  locale: 'es' | 'en' | 'pt'
  value: string
  onChange: (iso2: string) => void
  /** compact = closed shows flag + dial code (for tight rows like a phone prefix). */
  variant?: 'compact' | 'full'
  label?: string
  placeholder?: string
  searchPlaceholder?: string
  error?: string
  disabled?: boolean
}

export function CountryDropdown({
  locale,
  value,
  onChange,
  variant = 'full',
  label,
  placeholder,
  searchPlaceholder,
  error,
  disabled = false,
}: CountryDropdownProps): React.ReactElement {
  const id = useId()
  const nameKey = LOCALE_NAME[locale]
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = getCountry(value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return countriesSorted
    return countriesSorted.filter(
      (c) =>
        c[nameKey].toLowerCase().includes(q) ||
        c.iso2.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    )
  }, [query, nameKey])

  // Cerrar al hacer clic afuera.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  // Foco en el buscador al abrir.
  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  function select(iso2: string): void {
    onChange(iso2)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-fg select-none">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`
            flex h-12 items-center gap-2 rounded-xl border bg-surface px-3 text-sm text-fg transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400
            disabled:opacity-50 disabled:cursor-not-allowed
            ${variant === 'compact' ? 'w-auto shrink-0' : 'w-full'}
            ${error ? 'border-red-400 focus:ring-red-300/40' : 'border-border hover:border-border-strong'}
          `}
        >
          {selected ? (
            <>
              <FlagIcon iso2={selected.iso2} className="h-4 w-6 shrink-0 rounded-[2px] object-cover" />
              {variant === 'full' && <span className="truncate">{selected[nameKey]}</span>}
              <span className="font-semibold">+{selected.dialCode}</span>
            </>
          ) : (
            <span className="text-muted">{placeholder ?? '—'}</span>
          )}
          <svg
            className={`ml-auto h-4 w-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div
            className={`absolute z-30 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-lg ${
              variant === 'compact' ? 'w-72 max-w-[80vw]' : 'w-full'
            }`}
            role="listbox"
          >
            <div className="border-b border-border p-2">
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder ?? SEARCH_DEFAULT[locale]}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400"
              />
            </div>
            <ul className="max-h-60 overflow-y-auto py-1">
              {filtered.map((c) => (
                <li key={c.iso2}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.iso2 === value}
                    onClick={() => select(c.iso2)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2 ${
                      c.iso2 === value ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'text-fg'
                    }`}
                  >
                    <FlagIcon iso2={c.iso2} className="h-4 w-6 shrink-0 rounded-[2px] object-cover" />
                    <span className="flex-1 truncate">{c[nameKey]}</span>
                    <span className="text-muted">+{c.dialCode}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-3 text-center text-sm text-muted">—</li>
              )}
            </ul>
          </div>
        )}
      </div>
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
