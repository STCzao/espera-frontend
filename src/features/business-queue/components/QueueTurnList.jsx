import { useState } from 'react'

const priorityLabels = {
  arrived: 'Llegó',
  physical: 'Presencia física',
  in_transit: 'En camino',
  registered: 'Registrado',
}

const statusLabels = {
  waiting: 'En espera',
  called: 'Llamado',
  attending: 'Atendiendo',
}

const statusTagClass = {
  waiting: 'bg-espera-muted text-espera-text-muted',
  called: 'bg-espera-purple-soft text-espera-purple',
  attending: 'bg-amber-50 text-amber-800',
}

export function QueueTurnList({ items = [], onAttend, onCancel, pendingTurnId, windows = [] }) {
  if (items.length === 0) {
    return <p className="px-5 py-6 text-sm text-espera-text-muted">No hay turnos activos en este momento.</p>
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
              Estado
            </th>
            <th className="px-5 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isPending = pendingTurnId === item.turnId

            return (
              <tr className="border-b border-espera-border last:border-b-0 hover:bg-espera-purple-soft/10" key={item.turnId}>
                <td className="whitespace-nowrap px-5 py-3 align-middle font-mono text-sm font-semibold text-espera-text">
                  {item.displayNumber}
                </td>
                <td className="px-5 py-3 align-middle">
                  <p className="text-sm font-medium text-espera-text">
                    {item.customerName ?? item.guestName ?? 'Sin nombre'}
                  </p>
                  <p className="mt-0.5 text-xs text-espera-text-muted">
                    {priorityLabels[item.priority] ?? item.priority} · esperando hace {item.waitingMinutes} min
                    {item.estimatedWaitMinutes != null && ` · faltan ~${item.estimatedWaitMinutes} min`}
                    {item.serviceWindowName && ` · ${item.serviceWindowName}`}
                  </p>
                </td>
                <td className="px-5 py-3 align-middle">
                  <span
                    className={`rounded px-2 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider ${
                      statusTagClass[item.status] ?? statusTagClass.waiting
                    }`}
                  >
                    {statusLabels[item.status] ?? item.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right align-middle">
                  {item.status === 'called' && (
                    <StartAttentionControl
                      displayNumber={item.displayNumber}
                      isPending={isPending}
                      onAttend={onAttend}
                      turnId={item.turnId}
                      windows={windows}
                    />
                  )}
                  {item.status === 'attending' && (
                    <button
                      aria-label={`Finalizar atención a ${item.displayNumber}`}
                      className="rounded px-1.5 py-1 text-xs font-semibold text-espera-purple transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isPending}
                      onClick={() => onAttend(item.turnId)}
                      type="button"
                    >
                      Finalizar
                    </button>
                  )}
                  <button
                    aria-label={`Cancelar turno ${item.displayNumber}`}
                    className="rounded px-1.5 py-1 text-xs font-semibold text-espera-danger transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isPending}
                    onClick={() => onCancel(item.turnId)}
                    type="button"
                  >
                    Cancelar
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function StartAttentionControl({ displayNumber, isPending, onAttend, turnId, windows }) {
  const [windowId, setWindowId] = useState('')
  const activeWindows = windows.filter((window) => window.isActive)

  return (
    <span className="inline-flex items-center gap-1">
      {activeWindows.length > 0 && (
        <select
          aria-label={`Ventanilla para ${displayNumber}`}
          className="h-8 rounded border border-espera-border bg-white px-1.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
          disabled={isPending}
          onChange={(event) => setWindowId(event.target.value)}
          value={windowId}
        >
          <option value="">Sin ventanilla</option>
          {activeWindows.map((window) => (
            <option key={window.id} value={window.id}>
              {window.name}
            </option>
          ))}
        </select>
      )}
      <button
        aria-label={`Iniciar atención a ${displayNumber}`}
        className="rounded px-1.5 py-1 text-xs font-semibold text-espera-purple transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        onClick={() => onAttend(turnId, windowId || undefined)}
        type="button"
      >
        Iniciar
      </button>
    </span>
  )
}
