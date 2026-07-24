const priorityLabels = {
  arrived: 'Llegó',
  physical: 'Presencia física',
  in_transit: 'En camino',
  registered: 'Registrado',
}

const statusLabels = {
  waiting: 'Esperando',
  called: 'Llamado',
}

export function QueueTurnList({ items = [] }) {
  if (items.length === 0) {
    return <p className="text-sm text-espera-text-muted">No hay turnos activos en este momento.</p>
  }

  return (
    <ul className="grid max-h-[420px] gap-2 overflow-y-auto pr-1">
      {items.map((item) => (
        <li
          className="flex items-center justify-between gap-3 rounded-lg border border-espera-border bg-white px-4 py-3"
          key={item.turnId}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#6a1ec2] to-[#33005f] font-mono text-sm font-bold text-white">
              {item.displayNumber}
            </span>
            <div>
              <p className="text-sm font-semibold text-espera-text">
                {item.customerName ?? item.guestName ?? 'Sin nombre'}
              </p>
              <p className="text-xs text-espera-text-muted">
                {priorityLabels[item.priority] ?? item.priority} · esperando hace {item.waitingMinutes} min
              </p>
            </div>
          </div>

          <span
            className={
              item.status === 'called'
                ? 'rounded-full bg-espera-purple px-3 py-1 text-xs font-semibold text-white'
                : 'rounded-full bg-espera-purple-soft px-3 py-1 text-xs font-semibold text-espera-purple'
            }
          >
            {statusLabels[item.status] ?? item.status}
          </span>
        </li>
      ))}
    </ul>
  )
}
