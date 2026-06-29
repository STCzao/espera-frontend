import { z } from 'zod'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/

export const registerBusinessSchema = z
  .object({
    email: z.string().trim().email('Ingresá un email válido.').toLowerCase(),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .regex(passwordRegex, 'Usá al menos una mayúscula, una minúscula y un número.'),
    confirmPassword: z.string().min(1, 'Confirmá tu contraseña.'),
    firstName: z.string().trim().min(1, 'Ingresá tu nombre.'),
    lastName: z.string().trim().min(1, 'Ingresá tu apellido.'),
    businessName: z.string().trim().min(1, 'Ingresá el nombre del negocio.'),
    businessSlug: z
      .string()
      .trim()
      .min(1, 'Ingresá el identificador del negocio.')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usá minúsculas, números y guiones.'),
    categoryId: z.string().trim().min(1, 'Seleccioná una categoría.'),
    address: z.string().trim().optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export const createBusinessSchema = z.object({
  name: z.string().trim().min(1, 'Ingresá el nombre del negocio.'),
  slug: z
    .string()
    .trim()
    .min(1, 'Ingresá el identificador del negocio.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usá minúsculas, números y guiones.'),
  categoryId: z.string().trim().min(1, 'Seleccioná una categoría.'),
  address: z.string().trim().min(1, 'Ingresá la dirección.'),
})
