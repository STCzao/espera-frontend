import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
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
            className="h-10 rounded border border-espera-border bg-white px-3 text-sm text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
            id="history-date"
            max={todayISO()}
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
        </div>

        <div className="rounded border border-espera-border bg-white">
          {metricsQuery.isLoading && <p className="p-5 text-espera-text-muted">Cargando…</p>}
          {metricsQuery.isError && (
            <p className="p-5 text-sm font-normal text-espera-danger" role="alert">
              No pudimos cargar las métricas.
            </p>
          )}
          {metricsQuery.data && <QueueMetricsSummary date={date} metrics={metricsQuery.data} />}
        </div>

        <div className="rounded border border-espera-border bg-white">
          <div className="border-b border-espera-border bg-espera-purple-soft/15 px-5 py-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-espera-text-muted">
              Turnos completados
            </span>
          </div>
          {historyQuery.isLoading && <p className="p-5 text-espera-text-muted">Cargando…</p>}
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
