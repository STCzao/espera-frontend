import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useBusinessCategories } from '../../business-onboarding/hooks/useBusinessCategories.js'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog.jsx'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { backofficeApi } from '../api/backofficeApi.js'
import { daysAgoISO } from '../utils/dateRange.js'

const statusLabels = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  suspended: 'Suspendido',
}

const statusTagClass = {
  pending: 'bg-espera-muted text-espera-text-muted',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  suspended: 'bg-amber-50 text-amber-800',
}

const planLabels = { basic: 'Basic', pro: 'Pro', premium: 'Premium' }

const subscriptionStatusLabels = {
  pending: 'Pendiente',
  trial: 'Prueba',
  active: 'Activa',
  expired: 'Vencida',
  cancelled: 'Cancelada',
}

const emptyFilters = {
  status: '',
  categoryId: '',
  subscriptionPlan: '',
  subscriptionStatus: '',
}

export function BusinessMetricsTable() {
  const categoriesQuery = useBusinessCategories()
  const categoryNameById = new Map((categoriesQuery.data ?? []).map((category) => [category.id, category.name]))

  const [fromDate, setFromDate] = useState(() => daysAgoISO(90))
  const [toDate, setToDate] = useState(() => daysAgoISO(0))
  const [filters, setFilters] = useState(emptyFilters)
  const [sortBy, setSortBy] = useState('turnCount')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [businessToSuspend, setBusinessToSuspend] = useState(null)
  const [suspendReason, setSuspendReason] = useState('')

  const queryClient = useQueryClient()

  const queryParams = { fromDate, toDate, ...filters, sortBy, sortDir, page, pageSize: 10 }

  const metricsQuery = useQuery({
    queryKey: ['backoffice-platform-metrics', queryParams],
    queryFn: () => backofficeApi.getPlatformMetrics(queryParams),
  })

  function updateFilter(key, value) {
    setPage(1)
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['backoffice-platform-metrics'] })
  }

  const reactivateMutation = useMutation({
    mutationFn: (businessId) => backofficeApi.reactivateBusiness(businessId),
    onSuccess: invalidate,
  })

  const suspendMutation = useMutation({
    mutationFn: ({ businessId, reason }) => backofficeApi.suspendBusiness(businessId, reason),
    onSuccess: () => {
      invalidate()
      setBusinessToSuspend(null)
      setSuspendReason('')
    },
  })

  const businesses = metricsQuery.data?.range.businesses
  const totalPages = businesses ? Math.max(1, Math.ceil(businesses.total / businesses.pageSize)) : 1

  return (
    <div className="rounded-lg border border-espera-border bg-white">
      <div className="flex flex-wrap items-end gap-3 border-b border-espera-border p-4">
        <FilterField label="Desde">
          <input
            className="h-9 rounded-lg border border-espera-border bg-white px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
            max={toDate}
            onChange={(event) => {
              setPage(1)
              setFromDate(event.target.value)
            }}
            type="date"
            value={fromDate}
          />
        </FilterField>
        <FilterField label="Hasta">
          <input
            className="h-9 rounded-lg border border-espera-border bg-white px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
            max={daysAgoISO(0)}
            onChange={(event) => {
              setPage(1)
              setToDate(event.target.value)
            }}
            type="date"
            value={toDate}
          />
        </FilterField>
        <FilterField label="Estado">
          <select
            className="h-9 rounded-lg border border-espera-border bg-white px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
            onChange={(event) => updateFilter('status', event.target.value)}
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
        <FilterField label="Categoría">
          <select
            className="h-9 rounded-lg border border-espera-border bg-white px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
            onChange={(event) => updateFilter('categoryId', event.target.value)}
            value={filters.categoryId}
          >
            <option value="">Todas</option>
            {(categoriesQuery.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Plan">
          <select
            className="h-9 rounded-lg border border-espera-border bg-white px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
            onChange={(event) => updateFilter('subscriptionPlan', event.target.value)}
            value={filters.subscriptionPlan}
          >
            <option value="">Todos</option>
            {Object.entries(planLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Suscripción">
          <select
            className="h-9 rounded-lg border border-espera-border bg-white px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
            onChange={(event) => updateFilter('subscriptionStatus', event.target.value)}
            value={filters.subscriptionStatus}
          >
            <option value="">Todas</option>
            {Object.entries(subscriptionStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Orden">
          <select
            className="h-9 rounded-lg border border-espera-border bg-white px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
            onChange={(event) => {
              setPage(1)
              setSortBy(event.target.value)
            }}
            value={sortBy}
          >
            <option value="turnCount">Turnos</option>
            <option value="businessName">Nombre</option>
          </select>
        </FilterField>
        <button
          className="rounded-full border border-espera-border bg-white px-3 py-2 text-xs font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft"
          onClick={() => {
            setPage(1)
            setSortDir((current) => (current === 'desc' ? 'asc' : 'desc'))
          }}
          type="button"
        >
          {sortDir === 'desc' ? '↓ Descendente' : '↑ Ascendente'}
        </button>
      </div>

      {metricsQuery.isLoading && (
        <ul>
          {[0, 1, 2].map((index) => (
            <li className="flex items-center gap-3.5 border-t border-espera-border px-5 py-3 first:border-t-0" key={index}>
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-1.5 h-3 w-56" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {metricsQuery.isError && (
        <p className="p-5 text-sm font-normal text-espera-danger" role="alert">
          No pudimos cargar los negocios.
        </p>
      )}

      {businesses && businesses.items.length === 0 && (
        <p className="px-5 py-6 text-sm text-espera-text-muted">
          Ningún negocio coincide con estos filtros en el rango de fechas elegido.
        </p>
      )}

      {businesses && businesses.items.length > 0 && (
        <ul>
          {businesses.items.map((business) => {
            const isPending =
              (suspendMutation.isPending && suspendMutation.variables?.businessId === business.businessId) ||
              (reactivateMutation.isPending && reactivateMutation.variables === business.businessId)

            return (
              <li
                className="flex flex-wrap items-center gap-3.5 border-t border-espera-border px-5 py-3 first:border-t-0"
                key={business.businessId}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-espera-text">{business.businessName}</p>
                  <p className="truncate text-xs text-espera-text-muted">
                    {categoryNameById.get(business.categoryId) ?? 'Categoría sin resolver'}
                    {business.subscriptionPlan && ` · ${planLabels[business.subscriptionPlan] ?? business.subscriptionPlan}`}
                    {business.subscriptionStatus &&
                      ` (${subscriptionStatusLabels[business.subscriptionStatus] ?? business.subscriptionStatus})`}
                    {' · '}
                    {business.turnCount} turnos en el rango
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider ${
                    statusTagClass[business.status] ?? statusTagClass.pending
                  }`}
                >
                  {statusLabels[business.status] ?? business.status}
                </span>
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  {business.status === 'approved' && (
                    <button
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-espera-danger transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isPending}
                      onClick={() => setBusinessToSuspend(business)}
                      type="button"
                    >
                      Suspender
                    </button>
                  )}
                  {business.status === 'suspended' && (
                    <FormButton
                      isPending={reactivateMutation.isPending && reactivateMutation.variables === business.businessId}
                      onClick={() => reactivateMutation.mutate(business.businessId)}
                      pendingLabel="Reactivando…"
                      type="button"
                      variant="solid"
                    >
                      Reactivar
                    </FormButton>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {reactivateMutation.isError && (
        <p className="border-t border-espera-border p-4 text-sm font-normal text-espera-danger" role="alert">
          {reactivateMutation.error?.message ?? 'No pudimos reactivar el negocio.'}
        </p>
      )}

      {businesses && businesses.total > businesses.pageSize && (
        <div className="flex items-center justify-between border-t border-espera-border px-5 py-3 text-sm text-espera-text-muted">
          <span>
            Página {page} de {totalPages} · {businesses.total} negocios
          </span>
          <div className="flex gap-2">
            <button
              className="rounded-full border border-espera-border bg-white px-3 py-1.5 text-xs font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Anterior
            </button>
            <button
              className="rounded-full border border-espera-border bg-white px-3 py-1.5 text-xs font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              type="button"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        confirmDisabled={suspendReason.trim().length === 0}
        confirmLabel="Suspender negocio"
        description={
          businessToSuspend
            ? `${businessToSuspend.businessName} deja de operar de inmediato: se cancelan sus turnos activos y sus empleados pierden acceso al panel.`
            : ''
        }
        isConfirming={suspendMutation.isPending}
        onCancel={() => {
          setBusinessToSuspend(null)
          setSuspendReason('')
        }}
        onConfirm={() =>
          businessToSuspend &&
          suspendMutation.mutate({ businessId: businessToSuspend.businessId, reason: suspendReason.trim() })
        }
        open={Boolean(businessToSuspend)}
        title="¿Suspender este negocio?"
      >
        <label className="block text-sm font-medium text-espera-text" htmlFor="suspend-business-reason">
          Motivo de la suspensión
        </label>
        <textarea
          className="mt-1.5 w-full rounded-lg border border-espera-border bg-white px-3 py-2 text-sm text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
          id="suspend-business-reason"
          onChange={(event) => setSuspendReason(event.target.value)}
          rows={3}
          value={suspendReason}
        />
      </ConfirmDialog>
      {suspendMutation.isError && (
        <p className="border-t border-espera-border p-4 text-sm font-normal text-espera-danger" role="alert">
          {suspendMutation.error?.message ?? 'No pudimos suspender el negocio.'}
        </p>
      )}
    </div>
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
