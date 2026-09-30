const rows = [
  { key: 'completedCount', label: 'Completados', format: (value) => value },
  { key: 'cancelledCount', label: 'Cancelados', format: (value) => value },
  { key: 'noShowCount', label: 'No se presentaron', format: (value) => value },
  { key: 'totalCount', label: 'Total', format: (value) => value },
  { key: 'cancellationRate', label: 'Tasa de cancelación', format: (value) => `${value}%` },
  { key: 'noShowRate', label: 'Tasa de no-show', format: (value) => `${value}%` },
  {
    key: 'avgServiceMinutes',
    label: 'Promedio de atención',
    format: (value) => (value != null ? `${value} min` : 'Sin datos'),
  },
  {
    key: 'peakHour',
    label: 'Hora pico',
    format: (value) => (value != null ? `${String(value).padStart(2, '0')}:00 hs` : 'Sin datos'),
  },
]

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

// Full ISO headers ("2026-08-04") were wide enough to force horizontal
// scroll on narrow phones even with just 3 columns — "dd/mm" carries the
// same information (the year is implied by the date picker above it).
function formatShortDate(isoDate) {
  const [, month, day] = isoDate.split('-')
  return `${day}/${month}`
}

export function QueueMetricsSummary({ date, metrics }) {
  // Native <input type="date"> reports an empty value while a user is
  // mid-keystroke filling in the segments, so `date` can transiently be
  // incomplete even though the query itself only fires once it's valid.
  if (!metrics || !ISO_DATE_REGEX.test(date)) return null

  const previousDate = new Date(new Date(`${date}T00:00:00Z`).getTime() - 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  return (
    <>
      {/* Even 3 columns (label + 2 dates) came out ~5-15px wider than a
          narrow phone's viewport — just enough to force the mobile layout
          viewport to expand past the device width instead of scrolling
          in-place, which reads as a lopsided/clipped right edge rather than
          an obvious scrollbar. Below sm we collapse "hoy" and "ayer" into
          one line per metric instead, same split as QueueHistoryTable. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-espera-border bg-espera-purple-soft/20">
              <th className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
                Métrica
              </th>
              <th className="px-3 py-2 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
                {formatShortDate(date)}
              </th>
              <th className="px-3 py-2 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
                {formatShortDate(previousDate)}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-espera-border last:border-b-0" key={row.key}>
                <td className="px-3 py-2 text-sm text-espera-text">{row.label}</td>
                <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-espera-text">
                  {row.format(metrics.today[row.key])}
                </td>
                <td className="px-3 py-2 text-right text-sm tabular-nums text-espera-text-muted">
                  {row.format(metrics.yesterday[row.key])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="sm:hidden">
        {rows.map((row) => (
          <li
            className="flex items-center justify-between gap-3 border-t border-espera-border px-5 py-2.5 first:border-t-0"
            key={row.key}
          >
            <span className="text-sm text-espera-text">{row.label}</span>
            <span className="shrink-0 text-right text-sm tabular-nums text-espera-text">
              <span className="font-semibold">{row.format(metrics.today[row.key])}</span>{' '}
              <span className="text-xs text-espera-text-muted">vs {row.format(metrics.yesterday[row.key])}</span>
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}
