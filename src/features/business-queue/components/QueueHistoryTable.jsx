const priorityLabels = {
  arrived: 'Llegó',
  physical: 'Presencia física',
  in_transit: 'En camino',
  registered: 'Registrado',
}

const sourceLabels = {
  app: 'App',
  manual: 'Manual',
  qr: 'QR',
  web: 'Web',
}

function priorityLabel(priority) {
  // The history endpoint normalizes underscores to hyphens (e.g. "in-transit"),
  // unlike every other queue endpoint — normalize back before the lookup.
  return priorityLabels[priority?.replace(/-/g, '_')] ?? priority
}

function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export function QueueHistoryTable({ items = [] }) {
  if (items.length === 0) {
    return <p className="px-5 py-6 text-sm text-espera-text-muted">No hubo turnos completados este día.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-espera-border bg-espera-purple-soft/20">
            <th className="px-5 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
              Turno
            </th>
            <th className="px-5 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
              Persona
            </th>
            <th className="px-5 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
              Origen
            </th>
            <th className="px-5 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
              Llamado
            </th>
            <th className="px-5 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
              Atendido
            </th>
            <th className="px-5 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
              Espera
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr className="border-b border-espera-border last:border-b-0 hover:bg-espera-purple-soft/10" key={item.turnId}>
              <td className="whitespace-nowrap px-5 py-2.5 font-mono text-sm font-semibold text-espera-text">
                {item.displayNumber}
              </td>
              <td className="px-5 py-2.5">
                <p className="text-sm font-medium text-espera-text">
                  {item.customerName ?? item.guestName ?? 'Sin nombre'}
                </p>
                <p className="mt-0.5 text-xs text-espera-text-muted">{priorityLabel(item.priority)}</p>
              </td>
              <td className="px-5 py-2.5 text-sm text-espera-text-muted">{sourceLabels[item.source] ?? item.source}</td>
              <td className="whitespace-nowrap px-5 py-2.5 text-sm tabular-nums text-espera-text-muted">
                {formatTime(item.calledAt)}
              </td>
              <td className="whitespace-nowrap px-5 py-2.5 text-sm tabular-nums text-espera-text-muted">
                {formatTime(item.attendedAt)}
              </td>
              <td className="whitespace-nowrap px-5 py-2.5 text-right text-sm tabular-nums text-espera-text">
                {item.waitMinutes} min
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
