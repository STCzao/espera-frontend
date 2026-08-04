import { useEffect, useState } from 'react'

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
  redirected: 'Derivado',
}

const statusTagClass = {
  waiting: 'bg-espera-muted text-espera-text-muted',
  called: 'bg-espera-purple-soft text-espera-purple',
  attending: 'bg-amber-50 text-amber-800',
  redirected: 'bg-sky-50 text-sky-700',
}

export function QueueTurnList({ items = [], onAttend, onCancel, onRedirect, pendingTurnId, windows = [] }) {
  const highlightedIds = useChangeHighlight(items)

  if (items.length === 0) {
    return <p className="px-5 py-6 text-sm text-espera-text-muted">No hay turnos activos en este momento.</p>
  }

  return (
    <ul>
      {items.map((item) => {
        const isPending = pendingTurnId === item.turnId

        return (
          <li
            className={`flex flex-wrap items-center gap-3.5 border-t border-espera-border px-5 py-3 transition-colors duration-1000 first:border-t-0 ${
              highlightedIds.has(item.turnId) ? 'bg-espera-purple-soft/50' : ''
            }`}
            key={item.turnId}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-espera-purple-soft font-mono text-[11px] font-bold text-espera-purple">
              {item.displayNumber.slice(-3)}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-espera-text">
                {item.customerName ?? item.guestName ?? 'Sin nombre'}
              </p>
              <p className="truncate text-xs text-espera-text-muted">
                {item.status === 'redirected' ? (
                  <>En camino a {item.serviceWindowName ?? 'otra ventanilla'}</>
                ) : (
                  <>
                    {priorityLabels[item.priority] ?? item.priority} · esperando hace {item.waitingMinutes} min
                    {item.estimatedWaitMinutes != null && ` · faltan ~${item.estimatedWaitMinutes} min`}
                    {item.serviceWindowName && ` · ${item.serviceWindowName}`}
                  </>
                )}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider ${
                statusTagClass[item.status] ?? statusTagClass.waiting
              }`}
            >
              {statusLabels[item.status] ?? item.status}
            </span>

            <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1">
              {item.status === 'called' && (
                <StartAttentionControl
                  displayNumber={item.displayNumber}
                  isPending={isPending}
                  onAttend={onAttend}
                  turnId={item.turnId}
                  windows={windows}
                />
              )}
              {item.status === 'redirected' && (
                <button
                  aria-label={`Atender a ${item.displayNumber}`}
                  className="rounded-full px-2 py-1 text-xs font-semibold text-espera-purple transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isPending}
                  onClick={() => onAttend(item.turnId, item.serviceWindowId ?? undefined)}
                  type="button"
                >
                  Atender
                </button>
              )}
              {item.status === 'attending' && (
                <>
                  <button
                    aria-label={`Finalizar atención a ${item.displayNumber}`}
                    className="rounded-full px-2 py-1 text-xs font-semibold text-espera-purple transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isPending}
                    onClick={() => onAttend(item.turnId)}
                    type="button"
                  >
                    Finalizar
                  </button>
                  <RedirectControl
                    currentWindowId={item.serviceWindowId}
                    displayNumber={item.displayNumber}
                    isPending={isPending}
                    onRedirect={onRedirect}
                    turnId={item.turnId}
                    windows={windows}
                  />
                </>
              )}
              <button
                aria-label={`Cancelar turno ${item.displayNumber}`}
                className="rounded-full px-2 py-1 text-xs font-semibold text-espera-danger transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
                onClick={() => onCancel(item.turnId, item.displayNumber)}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// Flags turns that are new or changed status since the last render so the
// row can flash briefly — otherwise real-time socket updates refresh the
// list in total silence and an operator has to notice the change by eye.
function useChangeHighlight(items) {
  const [previousStatusById, setPreviousStatusById] = useState(null)
  const [highlighted, setHighlighted] = useState(() => new Set())

  // Adjusting state during render in response to changed props, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  // — this project's lint config forbids both a plain effect that sets
  // state unconditionally and reading/writing refs during render, so this
  // is the only pattern that satisfies both.
  const signature = items.map((item) => `${item.turnId}:${item.status}`).join('|')
  const previousSignature = previousStatusById
    ? [...previousStatusById.entries()].map(([turnId, status]) => `${turnId}:${status}`).join('|')
    : null

  if (signature !== previousSignature) {
    if (previousStatusById !== null) {
      const changed = new Set()
      for (const item of items) {
        if (previousStatusById.get(item.turnId) !== item.status) {
          changed.add(item.turnId)
        }
      }
      if (changed.size > 0) {
        setHighlighted(changed)
      }
    }
    setPreviousStatusById(new Map(items.map((item) => [item.turnId, item.status])))
  }

  useEffect(() => {
    if (highlighted.size === 0) {
      return undefined
    }
    const timeout = setTimeout(() => setHighlighted(new Set()), 1500)
    return () => clearTimeout(timeout)
  }, [highlighted])

  return highlighted
}

function StartAttentionControl({ displayNumber, isPending, onAttend, turnId, windows }) {
  const [windowId, setWindowId] = useState('')
  const activeWindows = windows.filter((window) => window.isActive)

  return (
    <span className="inline-flex items-center gap-1">
      {activeWindows.length > 0 && (
        <select
          aria-label={`Ventanilla para ${displayNumber}`}
          className="h-8 w-24 rounded-full border border-espera-border bg-white px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
          disabled={isPending}
          onChange={(event) => setWindowId(event.target.value)}
          value={windowId}
        >
          <option value="">Sin ventanilla</option>
          {activeWindows.map((window) => (
            <option disabled={Boolean(window.currentTurn)} key={window.id} value={window.id}>
              {window.name}
              {window.currentTurn ? ' (ocupada)' : ''}
            </option>
          ))}
        </select>
      )}
      <button
        aria-label={`Iniciar atención a ${displayNumber}`}
        className="rounded-full px-2 py-1 text-xs font-semibold text-espera-purple transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        onClick={() => onAttend(turnId, windowId || undefined)}
        type="button"
      >
        Iniciar
      </button>
    </span>
  )
}

function RedirectControl({ currentWindowId, displayNumber, isPending, onRedirect, turnId, windows }) {
  const targetWindows = windows.filter((window) => window.isActive && window.id !== currentWindowId)
  const [windowId, setWindowId] = useState('')

  if (targetWindows.length === 0) {
    return null
  }

  return (
    <span className="inline-flex items-center gap-1">
      <select
        aria-label={`Derivar a ${displayNumber} a otra ventanilla`}
        className="h-8 w-24 rounded-full border border-espera-border bg-white px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
        disabled={isPending}
        onChange={(event) => setWindowId(event.target.value)}
        value={windowId}
      >
        <option value="">Derivar a…</option>
        {targetWindows.map((window) => (
          <option key={window.id} value={window.id}>
            {window.name}
            {window.currentTurn ? ' (ocupada)' : ''}
          </option>
        ))}
      </select>
      <button
        aria-label={`Confirmar derivación de ${displayNumber}`}
        className="rounded-full px-2 py-1 text-xs font-semibold text-espera-purple transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending || !windowId}
        onClick={() => onRedirect(turnId, windowId)}
        type="button"
      >
        Derivar
      </button>
    </span>
  )
}
