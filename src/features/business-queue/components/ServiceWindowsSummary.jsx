import { useQuery } from '@tanstack/react-query'
import { businessQueueApi } from '../api/businessQueueApi.js'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'

export function ServiceWindowsSummary({ onManage, queueId }) {
  const windowsQuery = useQuery({
    queryKey: ['queue-windows', queueId],
    queryFn: () => businessQueueApi.listServiceWindows(queueId),
    enabled: Boolean(queueId),
  })

  const windows = windowsQuery.data?.windows ?? []

  return (
    <div className="flex h-full flex-col gap-3.5 p-5">
      <h3 className="text-sm font-bold text-espera-text">Ventanillas</h3>

      {windowsQuery.isError && (
        <p className="text-sm font-normal text-espera-danger" role="alert">
          No pudimos cargar las ventanillas.
        </p>
      )}
      {windows.length === 0 && !windowsQuery.isLoading && (
        <p className="text-sm text-espera-text-muted">Todavía no cargaste ninguna ventanilla.</p>
      )}

      {windowsQuery.isLoading && (
        <div className="flex-1">
          {[0, 1].map((index) => (
            <div className="flex items-center justify-between gap-3 border-t border-espera-border py-2.5 first:border-t-0" key={index}>
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-1.5 h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16 shrink-0 !rounded-full" />
            </div>
          ))}
        </div>
      )}

      <div className="flex-1">
        {windows.map((window) => (
          <div className="flex items-center justify-between gap-3 border-t border-espera-border py-2.5 first:border-t-0" key={window.id}>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-espera-text">{window.name}</p>
              <p className="truncate text-xs text-espera-text-muted">
                {window.isActive
                  ? window.currentTurn
                    ? `${window.currentTurn.displayNumber} · atendiendo`
                    : 'Libre'
                  : 'Sin turno asignado'}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider ${
                !window.isActive
                  ? 'border border-espera-border bg-white text-espera-text-muted'
                  : window.currentTurn
                    ? 'bg-espera-purple-soft text-espera-purple'
                    : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {!window.isActive ? 'Inactiva' : window.currentTurn ? 'Ocupada' : 'Libre'}
            </span>
          </div>
        ))}
      </div>

      <button
        className="w-full rounded-full border border-espera-border bg-white py-2.5 text-sm font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft"
        onClick={onManage}
        type="button"
      >
        Gestionar ventanillas
      </button>
    </div>
  )
}
