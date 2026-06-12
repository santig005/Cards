import { describe, it, expect } from 'vitest'
import { getLegalNoticeKey } from '../../src/lib/legal'
import { buildCreateProgramSchema } from '../../src/lib/validations/onboarding'
import { getCountry, countriesSorted } from '../../src/lib/countries'

// ── Legal notice selection ───────────────────────────────────────────────────

describe('getLegalNoticeKey()', () => {
  it('returns habeasCO for Colombia', () => {
    expect(getLegalNoticeKey('CO')).toBe('habeasCO')
  })

  it('returns habeasCO case-insensitively', () => {
    expect(getLegalNoticeKey('co')).toBe('habeasCO')
    expect(getLegalNoticeKey('Co')).toBe('habeasCO')
  })

  it('returns habeasGeneric for Mexico', () => {
    expect(getLegalNoticeKey('MX')).toBe('habeasGeneric')
  })

  it('returns habeasGeneric for Brazil', () => {
    expect(getLegalNoticeKey('BR')).toBe('habeasGeneric')
  })

  it('returns habeasGeneric for United States', () => {
    expect(getLegalNoticeKey('US')).toBe('habeasGeneric')
  })

  it('returns habeasGeneric for Spain', () => {
    expect(getLegalNoticeKey('ES')).toBe('habeasGeneric')
  })

  it('returns habeasGeneric for any unknown code', () => {
    expect(getLegalNoticeKey('XX')).toBe('habeasGeneric')
    expect(getLegalNoticeKey('')).toBe('habeasGeneric')
  })
})

// ── Country code validation in onboarding schema ─────────────────────────────

const BASE_MESSAGES = {
  stampsMin: 'min',
  stampsMax: 'max',
  rewardTypeRequired: 'reward required',
  descMin3: 'desc min',
  descMax200: 'desc max',
  nameMin2: 'name min',
  nameMax80: 'name max',
  countryRequired: 'Invalid country',
  timezoneRequired: 'Timezone required',
}

const VALID_PAYLOAD = {
  stampsRequired: '10',
  rewardType: 'free_product',
  rewardDescription: 'Un café gratis',
  businessName: 'Mi Cafetería',
}

describe('buildCreateProgramSchema — country / timezone / locale fields', () => {
  it('accepts a valid ISO2 country code', () => {
    const schema = buildCreateProgramSchema(BASE_MESSAGES)
    const result = schema.safeParse({ ...VALID_PAYLOAD, countryCode: 'CO' })
    expect(result.success).toBe(true)
  })

  it('accepts all countries in the dataset', () => {
    const schema = buildCreateProgramSchema(BASE_MESSAGES)
    for (const c of countriesSorted) {
      const res = schema.safeParse({ ...VALID_PAYLOAD, countryCode: c.iso2 })
      expect(res.success).toBe(true)
    }
  })

  it('rejects an unknown country code', () => {
    const schema = buildCreateProgramSchema(BASE_MESSAGES)
    const result = schema.safeParse({ ...VALID_PAYLOAD, countryCode: 'XX' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Invalid country')
  })

  it('accepts a valid timezone string', () => {
    const schema = buildCreateProgramSchema(BASE_MESSAGES)
    const result = schema.safeParse({ ...VALID_PAYLOAD, timezone: 'America/Bogota' })
    expect(result.success).toBe(true)
  })

  it('accepts a valid locale', () => {
    const schema = buildCreateProgramSchema(BASE_MESSAGES)
    const result = schema.safeParse({ ...VALID_PAYLOAD, locale: 'pt' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid locale', () => {
    const schema = buildCreateProgramSchema(BASE_MESSAGES)
    const result = schema.safeParse({ ...VALID_PAYLOAD, locale: 'fr' })
    expect(result.success).toBe(false)
  })

  it('countryCode is optional (omitted = valid)', () => {
    const schema = buildCreateProgramSchema(BASE_MESSAGES)
    const result = schema.safeParse(VALID_PAYLOAD)
    expect(result.success).toBe(true)
  })
})

// ── Country dataset spot-checks for multi-país features ──────────────────────

describe('Country data for multi-país UI', () => {
  it('CO has expected defaultTimezone and dialCode', () => {
    const co = getCountry('CO')!
    expect(co.defaultTimezone).toBe('America/Bogota')
    expect(co.dialCode).toBe('57')
  })

  it('MX has expected defaultTimezone and dialCode', () => {
    const mx = getCountry('MX')!
    expect(mx.defaultTimezone).toBe('America/Mexico_City')
    expect(mx.dialCode).toBe('52')
  })

  it('BR has expected defaultTimezone and dialCode', () => {
    const br = getCountry('BR')!
    expect(br.defaultTimezone).toBe('America/Sao_Paulo')
    expect(br.dialCode).toBe('55')
  })

  it('every country has a non-empty defaultTimezone (for timezone defaulting)', () => {
    for (const c of countriesSorted) {
      expect(c.defaultTimezone.trim().length).toBeGreaterThan(0)
    }
  })
})
