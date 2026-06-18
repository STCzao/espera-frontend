import { z } from 'zod'

export const inviteEmployeeSchema = z.object({
  email: z.string().email(),
})

export const acceptEmployeeInvitationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8),
})
