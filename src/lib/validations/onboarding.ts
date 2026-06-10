import { z } from 'zod'

export const createProgramSchema = z.object({
  stampsRequired: z.coerce
    .number()
    .min(3, 'Mínimo 3 sellos')
    .max(30, 'Máximo 30 sellos'),
  rewardType: z.enum(['free_product', 'discount_percent', 'two_for_one', 'custom'], {
    message: 'Seleccioná un tipo de recompensa',
  }),
  rewardDescription: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  businessName: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(80, 'Máximo 80 caracteres'),
})

export type CreateProgramInput = z.infer<typeof createProgramSchema>
