'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTranslations } from 'next-intl'

const COOKIE = 'sellio-theme'
const MAX_AGE = 60 * 60 * 24 * 365 // 1 año

function setThemeCookie(value: 'dark' | 'light') {
  document.cookie = `${COOKIE}=${value}; path=/; max-age=${MAX_AGE}; samesite=lax`
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const t = useTranslations('common')
  // El estado real lo fijó el script anti-FOUC en <html>. Leemos de ahí tras montar.
  const [isDark, setIsDark] = useState<boolean | null>(null)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    setThemeCookie(next ? 'dark' : 'light')
  }

  // Placeholder del mismo tamaño durante SSR / pre-hidratación (evita mismatch y salto).
  if (isDark === null) return <div className={`w-8 h-8 ${className}`} aria-hidden />

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? t('lightMode') : t('darkMode')}
      title={isDark ? t('lightMode') : t('darkMode')}
      className={`flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:text-fg hover:bg-surface-2 transition-colors duration-150 ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4" strokeWidth={2} /> : <Moon className="w-4 h-4" strokeWidth={2} />}
    </button>
  )
}
