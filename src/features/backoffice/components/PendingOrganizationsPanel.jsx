import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog.jsx'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormError } from '../../../shared/ui/FormError.jsx'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { backofficeApi } from '../api/backofficeApi.js'

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function PendingOrganizationsPanel() {
  const queryClient = useQueryClient()
  const [organizationToReject, setOrganizationToReject] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const pendingQuery = useQuery({
    queryKey: ['backoffice-pending-organizations'],
    queryFn: backofficeApi.listPendingOrganizations,
    select: (data) => data.organizations,
  })

  const approveMutation = useMutation({
    mutationFn: (organizationId) => backofficeApi.approveOrganization(organizationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['backoffice-pending-organizations'] }),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ organizationId, reason }) => backofficeApi.rejectOrganization(organizationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backoffice-pending-organizations'] })
      setOrganizationToReject(null)
      setRejectReason('')
    },
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
      <div className="p-5">
        <FormError>No pudimos cargar las organizaciones pendientes.</FormError>
      </div>
    )
  }

  const organizations = pendingQuery.data ?? []

  if (organizations.length === 0) {
    return <p className="px-5 py-6 text-sm text-espera-text-muted">No hay organizaciones pendientes de aprobación.</p>
  }

  return (
    <>
      <ul>
        {organizations.map((organization) => {
          const isPending =
            (approveMutation.isPending && approveMutation.variables === organization.id) ||
            (rejectMutation.isPending && rejectMutation.variables?.organizationId === organization.id)

          return (
            <li
              className="flex flex-wrap items-center gap-3.5 border-t border-espera-border px-5 py-3 first:border-t-0"
              key={organization.id}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-espera-text">{organization.name}</p>
                <p className="truncate text-xs text-espera-text-muted">
                  {organization.legalId ? `CUIT ${organization.legalId}` : 'Sin CUIT cargado'} · pendiente desde{' '}
                  {formatDate(organization.createdAt)}
                </p>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <button
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-espera-danger transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isPending}
                  onClick={() => setOrganizationToReject(organization)}
                  type="button"
                >
                  Rechazar
                </button>
                <FormButton
                  isPending={approveMutation.isPending && approveMutation.variables === organization.id}
                  onClick={() => approveMutation.mutate(organization.id)}
                  pendingLabel="Aprobando…"
                  type="button"
                  variant="solid"
                >
                  Aprobar
                </FormButton>
              </div>
            </li>
          )
        })}
      </ul>

      {approveMutation.isError && (
        <div className="border-t border-espera-border p-4">
          <FormError>{approveMutation.error?.message ?? 'No pudimos aprobar la organización.'}</FormError>
        </div>
      )}

      <ConfirmDialog
        confirmDisabled={rejectReason.trim().length === 0}
        confirmLabel="Rechazar organización"
        description={
          organizationToReject
            ? `${organizationToReject.name} va a quedar rechazada. Contanos por qué, se lo mostramos al dueño de la cuenta.`
            : ''
        }
        isConfirming={rejectMutation.isPending}
        onCancel={() => {
          setOrganizationToReject(null)
          setRejectReason('')
        }}
        onConfirm={() =>
          organizationToReject &&
          rejectMutation.mutate({ organizationId: organizationToReject.id, reason: rejectReason.trim() })
        }
        open={Boolean(organizationToReject)}
        title="¿Rechazar esta organización?"
      >
        <label className="block text-sm font-medium text-espera-text" htmlFor="reject-organization-reason">
          Motivo del rechazo
        </label>
        <textarea
          className="mt-1.5 w-full rounded-lg border border-espera-border bg-espera-surface px-3 py-2 text-sm text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
          id="reject-organization-reason"
          maxLength={500}
          onChange={(event) => setRejectReason(event.target.value)}
          rows={3}
          value={rejectReason}
        />
      </ConfirmDialog>
      {rejectMutation.isError && (
        <div className="border-t border-espera-border p-4">
          <FormError>{rejectMutation.error?.message ?? 'No pudimos rechazar la organización.'}</FormError>
        </div>
      )}
    </>
  )
}
