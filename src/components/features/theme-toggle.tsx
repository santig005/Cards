'use client'

import { useSyncExternalStore } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTranslations } from 'next-intl'

const COOKIE = 'sellio-theme'
const MAX_AGE = 60 * 60 * 24 * 365 // 1 año

// Leemos el tema desde la clase .dark del <html> (que fijó el script anti-FOUC),
// de forma reactiva y sin setState-en-effect.
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}
function getSnapshot() {
  return document.documentElement.classList.contains('dark')
}
function getServerSnapshot() {
  return false
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const t = useTranslations('common')
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  function toggle() {
    const next = !isDark
    document.documentElement.classList.toggle('dark', next)
    document.cookie = `${COOKIE}=${next ? 'dark' : 'light'}; path=/; max-age=${MAX_AGE}; samesite=lax`
  }

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
