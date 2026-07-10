import { z } from 'zod'

export const businessProfileSchema = z.object({
  name: z.string().trim().min(1, 'Ingresá el nombre del negocio.'),
  categoryId: z.string().trim().min(1, 'Seleccioná una categoría.'),
  phone: z.string().trim().max(30, 'Máximo 30 caracteres.').optional(),
  address: z.string().trim().min(1, 'Ingresá la dirección.'),
})
