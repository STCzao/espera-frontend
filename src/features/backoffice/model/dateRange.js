// Rango de fechas de las métricas de plataforma. El backend acepta fromDate y
// toDate como YYYY-MM-DD y no valida su orden ni su largo, y por cada negocio
// con turnos en el rango hace consultas extra: el frontend es quien protege.

export const MAX_RANGE_DAYS = 366

const DAY_MS = 24 * 60 * 60 * 1000

// El día calendario de Argentina, igual que el backend (todayUTC() usa UTC-3):
// con toISOString() a partir de las 21:00 "hoy" ya sería mañana.
const argentinaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
})

export function todayISO() {
  return argentinaDateFormatter.format(new Date())
}

function toUTCms(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`).getTime()
}

export function shiftDays(isoDate, days) {
  return new Date(toUTCms(isoDate) + days * DAY_MS).toISOString().slice(0, 10)
}

// "Últimos N días" incluye hoy: el default del backend (7) es de hoy-6 a hoy.
export function lastDaysRange(days) {
  const toDate = todayISO()
  return { fromDate: shiftDays(toDate, -(days - 1)), toDate }
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

// Devuelve el mensaje de error o null si el rango se puede pedir. Un input de
// fecha incompleto (el usuario está tipeando) no es un error: simplemente no
// se pide todavía.
export function validateRange({ fromDate, toDate }) {
  if (!ISO_DATE_REGEX.test(fromDate) || !ISO_DATE_REGEX.test(toDate)) {
    return null
  }

  if (fromDate > toDate) {
    return '"Desde" no puede ser posterior a "Hasta".'
  }

  if (toDate > todayISO()) {
    return 'No hay métricas de fechas futuras.'
  }

  const days = Math.round((toUTCms(toDate) - toUTCms(fromDate)) / DAY_MS) + 1
  if (days > MAX_RANGE_DAYS) {
    return `El rango no puede superar ${MAX_RANGE_DAYS} días.`
  }

  return null
}

export function isRequestableRange({ fromDate, toDate }) {
  return ISO_DATE_REGEX.test(fromDate) && ISO_DATE_REGEX.test(toDate) && validateRange({ fromDate, toDate }) === null
}
