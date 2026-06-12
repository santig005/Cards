import { describe, it, expect } from 'vitest'
import { buildLoginSchema, buildRegisterSchema } from '../../src/lib/validations/auth'
import { buildCreateProgramSchema } from '../../src/lib/validations/onboarding'

const esMessages = {
  emailInvalid: 'Email inválido',
  passwordMin: 'Mínimo 8 caracteres',
  nameMin2: 'Mínimo 2 caracteres',
  nameMax80: 'Máximo 80 caracteres',
}

const enMessages = {
  emailInvalid: 'Invalid email',
  passwordMin: 'Minimum 8 characters',
  nameMin2: 'Minimum 2 characters',
  nameMax80: 'Maximum 80 characters',
}

describe('buildLoginSchema', () => {
  it('rejects invalid email in ES', () => {
    const schema = buildLoginSchema(esMessages)
    const result = schema.safeParse({ email: 'not-email', password: 'password123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Email inválido')
  })

  it('rejects invalid email in EN', () => {
    const schema = buildLoginSchema(enMessages)
    const result = schema.safeParse({ email: 'not-email', password: 'password123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Invalid email')
  })

  it('rejects short password in ES', () => {
    const schema = buildLoginSchema(esMessages)
    const result = schema.safeParse({ email: 'a@b.com', password: 'short' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Mínimo 8 caracteres')
  })

  it('accepts valid credentials', () => {
    const schema = buildLoginSchema(esMessages)
    const result = schema.safeParse({ email: 'a@b.com', password: 'validpassword' })
    expect(result.success).toBe(true)
  })
})

describe('buildRegisterSchema', () => {
  it('rejects short business name in ES', () => {
    const schema = buildRegisterSchema(esMessages)
    const result = schema.safeParse({ businessName: 'A', email: 'a@b.com', password: 'password123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Mínimo 2 caracteres')
  })

  it('rejects short business name in EN', () => {
    const schema = buildRegisterSchema(enMessages)
    const result = schema.safeParse({ businessName: 'A', email: 'a@b.com', password: 'password123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Minimum 2 characters')
  })

  it('accepts valid registration data', () => {
    const schema = buildRegisterSchema(esMessages)
    const result = schema.safeParse({ businessName: 'Mi Negocio', email: 'a@b.com', password: 'password123' })
    expect(result.success).toBe(true)
  })
})

describe('buildCreateProgramSchema', () => {
  const esProgramMessages = {
    stampsMin: 'Mínimo 3 sellos',
    stampsMax: 'Máximo 30 sellos',
    rewardTypeRequired: 'Seleccioná un tipo de recompensa',
    descMin3: 'Mínimo 3 caracteres',
    descMax200: 'Máximo 200 caracteres',
    nameMin2: 'Mínimo 2 caracteres',
    nameMax80: 'Máximo 80 caracteres',
  }
  const enProgramMessages = {
    stampsMin: 'Minimum 3 stamps',
    stampsMax: 'Maximum 30 stamps',
    rewardTypeRequired: 'Select a reward type',
    descMin3: 'Minimum 3 characters',
    descMax200: 'Maximum 200 characters',
    nameMin2: 'Minimum 2 characters',
    nameMax80: 'Maximum 80 characters',
  }

  it('rejects too few stamps in ES', () => {
    const schema = buildCreateProgramSchema(esProgramMessages)
    const result = schema.safeParse({
      stampsRequired: '2',
      rewardType: 'free_product',
      rewardDescription: 'Un café gratis',
      businessName: 'Mi Cafetería',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Mínimo 3 sellos')
  })

  it('rejects too few stamps in EN', () => {
    const schema = buildCreateProgramSchema(enProgramMessages)
    const result = schema.safeParse({
      stampsRequired: '2',
      rewardType: 'free_product',
      rewardDescription: 'A free coffee',
      businessName: 'My Café',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Minimum 3 stamps')
  })

  it('accepts valid program data', () => {
    const schema = buildCreateProgramSchema(esProgramMessages)
    const result = schema.safeParse({
      stampsRequired: '10',
      rewardType: 'free_product',
      rewardDescription: 'Un café gratis',
      businessName: 'Mi Cafetería',
    })
    expect(result.success).toBe(true)
  })
})
