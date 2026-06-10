'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { locales, localeNames, LOCALE_COOKIE } from '@/i18n/config'

interface LocaleSwitcherProps {
  className?: string
}

export function LocaleSwitcher({ className = '' }: LocaleSwitcherProps) {
  const router = useRouter()
  const active = useLocale()
  const t = useTranslations('common')
  const [isPending, startTransition] = useTransition()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value
    // Persistimos el idioma en cookie; next-intl lo lee por request.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    startTransition(() => router.refresh())
  }

  return (
    <select
      value={active}
      onChange={onChange}
      disabled={isPending}
      aria-label={t('language')}
      className={`rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${className}`}
    >
      {locales.map((l) => (
        <option key={l} value={l} className="text-stone-900">
          {localeNames[l]}
        </option>
      ))}
    </select>
  )
}
