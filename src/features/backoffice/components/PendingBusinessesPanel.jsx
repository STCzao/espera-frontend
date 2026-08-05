import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { useBusinessCategories } from '../../business-onboarding/hooks/useBusinessCategories.js'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog.jsx'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { backofficeApi } from '../api/backofficeApi.js'

const alertLabels = {
  CATEGORY_MISMATCH: 'La categoría del negocio no coincide con el rubro declarado de la organización.',
  MISSING_LEGAL_ID: 'La organización no tiene CUIT/legalId cargado.',
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function PendingBusinessesPanel() {
  const [expandedBusinessId, setExpandedBusinessId] = useState(null)
  const categoriesQuery = useBusinessCategories()
  const categoryNameById = new Map((categoriesQuery.data ?? []).map((category) => [category.id, category.name]))

  const pendingQuery = useQuery({
    queryKey: ['backoffice-pending-businesses'],
    queryFn: backofficeApi.listPendingBusinesses,
    select: (data) => data.businesses,
  })

  if (pendingQuery.isLoading) {
    return (
      <ul>
        {[0, 1].map((index) => (
          <li className="flex items-center gap-3.5 border-t border-espera-border px-5 py-3 first:border-t-0" key={index}>
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-1.5 h-3 w-24" />
            </div>
          </li>
        ))}
      </ul>
    )
  }

  if (pendingQuery.isError) {
    return (
      <p className="p-5 text-sm font-normal text-espera-danger" role="alert">
        No pudimos cargar los negocios pendientes.
      </p>
    )
  }

  const businesses = pendingQuery.data ?? []

  if (businesses.length === 0) {
    return <p className="px-5 py-6 text-sm text-espera-text-muted">No hay negocios pendientes de aprobación.</p>
  }

  return (
    <ul>
      {businesses.map((business) => (
        <li className="border-t border-espera-border first:border-t-0" key={business.id}>
          <div className="flex flex-wrap items-center gap-3.5 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-espera-text">{business.name}</p>
              <p className="truncate text-xs text-espera-text-muted">
                {categoryNameById.get(business.categoryId) ?? 'Categoría sin resolver'} · pendiente desde{' '}
                {formatDate(business.createdAt)}
              </p>
            </div>
            <button
              className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-espera-purple transition-colors hover:bg-espera-purple-soft"
              onClick={() => setExpandedBusinessId(expandedBusinessId === business.id ? null : business.id)}
              type="button"
            >
              Revisar
              {expandedBusinessId === business.id ? (
                <ChevronUp aria-hidden="true" size={14} />
              ) : (
                <ChevronDown aria-hidden="true" size={14} />
              )}
            </button>
          </div>
          {expandedBusinessId === business.id && <BusinessReviewPanel businessId={business.id} />}
        </li>
      ))}
    </ul>
  )
}

function BusinessReviewPanel({ businessId }) {
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const reviewQuery = useQuery({
    queryKey: ['backoffice-business-review', businessId],
    queryFn: () => backofficeApi.getBusinessReview(businessId),
  })

  function invalidatePending() {
    queryClient.invalidateQueries({ queryKey: ['backoffice-pending-businesses'] })
  }

  const approveMutation = useMutation({
    mutationFn: () => backofficeApi.approveBusiness(businessId, note.trim() || undefined),
    onSuccess: invalidatePending,
  })

  const rejectMutation = useMutation({
    mutationFn: (reason) => backofficeApi.rejectBusiness(businessId, reason),
    onSuccess: () => {
      invalidatePending()
      setIsRejecting(false)
      setRejectReason('')
    },
  })

  if (reviewQuery.isLoading) {
    return (
      <div className="border-t border-espera-border bg-espera-purple-soft/10 px-5 py-4">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
    )
  }

  if (reviewQuery.isError) {
    return (
      <p className="border-t border-espera-border px-5 py-4 text-sm font-normal text-espera-danger" role="alert">
        No pudimos cargar el detalle de este negocio.
      </p>
    )
  }

  const { alerts, organization } = reviewQuery.data
  const requiresNote = alerts.length > 0

  return (
    <div className="border-t border-espera-border bg-espera-purple-soft/10 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-espera-text-muted">Organización</p>
      <p className="mt-1 text-sm text-espera-text">
        {organization.name} {organization.legalId ? `· CUIT ${organization.legalId}` : ''}
      </p>

      {alerts.length > 0 && (
        <div className="business-alert business-alert--warning mt-3 flex items-start gap-2" role="status">
          <span className="business-alert__led mt-1.5 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            {alerts.map((alert) => (
              <p className="m-0" key={alert}>
                {alertLabels[alert] ?? alert}
              </p>
            ))}
          </div>
        </div>
      )}

      <label className="mt-3 block text-sm font-medium text-espera-text" htmlFor={`business-approval-note-${businessId}`}>
        Nota de aprobación {requiresNote ? '(obligatoria por las alertas de arriba)' : '(opcional)'}
      </label>
      <textarea
        className="mt-1.5 w-full rounded-lg border border-espera-border bg-white px-3 py-2 text-sm text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
        id={`business-approval-note-${businessId}`}
        onChange={(event) => setNote(event.target.value)}
        rows={2}
        value={note}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-espera-danger transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-60"
          disabled={approveMutation.isPending}
          onClick={() => setIsRejecting(true)}
          type="button"
        >
          Rechazar
        </button>
        <FormButton
          disabled={(requiresNote && note.trim().length === 0) || approveMutation.isPending}
          isPending={approveMutation.isPending}
          onClick={() => approveMutation.mutate()}
          pendingLabel="Aprobando…"
          type="button"
          variant="solid"
        >
          Aprobar
        </FormButton>
      </div>

      {approveMutation.isError && (
        <p className="mt-2 text-sm font-normal text-espera-danger" role="alert">
          {approveMutation.error?.message ?? 'No pudimos aprobar el negocio.'}
        </p>
      )}

      <ConfirmDialog
        confirmDisabled={rejectReason.trim().length === 0}
        confirmLabel="Rechazar negocio"
        description="El negocio va a quedar rechazado. Contanos por qué, se lo mostramos al dueño de la cuenta."
        isConfirming={rejectMutation.isPending}
        onCancel={() => {
          setIsRejecting(false)
          setRejectReason('')
        }}
        onConfirm={() => rejectMutation.mutate(rejectReason.trim())}
        open={isRejecting}
        title="¿Rechazar este negocio?"
      >
        <label className="block text-sm font-medium text-espera-text" htmlFor={`reject-business-reason-${businessId}`}>
          Motivo del rechazo
        </label>
        <textarea
          className="mt-1.5 w-full rounded-lg border border-espera-border bg-white px-3 py-2 text-sm text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
          id={`reject-business-reason-${businessId}`}
          onChange={(event) => setRejectReason(event.target.value)}
          rows={3}
          value={rejectReason}
        />
      </ConfirmDialog>
      {rejectMutation.isError && (
        <p className="mt-2 text-sm font-normal text-espera-danger" role="alert">
          {rejectMutation.error?.message ?? 'No pudimos rechazar el negocio.'}
        </p>
      )}
    </div>
  )
}
