import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { useCurrentBusinessStore } from '../../../shared/business/currentBusinessStore.js'
import { businessQueueApi } from '../api/businessQueueApi.js'
import { QueueHistoryTable } from '../components/QueueHistoryTable.jsx'
import { QueueMetricsSummary } from '../components/QueueMetricsSummary.jsx'

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function BusinessQueueHistoryPage() {
  const activeQueueId = useCurrentBusinessStore((state) => state.activeQueueId)
  const [date, setDate] = useState(todayISO)
  // Native <input type="date"> reports an empty value while a user is
  // mid-keystroke filling in the segments — don't fetch on those.
  const isDateComplete = ISO_DATE_REGEX.test(date)

  const metricsQuery = useQuery({
    queryKey: ['queue-metrics', activeQueueId, date],
    queryFn: () => businessQueueApi.getMetrics(activeQueueId, date),
    enabled: Boolean(activeQueueId) && isDateComplete,
  })

  const historyQuery = useQuery({
    queryKey: ['queue-history', activeQueueId, date],
    queryFn: () => businessQueueApi.getTurnHistory(activeQueueId, date),
    enabled: Boolean(activeQueueId) && isDateComplete,
  })

  if (!activeQueueId) {
    return (
      <section>
        <PanelPageHeader crumb="Historial" description="Turnos completados y métricas por día." title="Historial" />
        <p className="text-espera-text-muted">
          Todavía no tenés una cola activa. Se crea automáticamente cuando tu negocio es aprobado.
        </p>
      </section>
    )
  }

  return (
    <section>
      <PanelPageHeader crumb="Historial" description="Turnos completados y métricas por día." title="Historial" />

      <div className="grid gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-espera-text" htmlFor="history-date">
            Fecha
          </label>
          <input
            className="h-10 w-full min-w-0 max-w-[170px] rounded-lg border border-espera-border bg-espera-surface px-3 text-sm text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
            id="history-date"
            max={todayISO()}
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
        </div>

        {/* min-w-0: without it, a grid item's automatic minimum size is its
            content's min-content — and a nowrap truncate row several levels
            down inside is wide enough to drag the whole column (and page)
            wider than the viewport despite its own flex min-w-0. */}
        <div className="min-w-0 rounded-lg border border-espera-border bg-espera-surface">
          {metricsQuery.isLoading && <MetricsTableSkeleton />}
          {metricsQuery.isError && (
            <p className="p-5 text-sm font-normal text-espera-danger" role="alert">
              No pudimos cargar las métricas.
            </p>
          )}
          {metricsQuery.data && <QueueMetricsSummary date={date} metrics={metricsQuery.data} />}
        </div>

        <div className="min-w-0 rounded-lg border border-espera-border bg-espera-surface">
          <div className="border-b border-espera-border bg-espera-purple-soft/15 px-5 py-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-espera-text-muted">
              Turnos completados
            </span>
          </div>
          {historyQuery.isLoading && <HistoryRowsSkeleton />}
          {historyQuery.isError && (
            <p className="p-5 text-sm font-normal text-espera-danger" role="alert">
              No pudimos cargar el historial.
            </p>
          )}
          {historyQuery.data && <QueueHistoryTable items={historyQuery.data} />}
        </div>
      </div>
    </section>
  )
}

function MetricsTableSkeleton() {
  return (
    <div className="p-5">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div className="flex items-center justify-between gap-4 border-t border-espera-border py-2.5 first:border-t-0" key={index}>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  )
}

function HistoryRowsSkeleton() {
  return (
    <div className="p-5">
      {[0, 1, 2].map((index) => (
        <div className="flex items-center gap-4 border-t border-espera-border py-3 first:border-t-0" key={index}>
          <Skeleton className="h-4 w-14" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-1.5 h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
