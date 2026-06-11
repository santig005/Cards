import { describe, it, expect } from 'vitest'
import { getCountryCallingCode } from 'libphonenumber-js'
import {
  COUNTRIES,
  countriesSorted,
  getCountry,
  DEFAULT_COUNTRY,
  type Country,
} from '../../src/lib/countries'

describe('COUNTRIES dataset', () => {
  it('has at least 190 entries', () => {
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(190)
  })

  it('every iso2 is unique', () => {
    const iso2s = COUNTRIES.map((c) => c.iso2)
    const unique = new Set(iso2s)
    expect(unique.size).toBe(iso2s.length)
  })

  it('every iso2 is exactly 2 uppercase letters', () => {
    for (const c of COUNTRIES) {
      expect(c.iso2).toMatch(/^[A-Z]{2}$/)
    }
  })

  it('every dialCode is non-empty and contains only digits', () => {
    for (const c of COUNTRIES) {
      expect(c.dialCode).toBeTruthy()
      expect(c.dialCode).toMatch(/^\d+$/)
    }
  })

  it('every entry has non-empty nameEs, nameEn, namePt', () => {
    for (const c of COUNTRIES) {
      expect(c.nameEs.trim().length).toBeGreaterThan(0)
      expect(c.nameEn.trim().length).toBeGreaterThan(0)
      expect(c.namePt.trim().length).toBeGreaterThan(0)
    }
  })

  it('every entry has a non-empty flag emoji', () => {
    for (const c of COUNTRIES) {
      expect(c.flag.trim().length).toBeGreaterThan(0)
    }
  })

  it('every entry has a non-empty defaultTimezone', () => {
    for (const c of COUNTRIES) {
      expect(c.defaultTimezone.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('Spot-check dial codes against E.164 / libphonenumber-js', () => {
  const spotChecks: Array<[string, string]> = [
    ['CO', '57'],
    ['MX', '52'],
    ['BR', '55'],
    ['US', '1'],
    ['ES', '34'],
    ['AR', '54'],
    ['CL', '56'],
    ['PE', '51'],
    ['VE', '58'],
    ['DE', '49'],
    ['FR', '33'],
    ['GB', '44'],
    ['JP', '81'],
    ['CN', '86'],
    ['IN', '91'],
    ['AU', '61'],
    ['PT', '351'],
    ['IT', '39'],
    ['NL', '31'],
    ['SE', '46'],
  ]

  for (const [iso2, expectedDialCode] of spotChecks) {
    it(`${iso2} dialCode is ${expectedDialCode}`, () => {
      const country = getCountry(iso2)
      expect(country).toBeDefined()
      expect(country!.dialCode).toBe(expectedDialCode)
    })
  }

  it('dialCodes for libphonenumber-js supported countries match the library', () => {
    // Cross-check our dialCode against getCountryCallingCode() for every
    // country the library recognises. Shared calling-code regions (NANP, RU/KZ)
    // are handled transparently because libphonenumber-js returns the base
    // calling code (e.g. "1" for all NANP, "7" for Russia/Kazakhstan).
    let checked = 0
    for (const c of COUNTRIES) {
      let libCode: string | undefined
      try {
        libCode = String(
          getCountryCallingCode(
            c.iso2 as Parameters<typeof getCountryCallingCode>[0],
          ),
        )
      } catch {
        // Not in the library (e.g. VA, SM) — skip
        continue
      }
      expect(c.dialCode).toBe(libCode)
      checked++
    }
    // Make sure we actually ran meaningful checks
    expect(checked).toBeGreaterThan(150)
  })
})

describe('Priority order', () => {
  it('starts with CO, MX, BR, US, ES', () => {
    const first5 = countriesSorted.slice(0, 5).map((c) => c.iso2)
    expect(first5).toEqual(['CO', 'MX', 'BR', 'US', 'ES'])
  })
})

describe('DEFAULT_COUNTRY', () => {
  it('is CO', () => {
    expect(DEFAULT_COUNTRY).toBe('CO')
  })
})

describe('getCountry()', () => {
  it('finds CO by iso2', () => {
    const co = getCountry('CO')
    expect(co).toBeDefined()
    expect(co!.dialCode).toBe('57')
    expect(co!.nameEs).toBe('Colombia')
  })

  it('is case-insensitive', () => {
    expect(getCountry('co')).toBeDefined()
    expect(getCountry('Co')).toBeDefined()
  })

  it('returns undefined for unknown code', () => {
    expect(getCountry('XX')).toBeUndefined()
    expect(getCountry('')).toBeUndefined()
  })

  it('Country type has all required fields', () => {
    const c: Country = getCountry('MX')!
    expect(typeof c.iso2).toBe('string')
    expect(typeof c.dialCode).toBe('string')
    expect(typeof c.nameEs).toBe('string')
    expect(typeof c.nameEn).toBe('string')
    expect(typeof c.namePt).toBe('string')
    expect(typeof c.flag).toBe('string')
    expect(typeof c.defaultTimezone).toBe('string')
  })
})
