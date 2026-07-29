function minutesAgo(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  return Math.max(0, Math.floor(diffMs / 60_000))
}

export function QueueRecentCalls({ calls = [] }) {
  if (calls.length === 0) {
    return <p className="px-5 py-6 text-sm text-espera-text-muted">Sin llamados recientes.</p>
  }

  return (
    <ul>
      {calls.map((call) => (
        <li
          className="flex items-baseline gap-2.5 border-b border-espera-border px-5 py-2.5 text-sm last:border-b-0"
          key={call.turnId}
        >
          <span className="font-mono font-semibold text-espera-text">{call.displayNumber}</span>
          <span className="text-espera-text-muted">→</span>
          <span className="text-espera-text-muted">{call.serviceWindowName ?? 'sin ventanilla'}</span>
          <span className="ml-auto whitespace-nowrap text-xs text-espera-text-muted">hace {minutesAgo(call.calledAt)} min</span>
        </li>
      ))}
    </ul>
  )
}
