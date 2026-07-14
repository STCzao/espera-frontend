import { z } from 'zod'

export const serviceWindowsSchema = z.object({
  activeServiceWindows: z
    .number({ invalid_type_error: 'Ingresá un número.' })
    .int('Tiene que ser un número entero.')
    .min(0, 'No puede ser negativo.')
    .max(50, 'No puede superar 50.'),
})

export const operationalStatusSchema = z.object({
  operationalStatus: z.enum(['normal', 'delayed', 'paused', 'closed'], {
    required_error: 'Seleccioná un estado.',
    invalid_type_error: 'Estado inválido.',
  }),
  reason: z.string().trim().max(200, 'Máximo 200 caracteres.').optional(),
})
