import { z } from 'zod'

export const createBusinessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(120, 'El nombre no puede superar los 120 caracteres.'),
  categoryId: z.string().trim().uuid('Seleccioná una categoría.'),
  phone: z.string().trim().max(30, 'Máximo 30 caracteres.').optional(),
  address: z
    .string()
    .trim()
    .min(5, 'La dirección debe tener al menos 5 caracteres.')
    .max(200, 'La dirección no puede superar los 200 caracteres.'),
})
