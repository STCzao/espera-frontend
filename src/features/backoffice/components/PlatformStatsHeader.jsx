import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { FormError } from '../../../shared/ui/FormError.jsx'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { backofficeApi } from '../api/backofficeApi.js'
import { isRequestableRange, lastDaysRange, todayISO, validateRange } from '../model/dateRange.js'

const presets = [
  { days: 7, label: 'Últimos 7 días' },
  { days: 30, label: 'Últimos 30 días' },
  { days: 90, label: 'Últimos 90 días' },
]

const percentFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 })

// totalActiveBusinesses/totalRegisteredUsers/turnsToday/turnsThisWeek are
// always relative to "today", independent of the date range — they come back
// the same whatever range is asked for, so one call serves both the headline
// numbers and the "Actividad del período" section below.
//
// `appliedRange` es lo que se pide al backend (vacío = su default, los últimos
// 7 días); `draft` es lo que se ve en los inputs. Un rango inválido se explica
// pero no se pide: el backend no lo valida y por cada negocio con turnos hace
// consultas extra, así que un rango desmedido le saldría caro.
export function PlatformStatsHeader() {
  const [appliedRange, setAppliedRange] = useState({ fromDate: '', toDate: '' })
  // undefined = el usuario no tocó el campo; '' = lo vació mientras tipea. Se
  // distinguen para que un campo a medio escribir no vuelva solo al default.
  const [draft, setDraft] = useState({})

  const statsQuery = useQuery({
    queryKey: ['backoffice-platform-stats', appliedRange],
    queryFn: () => backofficeApi.getPlatformMetrics(appliedRange),
    // Al cambiar el rango se siguen viendo los números anteriores en vez de
    // volver al esqueleto: los 4 de arriba no cambian y no tienen por qué parpadear.
    placeholderData: keepPreviousData,
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

  // Lo que muestran los inputs: lo que el usuario escribió o, si no tocó nada,
  // el rango que resolvió el backend.
  const shownRange = {
    fromDate: draft.fromDate ?? data.range.fromDate,
    toDate: draft.toDate ?? data.range.toDate,
  }
  const rangeError = validateRange(shownRange)

  function updateRange(next) {
    setDraft(next)
    if (isRequestableRange(next)) {
      setAppliedRange(next)
    }
  }

  return (
    <>
      <dl className="grid grid-cols-2 divide-x divide-y divide-espera-border rounded-lg border border-espera-border bg-espera-surface sm:grid-cols-4 sm:divide-y-0">
        <Stat label="Negocios activos" value={data.totalActiveBusinesses} />
        <Stat label="Usuarios registrados" value={data.totalRegisteredUsers} />
        <Stat label="Turnos hoy" value={data.turnsToday} />
        <Stat label="Turnos esta semana" value={data.turnsThisWeek} />
      </dl>

      <div className="mt-6 rounded-lg border border-espera-border bg-espera-surface">
        <div className="flex flex-wrap items-end gap-3 border-b border-espera-border p-4">
          <p className="m-0 mr-auto self-center text-xs font-semibold uppercase tracking-wider text-espera-text-muted">
            Actividad del período
          </p>
          {presets.map((preset) => (
            <button
              className="rounded-md border border-espera-border bg-espera-surface px-3 py-2 text-xs font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft"
              key={preset.days}
              onClick={() => updateRange(lastDaysRange(preset.days))}
              type="button"
            >
              {preset.label}
            </button>
          ))}
          <DateField
            label="Desde"
            max={todayISO()}
            onChange={(fromDate) => updateRange({ ...shownRange, fromDate })}
            value={shownRange.fromDate}
          />
          <DateField
            label="Hasta"
            max={todayISO()}
            onChange={(toDate) => updateRange({ ...shownRange, toDate })}
            value={shownRange.toDate}
          />
        </div>

        {rangeError && (
          <div className="border-b border-espera-border p-4">
            <FormError>{rangeError}</FormError>
          </div>
        )}

        <dl className="grid grid-cols-1 divide-y divide-espera-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Stat label="Turnos del período" value={data.range.totalTurns} />
          <Stat label="Turnos cancelados" value={data.range.cancelledTurns} />
          <Stat
            hint="Sobre los turnos resueltos (completados + cancelados), no sobre el total."
            label="Tasa de cancelación"
            value={`${percentFormatter.format(data.range.cancellationRate)} %`}
          />
        </dl>

        <div className="grid gap-4 border-t border-espera-border p-4 sm:grid-cols-2">
          <RankingList
            emptyLabel="Sin turnos en este período."
            items={data.range.topBusinesses.map((business) => ({
              id: business.businessId,
              label: `${business.businessName} · ${business.turnCount} turnos`,
            }))}
            title={`Negocios más activos (${data.range.fromDate} a ${data.range.toDate})`}
          />
          <RankingList
            emptyLabel="Sin turnos en este período."
            items={data.range.topCategories.map((category) => ({
              id: category.categoryId,
              label: `${category.categoryName} · ${category.turnCount} turnos`,
            }))}
            title={`Rubros con más demanda (${data.range.fromDate} a ${data.range.toDate})`}
          />
        </div>
      </div>
    </>
  )
}

function RankingList({ emptyLabel, items, title }) {
  return (
    <div>
      <p className="m-0 text-xs font-semibold uppercase tracking-wider text-espera-text-muted">{title}</p>
      {items.length === 0 ? (
        <p className="mb-0 mt-3 text-sm text-espera-text-muted">{emptyLabel}</p>
      ) : (
        <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
          {items.map((item) => (
            <li
              className="rounded-md bg-espera-purple-soft px-3 py-1.5 text-xs font-semibold text-espera-purple"
              key={item.id}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DateField({ label, max, onChange, value }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-espera-text-muted">
      {label}
      <input
        className="h-9 rounded-lg border border-espera-border bg-espera-surface px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
        max={max}
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={value}
      />
    </label>
  )
}

function Stat({ hint, label, value }) {
  return (
    <div className="p-4">
      <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
        {label}
      </span>
      <span className="mt-1.5 block text-2xl font-semibold tabular-nums text-espera-text">{value}</span>
      {hint && <span className="mt-1 block text-xs text-espera-text-muted">{hint}</span>}
    </div>
  )
}
