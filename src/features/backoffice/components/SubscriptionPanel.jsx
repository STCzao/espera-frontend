import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog.jsx'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { backofficeApi } from '../api/backofficeApi.js'

const planLabels = { basic: 'Basic', pro: 'Pro', premium: 'Premium' }

const subscriptionStatusLabels = {
  pending: 'Pendiente',
  trial: 'Prueba',
  active: 'Activa',
  expired: 'Vencida',
  cancelled: 'Cancelada',
}

const ACTIVATABLE_STATUSES = ['pending', 'trial']
const TERMINAL_STATUSES = ['cancelled', 'expired']

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// No hay pasarela de pago en el MVP — el equipo Espera confirma el pago por
// fuera del sistema y lo refleja acá a mano (activar/cancelar/cambiar
// plan). Ver "Bugfix — Gestión manual de Subscription" en
// docs/epica-2-5-cuentas-organizaciones.md del backend.
export function SubscriptionPanel({ organizationId }) {
  const queryClient = useQueryClient()
  const [selectedPlan, setSelectedPlan] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const subscriptionQuery = useQuery({
    queryKey: ['backoffice-subscription', organizationId],
    queryFn: () => backofficeApi.getSubscription(organizationId),
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['backoffice-subscription', organizationId] })
    queryClient.invalidateQueries({ queryKey: ['backoffice-platform-metrics'] })
  }

  const activateMutation = useMutation({
    mutationFn: () => backofficeApi.activateSubscription(organizationId),
    onSuccess: invalidate,
  })

  const cancelMutation = useMutation({
    mutationFn: (reason) => backofficeApi.cancelSubscription(organizationId, reason),
    onSuccess: () => {
      invalidate()
      setIsCancelling(false)
      setCancelReason('')
    },
  })

  const changePlanMutation = useMutation({
    mutationFn: (plan) => backofficeApi.changeSubscriptionPlan(organizationId, plan),
    onSuccess: () => {
      invalidate()
      setSelectedPlan('')
    },
  })

  if (subscriptionQuery.isLoading) {
    return (
      <div className="border-t border-espera-border bg-espera-purple-soft/10 px-5 py-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
    )
  }

  if (subscriptionQuery.isError) {
    return (
      <p className="border-t border-espera-border px-5 py-4 text-sm font-normal text-espera-danger" role="alert">
        {subscriptionQuery.error?.message ?? 'No pudimos cargar la suscripción.'}
      </p>
    )
  }

  const subscription = subscriptionQuery.data
  const canActivate = ACTIVATABLE_STATUSES.includes(subscription.status)
  const canCancel = !TERMINAL_STATUSES.includes(subscription.status)

  return (
    <div className="border-t border-espera-border bg-espera-purple-soft/10 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-espera-text-muted">Suscripción</p>
      <p className="mt-1 text-sm text-espera-text">
        Plan {planLabels[subscription.plan] ?? subscription.plan} ·{' '}
        {subscriptionStatusLabels[subscription.status] ?? subscription.status}
        {subscription.status === 'trial' && subscription.trialEndsAt && (
          <> · prueba hasta {formatDate(subscription.trialEndsAt)}</>
        )}
        {subscription.status === 'cancelled' && subscription.cancellationReason && (
          <> · motivo: {subscription.cancellationReason}</>
        )}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canActivate && (
          <FormButton
            isPending={activateMutation.isPending}
            onClick={() => activateMutation.mutate()}
            pendingLabel="Activando…"
            type="button"
            variant="solid"
          >
            Activar
          </FormButton>
        )}
        {canCancel && (
          <button
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-espera-danger transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-60"
            disabled={cancelMutation.isPending}
            onClick={() => setIsCancelling(true)}
            type="button"
          >
            Cancelar suscripción
          </button>
        )}

        <select
          className="h-9 rounded-lg border border-espera-border bg-espera-surface px-2.5 text-xs text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
          onChange={(event) => setSelectedPlan(event.target.value)}
          value={selectedPlan}
        >
          <option value="">Cambiar plan a…</option>
          {Object.entries(planLabels)
            .filter(([value]) => value !== subscription.plan)
            .map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
        </select>
        <button
          className="rounded-lg border border-espera-border bg-espera-surface px-3 py-1.5 text-xs font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!selectedPlan || changePlanMutation.isPending}
          onClick={() => changePlanMutation.mutate(selectedPlan)}
          type="button"
        >
          {changePlanMutation.isPending ? 'Cambiando…' : 'Confirmar cambio de plan'}
        </button>
      </div>

      {activateMutation.isError && (
        <p className="mt-2 text-sm font-normal text-espera-danger" role="alert">
          {activateMutation.error?.message ?? 'No pudimos activar la suscripción.'}
        </p>
      )}
      {changePlanMutation.isError && (
        <p className="mt-2 text-sm font-normal text-espera-danger" role="alert">
          {changePlanMutation.error?.message ?? 'No pudimos cambiar el plan.'}
        </p>
      )}

      <ConfirmDialog
        confirmDisabled={cancelReason.trim().length === 0}
        confirmLabel="Cancelar suscripción"
        description="La organización queda sin suscripción activa. Esto no suspende sus negocios por sí solo."
        isConfirming={cancelMutation.isPending}
        onCancel={() => {
          setIsCancelling(false)
          setCancelReason('')
        }}
        onConfirm={() => cancelMutation.mutate(cancelReason.trim())}
        open={isCancelling}
        title="¿Cancelar esta suscripción?"
      >
        <label className="block text-sm font-medium text-espera-text" htmlFor={`cancel-subscription-reason-${organizationId}`}>
          Motivo
        </label>
        <textarea
          className="mt-1.5 w-full rounded-lg border border-espera-border bg-espera-surface px-3 py-2 text-sm text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
          id={`cancel-subscription-reason-${organizationId}`}
          onChange={(event) => setCancelReason(event.target.value)}
          rows={2}
          value={cancelReason}
        />
      </ConfirmDialog>
      {cancelMutation.isError && (
        <p className="mt-2 text-sm font-normal text-espera-danger" role="alert">
          {cancelMutation.error?.message ?? 'No pudimos cancelar la suscripción.'}
        </p>
      )}
    </div>
  )
}
