import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'
import { FormSelect } from '../../../shared/ui/FormSelect.jsx'
import { useCurrentBusinessStore } from '../../../shared/business/currentBusinessStore.js'
import { businessOperationsApi } from '../api/businessOperationsApi.js'
import { operationalStatusSchema } from '../model/businessOperationsSchemas.js'
import { operationalStatuses } from '../model/operationalStatus.js'

const statusLabels = {
  normal: 'Normal',
  delayed: 'Con demoras',
  paused: 'Pausado',
  closed: 'Cerrado',
}

export function OperationalStatusControl({ businessId, operationalStatus }) {
  // `values` (not `defaultValues` + reset() in an effect) keeps the form in
  // sync with the store without a StrictMode double-effect race: in dev,
  // React invokes effects twice, and a reset() firing after the user already
  // started editing would silently wipe their input.
  const formValues = useMemo(
    () => ({ operationalStatus: operationalStatus ?? 'normal', reason: '' }),
    [operationalStatus],
  )

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({
    values: formValues,
    resolver: zodResolver(operationalStatusSchema),
  })

  const updateMutation = useMutation({
    mutationFn: (values) => businessOperationsApi.updateOperationalStatus(businessId, values),
    onSuccess: (data) => {
      useCurrentBusinessStore.setState({ operationalStatus: data.operationalStatus })
    },
  })

  function onSubmit(values) {
    updateMutation.mutate(values)
  }

  return (
    <div className="grid gap-4">
      <div>
        <span className="block font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-espera-text-muted">
          Estado operativo
        </span>
        <p className="mt-1 text-sm text-espera-text-muted">
          Avisá a tus clientes si hay demoras, si pausás la atención o si cerrás antes de tiempo.
        </p>
      </div>

      <form className="grid max-w-sm gap-4" noValidate onSubmit={handleSubmit(onSubmit)}>
        <FormSelect error={errors.operationalStatus?.message} label="Estado" registration={register('operationalStatus')}>
          {operationalStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </FormSelect>

        <FormField
          description="Se guarda como referencia interna, por ejemplo el motivo de un cierre anticipado."
          error={errors.reason?.message}
          label="Motivo (opcional)"
          registration={register('reason')}
        />

        <div className="w-40">
          <FormButton isPending={updateMutation.isPending} pendingLabel="Guardando…" variant="solid">
            Guardar
          </FormButton>
        </div>
      </form>

      {updateMutation.isError && (
        <p className="text-sm font-normal text-espera-danger" role="alert">
          {updateMutation.error?.message ?? 'No pudimos actualizar el estado. Intentá nuevamente.'}
        </p>
      )}
      {updateMutation.isSuccess && (
        <p className="text-sm font-normal text-espera-text-muted" role="status">
          {updateMutation.data.customerMessage}
        </p>
      )}
    </div>
  )
}
