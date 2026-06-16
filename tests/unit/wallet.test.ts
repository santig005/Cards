import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  stripImageUrl,
  buildLoyaltyObject,
  buildLoyaltyClass,
  buildPatchBody,
  buildSaveJwtClaims,
  buildClassId,
  buildObjectId,
} from '../../src/lib/wallet/google/passes'
import { isGoogleWalletConfigured } from '../../src/lib/wallet/google/config'

// ─── isGoogleWalletConfigured ────────────────────────────────────────────────

describe('isGoogleWalletConfigured', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('es false cuando faltan las env vars', () => {
    vi.stubEnv('GOOGLE_WALLET_ISSUER_ID', '')
    vi.stubEnv('GOOGLE_WALLET_SA_EMAIL', '')
    vi.stubEnv('GOOGLE_WALLET_SA_PRIVATE_KEY', '')
    expect(isGoogleWalletConfigured()).toBe(false)
  })

  it('es false cuando falta sólo una env var', () => {
    vi.stubEnv('GOOGLE_WALLET_ISSUER_ID', '3388000000022000000')
    vi.stubEnv('GOOGLE_WALLET_SA_EMAIL', 'sa@project.iam.gserviceaccount.com')
    vi.stubEnv('GOOGLE_WALLET_SA_PRIVATE_KEY', '')
    expect(isGoogleWalletConfigured()).toBe(false)
  })

  it('es true cuando están las tres env vars', () => {
    vi.stubEnv('GOOGLE_WALLET_ISSUER_ID', '3388000000022000000')
    vi.stubEnv('GOOGLE_WALLET_SA_EMAIL', 'sa@project.iam.gserviceaccount.com')
    vi.stubEnv('GOOGLE_WALLET_SA_PRIVATE_KEY', '-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n')
    expect(isGoogleWalletConfigured()).toBe(true)
  })
})

// ─── stripImageUrl ────────────────────────────────────────────────────────────

describe('stripImageUrl', () => {
  it('arma la URL del endpoint de strip', () => {
    expect(stripImageUrl('https://sellio.app', 'card-abc', 3)).toBe(
      'https://sellio.app/api/wallet/strip/card-abc?s=3',
    )
  })

  it('versiona la URL por número de sellos (cache-busting)', () => {
    const a = stripImageUrl('https://sellio.app', 'card-abc', 3)
    const b = stripImageUrl('https://sellio.app', 'card-abc', 4)
    expect(a).not.toBe(b)
    expect(b).toContain('?s=4')
  })
})

// ─── buildClassId / buildObjectId ─────────────────────────────────────────────

describe('build IDs', () => {
  it('classId usa el prefijo tenant_', () => {
    expect(buildClassId('123', 'tenant-uuid')).toBe('123.tenant_tenant-uuid')
  })
  it('objectId usa el prefijo card_', () => {
    expect(buildObjectId('123', 'card-uuid')).toBe('123.card_card-uuid')
  })
})

// ─── buildLoyaltyClass ────────────────────────────────────────────────────────

describe('buildLoyaltyClass', () => {
  it('omite programLogo si el tenant no tiene logo', () => {
    const cls = buildLoyaltyClass({
      classId: '123.tenant_t1',
      tenant: { id: 't1', name: 'Café Luna', logoUrl: null },
    })
    expect(cls.id).toBe('123.tenant_t1')
    expect(cls.issuerName).toBe('Café Luna')
    expect(cls.programName).toBe('Sellio · Café Luna')
    expect(cls.reviewStatus).toBe('UNDER_REVIEW')
    expect(cls.programLogo).toBeUndefined()
  })

  it('incluye programLogo cuando hay logoUrl', () => {
    const cls = buildLoyaltyClass({
      classId: '123.tenant_t1',
      tenant: { id: 't1', name: 'Café Luna', logoUrl: 'https://x/logo.png' },
    })
    expect(cls.programLogo).toEqual({ sourceUri: { uri: 'https://x/logo.png' } })
  })
})

// ─── buildLoyaltyObject ───────────────────────────────────────────────────────

describe('buildLoyaltyObject', () => {
  it('arma id, classId, state y balance correctos', () => {
    const obj = buildLoyaltyObject({
      objectId: '123.card_c1',
      classId: '123.tenant_t1',
      customer: { id: 'cust-1', name: 'Ana', phone: '+573001234567' },
      stamps: 5,
      required: 10,
      stripUrl: 'https://sellio.app/api/wallet/strip/c1?s=5',
    })
    expect(obj.id).toBe('123.card_c1')
    expect(obj.classId).toBe('123.tenant_t1')
    expect(obj.state).toBe('ACTIVE')
    expect(obj.accountId).toBe('cust-1')
    expect(obj.loyaltyPoints.label).toBe('Sellos')
    expect(obj.loyaltyPoints.balance.string).toBe('5/10')
    expect(obj.heroImage).toEqual({ sourceUri: { uri: 'https://sellio.app/api/wallet/strip/c1?s=5' } })
  })

  it('usa el teléfono como accountName cuando no hay nombre', () => {
    const obj = buildLoyaltyObject({
      objectId: '123.card_c1',
      classId: '123.tenant_t1',
      customer: { id: 'cust-1', name: null, phone: '+573001234567' },
      stamps: 0,
      required: 8,
      stripUrl: 'https://x/s',
    })
    expect(obj.accountName).toBe('+573001234567')
  })
})

// ─── buildPatchBody ───────────────────────────────────────────────────────────

describe('buildPatchBody', () => {
  it('arma sólo loyaltyPoints y heroImage', () => {
    const body = buildPatchBody({ stamps: 7, required: 10, stripUrl: 'https://x/s?s=7' })
    expect(body.loyaltyPoints.balance.string).toBe('7/10')
    expect(body.heroImage).toEqual({ sourceUri: { uri: 'https://x/s?s=7' } })
  })
})

// ─── buildSaveJwtClaims ───────────────────────────────────────────────────────

describe('buildSaveJwtClaims', () => {
  it('produce aud, typ y el objectId en el payload', () => {
    const claims = buildSaveJwtClaims({
      clientEmail: 'sa@project.iam.gserviceaccount.com',
      appUrl: 'https://sellio.app',
      objectId: '123.card_c1',
      nowSeconds: 1_700_000_000,
    })
    expect(claims.iss).toBe('sa@project.iam.gserviceaccount.com')
    expect(claims.aud).toBe('google')
    expect(claims.typ).toBe('savetowallet')
    expect(claims.iat).toBe(1_700_000_000)
    expect(claims.origins).toEqual(['https://sellio.app'])
    expect(claims.payload.loyaltyObjects[0].id).toBe('123.card_c1')
  })
})
