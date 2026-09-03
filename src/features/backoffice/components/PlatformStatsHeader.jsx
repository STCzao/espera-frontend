import { useQuery } from '@tanstack/react-query'
import { FormError } from '../../../shared/ui/FormError.jsx'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { backofficeApi } from '../api/backofficeApi.js'

// totalActiveBusinesses/totalRegisteredUsers/turnsToday/turnsThisWeek are
// always relative to "today", independent of any date range or filter — a
// single default-range call is enough, decoupled from BusinessMetricsTable's
// own (filterable) query.
export function PlatformStatsHeader() {
  const statsQuery = useQuery({
    queryKey: ['backoffice-platform-stats'],
    queryFn: () => backofficeApi.getPlatformMetrics(),
  })

  if (statsQuery.isLoading) {
    return (
      <dl className="grid grid-cols-2 gap-4 rounded-lg border border-espera-border bg-espera-surface p-5 sm:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-7 w-14" />
          </div>
        ))}
      </dl>
    )
  }

  if (statsQuery.isError) {
    return (
      <div className="rounded-lg border border-espera-border bg-espera-surface p-5">
        <FormError>No pudimos cargar las métricas de la plataforma.</FormError>
      </div>
    )
  }

  const data = statsQuery.data

  return (
    <>
      <dl className="grid grid-cols-2 divide-x divide-y divide-espera-border rounded-lg border border-espera-border bg-espera-surface sm:grid-cols-4 sm:divide-y-0">
        <Stat label="Negocios activos" value={data.totalActiveBusinesses} />
        <Stat label="Usuarios registrados" value={data.totalRegisteredUsers} />
        <Stat label="Turnos hoy" value={data.turnsToday} />
        <Stat label="Turnos esta semana" value={data.turnsThisWeek} />
      </dl>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {data.range.topBusinesses.length > 0 && (
          <div className="rounded-lg border border-espera-border bg-espera-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-espera-text-muted">
              Negocios más activos ({data.range.fromDate} a {data.range.toDate})
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {data.range.topBusinesses.map((business) => (
                <li
                  className="rounded-md bg-espera-purple-soft px-3 py-1.5 text-xs font-semibold text-espera-purple"
                  key={business.businessId}
                >
                  {business.businessName} · {business.turnCount} turnos
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.range.topCategories.length > 0 && (
          <div className="rounded-lg border border-espera-border bg-espera-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-espera-text-muted">
              Rubros con más demanda ({data.range.fromDate} a {data.range.toDate})
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {data.range.topCategories.map((category) => (
                <li
                  className="rounded-md bg-espera-purple-soft px-3 py-1.5 text-xs font-semibold text-espera-purple"
                  key={category.categoryId}
                >
                  {category.categoryName} · {category.turnCount} turnos
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}

function Stat({ label, value }) {
  return (
    <div className="p-4">
      <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
        {label}
      </span>
      <span className="mt-1.5 block text-2xl font-semibold tabular-nums text-espera-text">{value}</span>
    </div>
  )
}
