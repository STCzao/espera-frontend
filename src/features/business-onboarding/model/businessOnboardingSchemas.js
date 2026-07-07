import { z } from 'zod'

export const createBusinessSchema = z.object({
  name: z.string().trim().min(1, 'Ingresá el nombre del negocio.'),
  categoryId: z.string().trim().min(1, 'Seleccioná una categoría.'),
  address: z.string().trim().min(1, 'Ingresá la dirección.'),
})
