import { z } from 'zod'

export const createBusinessSchema = z.object({
  name: z.string().trim().min(1, 'Ingresá el nombre del negocio.'),
  categoryId: z.string().trim().min(1, 'Seleccioná una categoría.'),
  phone: z.string().trim().max(30, 'Máximo 30 caracteres.').optional(),
  address: z.string().trim().min(1, 'Ingresá la dirección.'),
  // Optional on purpose, same as the backend (HU-2.5.5): the backoffice asks
  // for it before approving, but registration isn't blocked without it —
  // it can still be added later. No format check here either — the backend
  // stores it as free text (a CUIT or the org's razón social), not a
  // validated CUIT/CUIL number.
  legalId: z.string().trim().max(50, 'Máximo 50 caracteres.').optional(),
})
