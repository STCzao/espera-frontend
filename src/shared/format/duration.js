// A turn attended days after it was created (stale test data, an employee
// forgetting to close out the queue overnight, etc.) renders as "2054 min"
// otherwise — accurate, but the reader has to do the days/hours math
// themselves. This collapses to the two most significant units instead.
export function formatMinutes(totalMinutes) {
  const minutes = Math.max(0, Math.round(totalMinutes))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`
  }
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }
  return `${mins} min`
}

// Converts a clock time ("15:30", from a native <input type="time">) into
// "minutes from now" — lets the employee type the time a caller actually
// said instead of doing the subtraction themselves. If that time already
// passed today, assumes they mean tomorrow (an overnight reservation).
export function minutesUntil(timeString, now = new Date()) {
  if (!timeString) {
    return undefined
  }

  const [hours, mins] = timeString.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(mins)) {
    return undefined
  }

  const target = new Date(now)
  target.setHours(hours, mins, 0, 0)
  if (target < now) {
    target.setDate(target.getDate() + 1)
  }

  return Math.round((target.getTime() - now.getTime()) / 60_000)
}
