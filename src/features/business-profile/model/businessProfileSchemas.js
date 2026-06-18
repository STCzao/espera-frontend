import { z } from 'zod'

export const businessProfileSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  address: z.string().optional(),
})
