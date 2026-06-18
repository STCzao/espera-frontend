import { z } from 'zod'

export const registerBusinessSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  businessName: z.string().min(1),
  businessSlug: z.string().min(1),
  categoryId: z.string().min(1),
  address: z.string().optional(),
})
