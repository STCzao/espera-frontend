import { z } from 'zod'

export const createQueueSchema = z.object({
  name: z.string().trim().min(1, 'Ingresá un nombre.').max(100, 'Máximo 100 caracteres.'),
  prefix: z
    .string()
    .trim()
    .min(1, 'Ingresá un prefijo.')
    .max(3, 'Máximo 3 letras.')
    .regex(/^[A-Za-z]+$/, 'Solo letras, sin números ni símbolos.'),
})

export const operationalStatusSchema = z.object({
  operationalStatus: z.enum(['normal', 'delayed', 'paused', 'closed'], {
    required_error: 'Seleccioná un estado.',
    invalid_type_error: 'Estado inválido.',
  }),
  reason: z.string().trim().max(200, 'Máximo 200 caracteres.').optional(),
})
