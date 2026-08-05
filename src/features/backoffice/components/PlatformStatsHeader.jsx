import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { backofficeApi } from '../api/backofficeApi.js'

// totalActiveBusinesses/totalRegisteredUsers/turnsToday/turnsThisWeek are
// always relative to "today", independent of any date range or filter — a
// single default-range call is enough, decoupled from BusinessMetricsTable's
// own (filterable) query.
export function PlatformStatsHeader() {
  const statsQuery = useQuery({
    queryKey: ['backoffice-platform-stats'],
    queryFn: () => backofficeApi.getPlatformMetrics({ pageSize: 1 }),
  })

  if (statsQuery.isLoading) {
    return (
      <dl className="grid grid-cols-2 gap-4 rounded-lg border border-espera-border bg-white p-5 sm:grid-cols-4">
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
      <p className="rounded-lg border border-espera-border bg-white p-5 text-sm font-normal text-espera-danger" role="alert">
        No pudimos cargar las métricas de la plataforma.
      </p>
    )
  }

  const data = statsQuery.data

  return (
    <>
      <dl className="grid grid-cols-2 divide-x divide-y divide-espera-border rounded-lg border border-espera-border bg-white sm:grid-cols-4 sm:divide-y-0">
        <Stat label="Negocios activos" value={data.totalActiveBusinesses} />
        <Stat label="Usuarios registrados" value={data.totalRegisteredUsers} />
        <Stat label="Turnos hoy" value={data.turnsToday} />
        <Stat label="Turnos esta semana" value={data.turnsThisWeek} />
      </dl>

      {data.range.topCategories.length > 0 && (
        <div className="mt-4 rounded-lg border border-espera-border bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-espera-text-muted">
            Rubros con más demanda ({data.range.fromDate} a {data.range.toDate})
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {data.range.topCategories.map((category) => (
              <li
                className="rounded-full bg-espera-purple-soft px-3 py-1.5 text-xs font-semibold text-espera-purple"
                key={category.categoryId}
              >
                {category.categoryName} · {category.turnCount} turnos
              </li>
            ))}
          </ul>
        </div>
      )}
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
