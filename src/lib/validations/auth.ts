import { z } from 'zod'

export type AuthMessages = {
  emailInvalid: string
  passwordMin: string
  nameMin2: string
  nameMax80: string
}

export function buildLoginSchema(m: AuthMessages) {
  return z.object({
    email: z.string().email(m.emailInvalid),
    password: z.string().min(8, m.passwordMin),
  })
}

export function buildRegisterSchema(m: AuthMessages) {
  return z.object({
    businessName: z.string().min(2, m.nameMin2).max(80, m.nameMax80),
    email: z.string().email(m.emailInvalid),
    password: z.string().min(8, m.passwordMin),
  })
}

const ES_DEFAULTS: AuthMessages = {
  emailInvalid: 'Email inválido',
  passwordMin: 'Mínimo 8 caracteres',
  nameMin2: 'Mínimo 2 caracteres',
  nameMax80: 'Máximo 80 caracteres',
}

export const loginSchema = buildLoginSchema(ES_DEFAULTS)
export const registerSchema = buildRegisterSchema(ES_DEFAULTS)

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
