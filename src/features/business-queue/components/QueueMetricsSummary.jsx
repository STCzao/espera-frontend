const rows = [
  { key: 'completedCount', label: 'Completados', format: (value) => value },
  { key: 'cancelledCount', label: 'Cancelados', format: (value) => value },
  { key: 'totalCount', label: 'Total', format: (value) => value },
  { key: 'cancellationRate', label: 'Tasa de cancelación', format: (value) => `${value}%` },
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

export function QueueMetricsSummary({ date, metrics }) {
  // Native <input type="date"> reports an empty value while a user is
  // mid-keystroke filling in the segments, so `date` can transiently be
  // incomplete even though the query itself only fires once it's valid.
  if (!metrics || !ISO_DATE_REGEX.test(date)) return null

  const previousDate = new Date(new Date(`${date}T00:00:00Z`).getTime() - 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-espera-border bg-espera-purple-soft/20">
            <th className="px-5 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
              Métrica
            </th>
            <th className="px-5 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
              {date}
            </th>
            <th className="px-5 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
              {previousDate}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-b border-espera-border last:border-b-0" key={row.key}>
              <td className="px-5 py-2.5 text-sm text-espera-text">{row.label}</td>
              <td className="px-5 py-2.5 text-right text-sm font-semibold tabular-nums text-espera-text">
                {row.format(metrics.today[row.key])}
              </td>
              <td className="px-5 py-2.5 text-right text-sm tabular-nums text-espera-text-muted">
                {row.format(metrics.yesterday[row.key])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
