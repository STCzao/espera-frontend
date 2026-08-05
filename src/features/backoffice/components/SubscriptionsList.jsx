import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { backofficeApi } from '../api/backofficeApi.js'
import { daysAgoISO } from '../utils/dateRange.js'
import { SubscriptionPanel } from './SubscriptionPanel.jsx'

const planLabels = { basic: 'Basic', pro: 'Pro', premium: 'Premium' }

const subscriptionStatusLabels = {
  pending: 'Pendiente',
  trial: 'Prueba',
  active: 'Activa',
  expired: 'Vencida',
  cancelled: 'Cancelada',
}

// Groups the (business-level) platform metrics rows by organization — there
// is no "list organizations" endpoint, so this reuses the same data source
// as Negocios (HU-8.4/8.5) but presents it one row per Organization instead
// of one row per Business, since a Subscription belongs to the Organization.
function groupByOrganization(items) {
  const byOrganization = new Map()
  for (const item of items) {
    const existing = byOrganization.get(item.organizationId)
    if (existing) {
      existing.businessNames.push(item.businessName)
    } else {
      byOrganization.set(item.organizationId, {
        organizationId: item.organizationId,
        businessNames: [item.businessName],
        subscriptionPlan: item.subscriptionPlan,
        subscriptionStatus: item.subscriptionStatus,
      })
    }
  }
  return [...byOrganization.values()]
}

export function SubscriptionsList() {
  const [expandedOrganizationId, setExpandedOrganizationId] = useState(null)

  // 90 días + el máximo de 50 negocios por página reduce (sin eliminar) la
  // misma limitación de origen que ya documentamos en Negocios: un negocio
  // sin turnos en el rango, o si hay más de 50, no aparece acá tampoco.
  const metricsQuery = useQuery({
    queryKey: ['backoffice-subscriptions-source'],
    queryFn: () =>
      backofficeApi.getPlatformMetrics({
        fromDate: daysAgoISO(90),
        toDate: daysAgoISO(0),
        sortBy: 'businessName',
        sortDir: 'asc',
        pageSize: 50,
      }),
  })

  if (metricsQuery.isLoading) {
    return (
      <div className="rounded-lg border border-espera-border bg-white">
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
      </div>
    )
  }

  if (metricsQuery.isError) {
    return (
      <div className="rounded-lg border border-espera-border bg-white p-5">
        <p className="text-sm font-normal text-espera-danger" role="alert">
          No pudimos cargar las suscripciones.
        </p>
      </div>
    )
  }

  const organizations = groupByOrganization(metricsQuery.data.range.businesses.items)

  if (organizations.length === 0) {
    return (
      <div className="rounded-lg border border-espera-border bg-white p-5">
        <p className="text-sm text-espera-text-muted">
          No hay organizaciones con actividad en los últimos 90 días para mostrar acá.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-espera-border bg-white">
      <ul>
        {organizations.map((organization) => {
          const isExpanded = expandedOrganizationId === organization.organizationId

          return (
            <li className="border-t border-espera-border first:border-t-0" key={organization.organizationId}>
              <div className="flex flex-wrap items-center gap-3.5 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-espera-text">
                    {organization.businessNames.join(', ')}
                  </p>
                  <p className="truncate text-xs text-espera-text-muted">
                    {organization.subscriptionPlan
                      ? `${planLabels[organization.subscriptionPlan] ?? organization.subscriptionPlan} · ${
                          subscriptionStatusLabels[organization.subscriptionStatus] ?? organization.subscriptionStatus
                        }`
                      : 'Sin suscripción resuelta'}
                  </p>
                </div>
                <button
                  className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-espera-purple transition-colors hover:bg-espera-purple-soft"
                  onClick={() => setExpandedOrganizationId(isExpanded ? null : organization.organizationId)}
                  type="button"
                >
                  Gestionar
                  {isExpanded ? <ChevronUp aria-hidden="true" size={14} /> : <ChevronDown aria-hidden="true" size={14} />}
                </button>
              </div>
              {isExpanded && <SubscriptionPanel organizationId={organization.organizationId} />}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
