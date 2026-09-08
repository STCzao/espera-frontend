import { z } from 'zod'
import { isValidCuit } from '../../../shared/utils/cuit.js'

export const createBusinessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(120, 'El nombre no puede superar los 120 caracteres.'),
  categoryId: z.string().trim().uuid('Seleccioná una categoría.'),
  phone: z.string().trim().max(30, 'Máximo 30 caracteres.').optional(),
  address: z.string().trim().min(1, 'Ingresá la dirección.'),
  // Mandatory as of the backend's HU-2.5.5 revision (2026-09-08) — a CUIT is
  // a legal requirement for the Organization, so registration is now the
  // gate that used to let it through unset. Checked against the same real
  // check-digit algorithm as the backend so a typo surfaces here instead of
  // a round-trip 400.
  legalId: z
    .string({ required_error: 'Ingresá el CUIT.' })
    .trim()
    .min(1, 'Ingresá el CUIT.')
    .refine(isValidCuit, 'El CUIT no es válido.'),
})
