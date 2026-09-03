import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { FormError } from '../../../shared/ui/FormError.jsx'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { backofficeApi } from '../api/backofficeApi.js'
import { SubscriptionPanel } from './SubscriptionPanel.jsx'

const planLabels = { basic: 'Basic', pro: 'Pro', premium: 'Premium' }

const subscriptionStatusLabels = {
  pending: 'Pendiente',
  trial: 'Prueba',
  active: 'Activa',
  expired: 'Vencida',
  cancelled: 'Cancelada',
}

// Groups the (business-level) directory rows by organization — there is no
// "list organizations" endpoint, so this reuses the same data source as
// Negocios (GET /business) but presents it one row per Organization instead
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

  // Máximo de 50 negocios por página del directorio — si la plataforma
  // supera eso, esta vista no muestra el resto todavía (mismo límite que
  // "Negocios", sin paginar acá porque agrupar por organización a través de
  // páginas complicaría la vista más de lo que vale por ahora).
  const businessesQuery = useQuery({
    queryKey: ['backoffice-subscriptions-source'],
    queryFn: () => backofficeApi.listBusinesses({ sortBy: 'businessName', sortDir: 'asc', pageSize: 50 }),
  })

  if (businessesQuery.isLoading) {
    return (
      <div className="rounded-lg border border-espera-border bg-espera-surface">
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

  if (businessesQuery.isError) {
    return (
      <div className="rounded-lg border border-espera-border bg-espera-surface p-5">
        <FormError>No pudimos cargar las suscripciones.</FormError>
      </div>
    )
  }

  const organizations = groupByOrganization(businessesQuery.data.items)

  if (organizations.length === 0) {
    return (
      <div className="rounded-lg border border-espera-border bg-espera-surface p-5">
        <p className="text-sm text-espera-text-muted">Todavía no hay negocios dados de alta.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-espera-border bg-espera-surface">
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
                  className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-espera-purple transition-colors hover:bg-espera-purple-soft"
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
