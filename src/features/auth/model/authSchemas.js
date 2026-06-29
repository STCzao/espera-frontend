import { z } from 'zod'

const nameRegex = /^[\p{L}\s'-]+$/u
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email.').toLowerCase(),
  password: z.string().min(1),
})

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('Ingresá un email válido.')
      .max(254, 'El email no puede superar los 254 caracteres.')
      .toLowerCase(),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .max(72, 'La contraseña no puede superar los 72 caracteres.')
      .regex(
        passwordRegex,
        'Usá al menos una mayúscula, una minúscula y un número.',
      ),
    confirmPassword: z.string().min(1, 'Confirmá tu contraseña.'),
    firstName: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres.')
      .max(50, 'El nombre no puede superar los 50 caracteres.')
      .regex(nameRegex, 'El nombre solo puede contener letras.'),
    lastName: z
      .string()
      .trim()
      .min(2, 'El apellido debe tener al menos 2 caracteres.')
      .max(50, 'El apellido no puede superar los 50 caracteres.')
      .regex(nameRegex, 'El apellido solo puede contener letras.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })
