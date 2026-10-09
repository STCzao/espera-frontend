import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBusinessCategories } from '../../business-onboarding/hooks/useBusinessCategories.js'
import { FormError } from '../../../shared/ui/FormError.jsx'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { backofficeApi } from '../api/backofficeApi.js'
import {
  businessStatusLabels as statusLabels,
  businessStatusTagClass as statusTagClass,
  commercialStateLabels,
  formatDate,
  planLabels,
} from '../model/backofficeLabels.js'
import { BusinessStatusActions } from './BusinessStatusActions.jsx'

const emptyFilters = {
  status: '',
  categoryId: '',
  subscriptionPlan: '',
  commercialState: '',
}

export function BusinessMetricsTable() {
  const categoriesQuery = useBusinessCategories()
  const categoryNameById = new Map((categoriesQuery.data ?? []).map((category) => [category.id, category.name]))

  const [filters, setFilters] = useState(emptyFilters)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)

  const queryParams = { ...filters, sortBy, sortDir, page, pageSize: 20 }

  const businessesQuery = useQuery({
    queryKey: ['backoffice-businesses', queryParams],
    queryFn: () => backofficeApi.listBusinesses(queryParams),
  })

  function updateFilter(key, value) {
    setPage(1)
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const businesses = businessesQuery.data
  const totalPages = businesses ? Math.max(1, Math.ceil(businesses.total / businesses.pageSize)) : 1

  return (
    <div className="rounded-lg border border-espera-border bg-espera-surface">
      <div className="flex flex-wrap items-end gap-3 border-b border-espera-border p-4">
        <FilterField label="Estado">
          <select
            className="h-9 rounded-lg border border-espera-border bg-espera-surface px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
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
            className="h-9 rounded-lg border border-espera-border bg-espera-surface px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
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
            className="h-9 rounded-lg border border-espera-border bg-espera-surface px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
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
        <FilterField label="Estado comercial">
          <select
            className="h-9 rounded-lg border border-espera-border bg-espera-surface px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
            onChange={(event) => updateFilter('commercialState', event.target.value)}
            value={filters.commercialState}
          >
            <option value="">Todos</option>
            {Object.entries(commercialStateLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Orden">
          <select
            className="h-9 rounded-lg border border-espera-border bg-espera-surface px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
            onChange={(event) => {
              setPage(1)
              setSortBy(event.target.value)
            }}
            value={sortBy}
          >
            <option value="createdAt">Fecha de alta</option>
            <option value="businessName">Nombre</option>
          </select>
        </FilterField>
        <button
          className="rounded-md border border-espera-border bg-espera-surface px-3 py-2 text-xs font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft"
          onClick={() => {
            setPage(1)
            setSortDir((current) => (current === 'desc' ? 'asc' : 'desc'))
          }}
          type="button"
        >
          {sortDir === 'desc' ? '↓ Descendente' : '↑ Ascendente'}
        </button>
      </div>

      {businessesQuery.isLoading && (
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

      {businessesQuery.isError && (
        <div className="p-5">
          <FormError>No pudimos cargar los negocios.</FormError>
        </div>
      )}

      {businesses && businesses.items.length === 0 && (
        <p className="px-5 py-6 text-sm text-espera-text-muted">Ningún negocio coincide con estos filtros.</p>
      )}

      {businesses && businesses.items.length > 0 && (
        <ul>
          {businesses.items.map((business) => (
            <li
              className="flex flex-wrap items-center gap-3.5 border-t border-espera-border px-5 py-3 first:border-t-0"
              key={business.businessId}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-espera-text">{business.businessName}</p>
                <p className="truncate text-xs text-espera-text-muted">
                  {categoryNameById.get(business.categoryId) ?? 'Categoría sin resolver'}
                  {business.commercialState &&
                    ` · ${commercialStateLabels[business.commercialState] ?? business.commercialState}`}
                  {' · '}
                  alta {formatDate(business.createdAt)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-md px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider ${
                  statusTagClass[business.status] ?? statusTagClass.pending
                }`}
              >
                {statusLabels[business.status] ?? business.status}
              </span>
              <Link
                aria-label={`Ver detalle de ${business.businessName}`}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-espera-purple transition-colors hover:bg-espera-purple-soft"
                to={business.businessId}
              >
                Ver detalle
              </Link>
              <BusinessStatusActions
                businessId={business.businessId}
                businessName={business.businessName}
                status={business.status}
              />
            </li>
          ))}
        </ul>
      )}

      {businesses && businesses.total > businesses.pageSize && (
        <div className="flex items-center justify-between border-t border-espera-border px-5 py-3 text-sm text-espera-text-muted">
          <span>
            Página {page} de {totalPages} · {businesses.total} negocios
          </span>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-espera-border bg-espera-surface px-3 py-1.5 text-xs font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Anterior
            </button>
            <button
              className="rounded-md border border-espera-border bg-espera-surface px-3 py-1.5 text-xs font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              type="button"
            >
              Siguiente
            </button>
          </div>
        </div>
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
