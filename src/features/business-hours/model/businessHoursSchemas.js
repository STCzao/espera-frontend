import { z } from 'zod'
import { hasOverlappingRanges, isValidHourRange } from './businessHoursRules.js'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const openingHourSchema = z.object({
  dayOfWeek: z.number({ invalid_type_error: 'Seleccioná un día.' }).int().min(0).max(6),
  opensAt: z.string().regex(timeRegex, 'Usá el formato HH:mm.'),
  closesAt: z.string().regex(timeRegex, 'Usá el formato HH:mm.'),
})

const nonWorkingDaySchema = z.object({
  date: z.string().regex(dateRegex, 'Usá el formato AAAA-MM-DD.'),
  reason: z.string().trim().max(120, 'Máximo 120 caracteres.').optional(),
})

export const businessHoursSchema = z
  .object({
    weeklyHours: z.array(openingHourSchema).min(1, 'Agregá al menos un rango de atención.'),
    nonWorkingDays: z.array(nonWorkingDaySchema),
  })
  .refine((values) => values.weeklyHours.every(isValidHourRange), {
    message: 'El horario de apertura debe ser anterior al de cierre.',
    path: ['weeklyHours'],
  })
  .refine((values) => !hasOverlappingRanges(values.weeklyHours), {
    message: 'Hay rangos de horario superpuestos en el mismo día.',
    path: ['weeklyHours'],
  })
  .refine(
    (values) => new Set(values.nonWorkingDays.map((day) => day.date)).size === values.nonWorkingDays.length,
    {
      message: 'No repitas la misma fecha en días no laborables.',
      path: ['nonWorkingDays'],
    },
  )
