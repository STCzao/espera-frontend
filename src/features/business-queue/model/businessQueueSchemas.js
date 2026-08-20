import { z } from 'zod'

export const manualTurnSchema = z.object({
  guestName: z
    .string()
    .trim()
    .min(1, 'Ingresá un nombre.')
    .max(100, 'Máximo 100 caracteres.'),
  phone: z.string().trim().max(30, 'Máximo 30 caracteres.').optional(),
  // A clock time ("15:30"), same input as the weekly-hours editor — the
  // employee types the time the caller said, not a minute count. Converted
  // to the etaMinutes the backend expects right before submitting.
  arrivalTime: z.string().optional(),
})

export const serviceWindowSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ingresá un nombre.')
    .max(100, 'Máximo 100 caracteres.'),
  type: z.enum(['cashier', 'customer_service', 'information', 'admin', 'technical']),
})
