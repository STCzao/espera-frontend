import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { businessStatusLabels as panelStatusLabels } from '../../../shared/business/businessStatuses.js'
import { FormError } from '../../../shared/ui/FormError.jsx'
import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { useBusinessCategories } from '../../business-onboarding/hooks/useBusinessCategories.js'
import { backofficeApi } from '../api/backofficeApi.js'
import { BusinessStatusActions } from '../components/BusinessStatusActions.jsx'
import { SubscriptionPanel } from '../components/SubscriptionPanel.jsx'
import {
  businessStatusLabels,
  businessStatusTagClass,
  coherenceAlertLabels,
  formatDateTime,
  shortId,
} from '../model/backofficeLabels.js'
import { buildBusinessTimeline } from '../model/businessTimeline.js'

function BackLink() {
  return (
    <Link
      className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-espera-text-muted transition-colors hover:text-espera-text"
      to="/backoffice/businesses"
    >
      <ArrowLeft aria-hidden="true" size={16} />
      Volver a Negocios
    </Link>
  )
}

export function BackofficeBusinessDetailPage() {
  const { businessId } = useParams()
  const categoriesQuery = useBusinessCategories()
  const categoryNameById = new Map((categoriesQuery.data ?? []).map((category) => [category.id, category.name]))

  // Mismo endpoint y misma query key que el panel de revisión de Aprobaciones:
  // sirve para un negocio en cualquier estado, no solo pendientes.
  const reviewQuery = useQuery({
    queryKey: ['backoffice-business-review', businessId],
    queryFn: () => backofficeApi.getBusinessReview(businessId),
    retry: false,
  })

  if (reviewQuery.isLoading) {
    return (
      <section>
        <BackLink />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-96" />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </section>
    )
  }

  if (reviewQuery.isError) {
    return (
      <section>
        <BackLink />
        <FormError>{reviewQuery.error?.message ?? 'No pudimos cargar este negocio.'}</FormError>
      </section>
    )
  }

  const { alerts, business, organization } = reviewQuery.data
  const timeline = buildBusinessTimeline(business)
  const hasCoordinates = business.latitude != null && business.longitude != null

  return (
    <section>
      <BackLink />

      <PanelPageHeader
        crumb="Negocios"
        description="Datos del negocio, su organización, el historial de revisión y su suscripción."
        title={business.name}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3.5 rounded-lg border border-espera-border bg-espera-surface px-5 py-4">
        <span
          className={`shrink-0 rounded-md px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider ${
            businessStatusTagClass[business.status] ?? businessStatusTagClass.pending
          }`}
        >
          {businessStatusLabels[business.status] ?? business.status}
        </span>
        <p className="m-0 text-sm text-espera-text-muted">
          {categoryNameById.get(business.categoryId) ?? 'Categoría sin resolver'} · alta {formatDateTime(business.createdAt)}
        </p>
        <BusinessStatusActions businessId={business.id} businessName={business.name} status={business.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailSection title="Datos del negocio">
          <Field label="Categoría" value={categoryNameById.get(business.categoryId) ?? 'Sin resolver'} />
          <Field label="Dirección" value={business.address} />
          <Field label="Teléfono" value={business.phone} />
          <Field
            label="Ubicación"
            value={
              hasCoordinates && (
                <a
                  className="font-semibold text-espera-purple hover:underline"
                  href={`https://www.google.com/maps?q=${business.latitude},${business.longitude}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Ver en el mapa ({business.latitude.toFixed(5)}, {business.longitude.toFixed(5)})
                </a>
              )
            }
          />
          <Field label="Publicación" value={panelStatusLabels[business.listingStatus] ?? business.listingStatus} />
          <Field label="Estado operativo" value={panelStatusLabels[business.operationalStatus] ?? business.operationalStatus} />
          <Field label="Slug" value={business.slug} />
          <Field label="Última actualización" value={formatDateTime(business.updatedAt)} />
          <Field label="Dueño (id)" value={<IdValue id={business.ownerUserId} />} />
          <Field label="Negocio (id)" value={<IdValue id={business.id} />} />
        </DetailSection>

        <DetailSection title="Organización">
          <Field label="Razón social" value={organization.name} />
          <Field
            label="CUIT"
            value={
              organization.legalId ?? (
                <span className="font-semibold text-espera-warning">Sin CUIT cargado</span>
              )
            }
          />
          <Field
            label="Rubro declarado"
            value={organization.categoryId ? (categoryNameById.get(organization.categoryId) ?? 'Sin resolver') : null}
          />
          <Field label="Organización (id)" value={<IdValue id={organization.id} />} />

          <div className="mt-4 border-t border-espera-border pt-4">
            <p className="m-0 text-xs font-semibold uppercase tracking-wider text-espera-text-muted">
              Alertas de coherencia
            </p>
            {alerts.length === 0 ? (
              <p className="mb-0 mt-2 text-sm text-espera-text-muted">Sin alertas.</p>
            ) : (
              <ul className="mb-0 mt-2 grid gap-2 pl-0">
                {alerts.map((alert) => (
                  <li
                    className="list-none rounded-md bg-espera-warning-soft px-3 py-2 text-sm text-espera-warning"
                    key={alert}
                  >
                    {coherenceAlertLabels[alert] ?? alert}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DetailSection>

        <DetailSection title="Historial de revisión">
          <ol className="m-0 grid gap-4 pl-0">
            {timeline.map((event) => (
              <li className="list-none border-l-2 border-espera-border pl-4" key={event.key}>
                <p className="m-0 text-sm font-semibold text-espera-text">{event.title}</p>
                <p className="m-0 text-xs text-espera-text-muted">
                  {formatDateTime(event.at)}
                  {event.actorId && (
                    <>
                      {' · por '}
                      <span title={event.actorId}>{shortId(event.actorId)}</span>
                    </>
                  )}
                </p>
                {event.reason && <p className="mb-0 mt-1 text-sm text-espera-text">Motivo: {event.reason}</p>}
                {event.note && <p className="mb-0 mt-1 text-sm text-espera-text">Nota: {event.note}</p>}
                {event.alerts?.length > 0 && (
                  <p className="mb-0 mt-1 text-sm text-espera-warning">
                    Se aprobó con alertas: {event.alerts.map((alert) => coherenceAlertLabels[alert] ?? alert).join(' ')}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </DetailSection>

        <div className="overflow-hidden rounded-lg border border-espera-border bg-espera-surface [&>div]:border-t-0">
          <SubscriptionPanel organizationId={organization.id} />
        </div>
      </div>
    </section>
  )
}

function DetailSection({ children, title }) {
  return (
    <div className="rounded-lg border border-espera-border bg-espera-surface p-5">
      <h2 className="m-0 mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-espera-text-muted">
        {title}
      </h2>
      <dl className="m-0 grid gap-3">{children}</dl>
    </div>
  )
}

// Un dato que el backend no tiene (teléfono opcional, sin ubicación…) se
// muestra como "—" en vez de ocultar la fila, para que se vea que falta.
function Field({ label, value }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-3">
      <dt className="text-xs font-semibold uppercase tracking-wider text-espera-text-muted">{label}</dt>
      <dd className="m-0 break-words text-sm text-espera-text">{value || '—'}</dd>
    </div>
  )
}

// Id completo y seleccionable: es lo que se pega para buscar en soporte o en la
// base. En el historial, donde hay poco lugar, se usa la versión abreviada.
function IdValue({ id }) {
  return <span className="break-all font-mono text-xs">{id}</span>
}
