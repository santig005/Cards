// Idiomas soportados. Estrategia: locale por COOKIE (sin prefijo en la URL),
// para no romper los links existentes /c/[slug]. Ver docs/adr/ADR-006-i18n.md.

export const locales = ['es', 'en', 'pt'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'es'

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
}

export const LOCALE_COOKIE = 'NEXT_LOCALE'

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value)
}
