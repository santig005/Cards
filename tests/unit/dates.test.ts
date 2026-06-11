import { describe, it, expect } from 'vitest'

describe('Intl.DateTimeFormat locale-aware formatting', () => {
  const testDate = new Date('2026-06-11T15:30:00Z')

  it('formats dates in Spanish (es)', () => {
    const fmt = new Intl.DateTimeFormat('es', {
      timeZone: 'America/Bogota',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    const result = fmt.format(testDate)
    expect(result).toBeTruthy()
    expect(result).toContain('2026')
  })

  it('formats dates in English (en)', () => {
    const fmt = new Intl.DateTimeFormat('en', {
      timeZone: 'America/Bogota',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    const result = fmt.format(testDate)
    expect(result).toBeTruthy()
    expect(result).toContain('2026')
  })

  it('formats dates in Portuguese (pt)', () => {
    const fmt = new Intl.DateTimeFormat('pt', {
      timeZone: 'America/Bogota',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    const result = fmt.format(testDate)
    expect(result).toBeTruthy()
    expect(result).toContain('2026')
  })

  it('produces different output per locale', () => {
    const fmt = (locale: string) => new Intl.DateTimeFormat(locale, {
      timeZone: 'UTC',
      month: 'long',
      year: 'numeric',
    }).format(testDate)
    // Month names differ across locales
    const es = fmt('es')
    const en = fmt('en')
    const pt = fmt('pt')
    expect(typeof es).toBe('string')
    expect(typeof en).toBe('string')
    expect(typeof pt).toBe('string')
    // Not all should be identical
    const allSame = es === en && en === pt
    expect(allSame).toBe(false)
  })
})
