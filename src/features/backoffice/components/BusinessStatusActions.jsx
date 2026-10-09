import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog.jsx'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormError } from '../../../shared/ui/FormError.jsx'
import { backofficeApi } from '../api/backofficeApi.js'

// Suspender / reactivar un negocio. Lo usan el listado (una instancia por fila)
// y la vista de detalle, así las dos aplican la misma regla y el mismo motivo
// obligatorio. Pensado para vivir dentro de un contenedor `flex flex-wrap`: los
// errores ocupan toda la línea de abajo (basis-full).
export function BusinessStatusActions({ businessId, businessName, status }) {
  const queryClient = useQueryClient()
  const [isSuspending, setIsSuspending] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['backoffice-businesses'] })
    queryClient.invalidateQueries({ queryKey: ['backoffice-business-review', businessId] })
  }

  const reactivateMutation = useMutation({
    mutationFn: () => backofficeApi.reactivateBusiness(businessId),
    onSuccess: invalidate,
  })

  const suspendMutation = useMutation({
    mutationFn: (reason) => backofficeApi.suspendBusiness(businessId, reason),
    onSuccess: () => {
      invalidate()
      setIsSuspending(false)
      setSuspendReason('')
    },
  })

  function closeSuspendDialog() {
    setIsSuspending(false)
    setSuspendReason('')
  }

  return (
    <>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {status === 'approved' && (
          <button
            className="rounded-md px-3 py-1.5 text-xs font-semibold text-espera-danger transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-60"
            disabled={suspendMutation.isPending}
            onClick={() => setIsSuspending(true)}
            type="button"
          >
            Suspender
          </button>
        )}
        {status === 'suspended' && (
          <FormButton
            isPending={reactivateMutation.isPending}
            onClick={() => reactivateMutation.mutate()}
            pendingLabel="Reactivando…"
            type="button"
            variant="solid"
          >
            Reactivar
          </FormButton>
        )}
      </div>

      {reactivateMutation.isError && (
        <div className="basis-full">
          <FormError>{reactivateMutation.error?.message ?? 'No pudimos reactivar el negocio.'}</FormError>
        </div>
      )}
      {suspendMutation.isError && (
        <div className="basis-full">
          <FormError>{suspendMutation.error?.message ?? 'No pudimos suspender el negocio.'}</FormError>
        </div>
      )}

      <ConfirmDialog
        confirmDisabled={suspendReason.trim().length === 0}
        confirmLabel="Suspender negocio"
        description={`${businessName} deja de operar de inmediato: se cancelan sus turnos activos y sus empleados pierden acceso al panel.`}
        isConfirming={suspendMutation.isPending}
        onCancel={closeSuspendDialog}
        onConfirm={() => suspendMutation.mutate(suspendReason.trim())}
        open={isSuspending}
        title="¿Suspender este negocio?"
      >
        <label className="block text-sm font-medium text-espera-text" htmlFor="suspend-business-reason">
          Motivo de la suspensión
        </label>
        <textarea
          className="mt-1.5 w-full rounded-lg border border-espera-border bg-espera-surface px-3 py-2 text-sm text-espera-text outline-none transition focus:border-espera-purple focus:ring-2 focus:ring-espera-purple-soft"
          id="suspend-business-reason"
          maxLength={500}
          onChange={(event) => setSuspendReason(event.target.value)}
          rows={3}
          value={suspendReason}
        />
      </ConfirmDialog>
    </>
  )
}
