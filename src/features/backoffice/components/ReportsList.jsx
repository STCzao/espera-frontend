import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog.jsx'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { backofficeApi } from '../api/backofficeApi.js'

const reportedTypeLabels = { business: 'Negocio', user: 'Usuario' }

const statusLabels = {
  pending: 'Pendiente',
  resolved: 'Resuelto',
  suspended: 'Suspendido',
  dismissed: 'Descartado',
}

const statusTagClass = {
  pending: 'bg-espera-muted text-espera-text-muted',
  resolved: 'bg-emerald-50 text-emerald-700',
  suspended: 'bg-amber-50 text-amber-800',
  dismissed: 'bg-rose-50 text-rose-700',
}

const emptyFilters = { status: '', reportedType: '' }

function formatDateTime(isoDate) {
  return new Date(isoDate).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function ReportsList() {
  const [filters, setFilters] = useState(emptyFilters)

  const reportsQuery = useQuery({
    queryKey: ['backoffice-reports', filters],
    queryFn: () => backofficeApi.listReports(filters),
  })

  return (
    <div className="rounded-lg border border-espera-border bg-white">
      <div className="flex flex-wrap items-end gap-3 border-b border-espera-border p-4">
        <FilterField label="Estado">
          <select
            className="h-9 rounded-lg border border-espera-border bg-white px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            value={filters.status}
          >
            <option value="">Todos</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Tipo">
          <select
            className="h-9 rounded-lg border border-espera-border bg-white px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
            onChange={(event) => setFilters((current) => ({ ...current, reportedType: event.target.value }))}
            value={filters.reportedType}
          >
            <option value="">Todos</option>
            {Object.entries(reportedTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FilterField>
      </div>

      {reportsQuery.isLoading && (
        <ul>
          {[0, 1, 2].map((index) => (
            <li className="flex items-center gap-3.5 border-t border-espera-border px-5 py-3 first:border-t-0" key={index}>
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="mt-1.5 h-3 w-32" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {reportsQuery.isError && (
        <p className="p-5 text-sm font-normal text-espera-danger" role="alert">
          No pudimos cargar los reportes.
        </p>
      )}

      {reportsQuery.data && reportsQuery.data.length === 0 && (
        <p className="px-5 py-6 text-sm text-espera-text-muted">Ningún reporte coincide con estos filtros.</p>
      )}

      {reportsQuery.data && reportsQuery.data.length > 0 && (
        <ul>
          {reportsQuery.data.map((report) => (
            <ReportRow key={report.id} report={report} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ReportRow({ report }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const queryClient = useQueryClient()
  const [action, setAction] = useState(null)
  const [note, setNote] = useState('')

  const businessReviewQuery = useQuery({
    queryKey: ['backoffice-business-review', report.reportedId],
    queryFn: () => backofficeApi.getBusinessReview(report.reportedId),
    enabled: isExpanded && report.reportedType === 'business',
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['backoffice-reports'] })
  }

  function closeAction() {
    setAction(null)
    setNote('')
  }

  const resolveMutation = useMutation({
    mutationFn: () => backofficeApi.resolveReport(report.id, note.trim() || undefined),
    onSuccess: () => {
      invalidate()
      closeAction()
    },
  })

  const dismissMutation = useMutation({
    mutationFn: () => backofficeApi.dismissReport(report.id, note.trim()),
    onSuccess: () => {
      invalidate()
      closeAction()
    },
  })

  const suspendMutation = useMutation({
    mutationFn: () => backofficeApi.suspendReport(report.id, note.trim() || undefined),
    onSuccess: () => {
      invalidate()
      closeAction()
    },
  })

  const activeMutation = action === 'resolve' ? resolveMutation : action === 'dismiss' ? dismissMutation : suspendMutation

  return (
    <li className="border-t border-espera-border first:border-t-0">
      <div className="flex flex-wrap items-center gap-3.5 px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-espera-text">{report.reason}</p>
          <p className="truncate text-xs text-espera-text-muted">
            {reportedTypeLabels[report.reportedType] ?? report.reportedType} · reportado el {formatDateTime(report.createdAt)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider ${
            statusTagClass[report.status] ?? statusTagClass.pending
          }`}
        >
          {statusLabels[report.status] ?? report.status}
        </span>
        <button
          className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-espera-purple transition-colors hover:bg-espera-purple-soft"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          Detalle
          {isExpanded ? <ChevronUp aria-hidden="true" size={14} /> : <ChevronDown aria-hidden="true" size={14} />}
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-espera-border bg-espera-purple-soft/10 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-espera-text-muted">Reportado</p>
          {report.reportedType === 'business' ? (
            businessReviewQuery.isLoading ? (
              <Skeleton className="mt-1 h-4 w-40" />
            ) : businessReviewQuery.isError ? (
              <p className="mt-1 text-sm text-espera-danger">No pudimos resolver el negocio reportado.</p>
            ) : (
              <p className="mt-1 text-sm text-espera-text">
                {businessReviewQuery.data.business.name} ({businessReviewQuery.data.business.status})
              </p>
            )
          ) : (
            <p className="mt-1 text-sm text-espera-text-muted">
              Usuario <span className="font-mono text-xs">{report.reportedId}</span> — no hay endpoint para resolver su
              nombre todavía.
            </p>
          )}

          {report.internalNote && (
            <p className="mt-2 text-sm text-espera-text-muted">
              <span className="font-semibold text-espera-text">Nota de revisión:</span> {report.internalNote}
            </p>
          )}
          {report.reviewedAt && (
            <p className="mt-1 text-xs text-espera-text-muted">Revisado el {formatDateTime(report.reviewedAt)}</p>
          )}

          {report.status === 'pending' && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                className="rounded-full border border-espera-border bg-white px-3 py-1.5 text-xs font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft"
                onClick={() => setAction('resolve')}
                type="button"
              >
                Resolver
              </button>
              <button
                className="rounded-full border border-espera-border bg-white px-3 py-1.5 text-xs font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft"
                onClick={() => setAction('dismiss')}
                type="button"
              >
                Descartar
              </button>
              <button
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-espera-danger transition-colors hover:bg-espera-purple-soft"
                onClick={() => setAction('suspend')}
                type="button"
              >
                Suspender {reportedTypeLabels[report.reportedType]?.toLowerCase()}
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        confirmDisabled={action === 'dismiss' && note.trim().length === 0}
        confirmLabel={action === 'resolve' ? 'Resolver' : action === 'dismiss' ? 'Descartar' : 'Suspender'}
        description={
          action === 'resolve'
            ? 'El reporte queda resuelto sin suspender a quien fue reportado.'
            : action === 'dismiss'
              ? 'El reporte queda descartado como infundado. Contanos por qué.'
              : `Se suspende ${reportedTypeLabels[report.reportedType]?.toLowerCase()} directamente desde acá.`
        }
        isConfirming={activeMutation.isPending}
        onCancel={closeAction}
        onConfirm={() => activeMutation.mutate()}
        open={Boolean(action)}
        title={
          action === 'resolve' ? '¿Resolver este reporte?' : action === 'dismiss' ? '¿Descartar este reporte?' : '¿Suspender?'
        }
      >
        <label className="block text-sm font-medium text-espera-text" htmlFor={`report-note-${report.id}`}>
          Nota {action === 'dismiss' ? '(obligatoria)' : '(opcional)'}
        </label>
        <textarea
          className="mt-1.5 w-full rounded-lg border border-espera-border bg-white px-3 py-2 text-sm text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
          id={`report-note-${report.id}`}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          value={note}
        />
      </ConfirmDialog>
      {activeMutation.isError && (
        <p className="border-t border-espera-border p-4 text-sm font-normal text-espera-danger" role="alert">
          {activeMutation.error?.message ?? 'No pudimos actualizar el reporte.'}
        </p>
      )}
    </li>
  )
}

function FilterField({ children, label }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-espera-text-muted">
      {label}
      {children}
    </label>
  )
}
