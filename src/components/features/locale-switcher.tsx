'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { locales, localeNames, LOCALE_COOKIE } from '@/i18n/config'

interface LocaleSwitcherProps {
  className?: string
  variant?: 'dark' | 'light'
}

export function LocaleSwitcher({ className = '', variant = 'dark' }: LocaleSwitcherProps) {
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

  const variantClass =
    variant === 'light'
      ? 'border border-border bg-surface text-fg focus:ring-amber-500/40'
      : 'border border-white/15 bg-white/5 text-stone-300 focus:ring-amber-500/40'

  return (
    <select
      value={active}
      onChange={onChange}
      disabled={isPending}
      aria-label={t('language')}
      className={`rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 ${variantClass} ${className}`}
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {localeNames[l]}
        </option>
      ))}
    </select>
  )
}
