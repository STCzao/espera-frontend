import { formatMinutes } from '../../../shared/format/duration.js'

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

const statusLabels = {
  completed: 'Completado',
  cancelled: 'Cancelado',
  no_show: 'No se presentó',
}

const statusTagClass = {
  completed: 'bg-espera-success-soft text-espera-success',
  cancelled: 'bg-espera-muted text-espera-text-muted',
  no_show: 'bg-espera-warning-soft text-espera-warning',
}

function priorityLabel(priority) {
  // The history endpoint normalizes underscores to hyphens (e.g. "in-transit"),
  // unlike every other queue endpoint — normalize back before the lookup.
  return priorityLabels[priority?.replace(/-/g, '_')] ?? priority
}

// null shows up whenever the step never happened — a turn cancelled before
// being called has no calledAt, a no-show never got an attendedAt. Feeding
// that straight to `new Date()` silently resolves to the Unix epoch instead
// of erroring, so it has to be caught explicitly here.
function formatTime(isoDate) {
  return isoDate ? new Date(isoDate).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'
}

function StatusTag({ status }) {
  return (
    <span
      className={`shrink-0 rounded-md px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider ${
        statusTagClass[status] ?? statusTagClass.completed
      }`}
    >
      {statusLabels[status] ?? status}
    </span>
  )
}

export function QueueHistoryTable({ items = [] }) {
  if (items.length === 0) {
    return <p className="px-5 py-6 text-sm text-espera-text-muted">No hubo turnos completados este día.</p>
  }

  return (
    <>
      {/* Ahora 6 columnas compactas (Llamado+Atendido fusionados en Horario,
          padding reducido) entran en la mayoría de los anchos sin scroll —
          overflow-x-auto queda solo como red de seguridad para pantallas muy
          angostas. Por debajo de sm seguimos usando filas tipo tarjeta,
          consistentes con el resto del panel (HU-6.6). */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-espera-border bg-espera-purple-soft/20">
              <th className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
                Turno
              </th>
              <th className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
                Persona
              </th>
              <th className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
                Origen
              </th>
              <th className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
                Horario
              </th>
              <th className="px-3 py-2 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
                Espera
              </th>
              <th className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="border-b border-espera-border last:border-b-0 hover:bg-espera-purple-soft/10" key={item.turnId}>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-sm font-semibold text-espera-text">
                  {item.displayNumber}
                </td>
                <td className="px-3 py-2">
                  <p className="text-sm font-medium text-espera-text">
                    {item.customerName ?? item.guestName ?? 'Sin nombre'}
                  </p>
                  <p className="mt-0.5 text-xs text-espera-text-muted">{priorityLabel(item.priority)}</p>
                </td>
                <td className="px-3 py-2 text-sm text-espera-text-muted">{sourceLabels[item.source] ?? item.source}</td>
                <td className="whitespace-nowrap px-3 py-2 text-sm tabular-nums text-espera-text-muted">
                  {formatTime(item.calledAt)} → {formatTime(item.attendedAt)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-espera-text">
                  {formatMinutes(item.waitMinutes)}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <StatusTag status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="sm:hidden">
        {items.map((item) => (
          <li className="flex items-center gap-3.5 border-t border-espera-border px-5 py-3 first:border-t-0" key={item.turnId}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-espera-purple-soft font-mono text-[11px] font-bold text-espera-purple">
              {item.displayNumber.slice(-3)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-espera-text">
                {item.customerName ?? item.guestName ?? 'Sin nombre'}
              </p>
              <p className="truncate text-xs text-espera-text-muted">
                {priorityLabel(item.priority)} · {sourceLabels[item.source] ?? item.source} · {formatTime(item.calledAt)}–
                {formatTime(item.attendedAt)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-right text-sm tabular-nums text-espera-text">{formatMinutes(item.waitMinutes)}</span>
              <StatusTag status={item.status} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
