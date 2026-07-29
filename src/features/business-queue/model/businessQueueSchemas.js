import { z } from 'zod'

export const manualTurnSchema = z.object({
  guestName: z
    .string()
    .trim()
    .min(1, 'Ingresá un nombre.')
    .max(100, 'Máximo 100 caracteres.'),
})

export const serviceWindowSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ingresá un nombre.')
    .max(100, 'Máximo 100 caracteres.'),
  type: z.enum(['cashier', 'customer_service', 'information', 'admin', 'technical']),
})
