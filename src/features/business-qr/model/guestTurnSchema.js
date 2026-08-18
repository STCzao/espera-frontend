import { z } from 'zod'

export const guestTurnSchema = z.object({
  guestName: z
    .string()
    .trim()
    .min(1, 'Ingresá tu nombre.')
    .max(100, 'El nombre no puede superar los 100 caracteres.'),
})
