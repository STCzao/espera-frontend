import { useEffect, useState } from 'react'

function minutesAgo(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  return Math.max(0, Math.floor(diffMs / 60_000))
}

// Flags calls not seen in the previous render so the newest entry can flash
// briefly instead of just silently appearing at the top of the feed.
function useNewCallHighlight(calls) {
  const [previouslySeenIds, setPreviouslySeenIds] = useState(null)
  const [highlighted, setHighlighted] = useState(() => new Set())

  // Adjusting state during render in response to changed props, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  // — this project's lint config forbids both a plain effect that sets
  // state unconditionally and reading/writing refs during render, so this
  // is the only pattern that satisfies both.
  const signature = calls.map((call) => call.turnId).join('|')
  const previousSignature = previouslySeenIds ? [...previouslySeenIds].join('|') : null

  if (signature !== previousSignature) {
    if (previouslySeenIds !== null) {
      const isNew = new Set(calls.filter((call) => !previouslySeenIds.has(call.turnId)).map((call) => call.turnId))
      if (isNew.size > 0) {
        setHighlighted(isNew)
      }
    }
    setPreviouslySeenIds(new Set(calls.map((call) => call.turnId)))
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

export function QueueRecentCalls({ calls = [] }) {
  const highlightedIds = useNewCallHighlight(calls)

  if (calls.length === 0) {
    return <p className="px-5 py-6 text-sm text-espera-text-muted">Sin llamados recientes.</p>
  }

  return (
    <ul>
      {calls.map((call) => (
        <li
          className={`flex items-center gap-3.5 border-b border-espera-border px-5 py-3 transition-colors duration-1000 last:border-b-0 ${
            highlightedIds.has(call.turnId) ? 'bg-espera-purple-soft/50' : ''
          }`}
          key={call.turnId}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-espera-purple-soft font-mono text-[11px] font-bold text-espera-purple">
            {call.displayNumber.slice(-3)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-espera-text">
              {call.displayNumber} → {call.serviceWindowName ?? 'sin ventanilla'}
            </p>
            <p className="text-xs text-espera-text-muted">Atendido</p>
          </div>
          <span className="whitespace-nowrap text-xs tabular-nums text-espera-text-muted">
            hace {minutesAgo(call.calledAt)} min
          </span>
        </li>
      ))}
    </ul>
  )
}
