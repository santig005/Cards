import { z } from 'zod'
import { COUNTRIES } from '@/lib/countries'

export type OnboardingMessages = {
  stampsMin: string
  stampsMax: string
  rewardTypeRequired: string
  descMin3: string
  descMax200: string
  nameMin2: string
  nameMax80: string
  countryRequired?: string
  timezoneRequired?: string
}

const VALID_ISO2 = COUNTRIES.map((c) => c.iso2) as [string, ...string[]]

export function buildCreateProgramSchema(m: OnboardingMessages) {
  return z.object({
    stampsRequired: z.coerce.number().min(3, m.stampsMin).max(30, m.stampsMax),
    rewardType: z.enum(['free_product', 'discount_percent', 'two_for_one', 'custom'], {
      message: m.rewardTypeRequired,
    }),
    rewardDescription: z.string().min(3, m.descMin3).max(200, m.descMax200),
    businessName: z.string().min(2, m.nameMin2).max(80, m.nameMax80),
    countryCode: z.enum(VALID_ISO2, {
      message: m.countryRequired ?? 'Invalid country',
    }).optional(),
    timezone: z.string().min(1, m.timezoneRequired ?? 'Timezone required').optional(),
    locale: z.enum(['es', 'en', 'pt']).optional(),
  })
}

const ES_DEFAULTS: OnboardingMessages = {
  stampsMin: 'Mínimo 3 sellos',
  stampsMax: 'Máximo 30 sellos',
  rewardTypeRequired: 'Seleccioná un tipo de recompensa',
  descMin3: 'Mínimo 3 caracteres',
  descMax200: 'Máximo 200 caracteres',
  nameMin2: 'Mínimo 2 caracteres',
  nameMax80: 'Máximo 80 caracteres',
}

export const createProgramSchema = buildCreateProgramSchema(ES_DEFAULTS)
export type CreateProgramInput = z.infer<typeof createProgramSchema>
