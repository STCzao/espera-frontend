import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { BusinessNotOperatingNotice } from '../../../shared/ui/BusinessNotOperatingNotice.jsx'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'
import { useBusinessCanOperate } from '../../../shared/business/useBusinessCanOperate.js'
import { useCurrentBusinessStore } from '../../../shared/business/currentBusinessStore.js'
import { businessOperationsApi } from '../api/businessOperationsApi.js'
import { serviceWindowsSchema } from '../model/businessOperationsSchemas.js'

export function ServiceWindowsControl({ activeServiceWindows, businessId }) {
  const canOperate = useBusinessCanOperate()
  const businessStatus = useCurrentBusinessStore((state) => state.status)
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({
    defaultValues: { activeServiceWindows: activeServiceWindows ?? 1 },
    resolver: zodResolver(serviceWindowsSchema),
  })

  const updateMutation = useMutation({
    mutationFn: (values) => businessOperationsApi.updateServiceWindows(businessId, values),
    onSuccess: (data) => {
      useCurrentBusinessStore.setState({ activeServiceWindows: data.activeServiceWindows })
    },
  })

  function onSubmit(values) {
    updateMutation.mutate(values)
  }

  return (
    <div className="grid gap-4">
      <div>
        <span className="block font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-espera-text-muted">
          Ventanillas activas
        </span>
        <p className="mt-1 text-sm text-espera-text-muted">
          Cuántos puntos de atención tenés funcionando en paralelo. Usá 0 si no estás recibiendo turnos.
        </p>
      </div>

      {!canOperate && <BusinessNotOperatingNotice status={businessStatus} />}

      {canOperate && (
        <form className="flex flex-wrap items-end gap-4" noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="w-32">
            <FormField
              error={errors.activeServiceWindows?.message}
              label="Cantidad"
              max={50}
              min={0}
              registration={register('activeServiceWindows', { valueAsNumber: true })}
              type="number"
            />
          </div>

          <div className="w-40">
            <FormButton isPending={updateMutation.isPending} pendingLabel="Guardando…" variant="solid">
              Guardar
            </FormButton>
          </div>
        </form>
      )}

      {canOperate && updateMutation.isError && (
        <p className="text-sm font-normal text-espera-danger" role="alert">
          {updateMutation.error?.message ?? 'No pudimos guardar las ventanillas activas. Intentá nuevamente.'}
        </p>
      )}
      {updateMutation.isSuccess && (
        <p className="text-sm font-normal text-espera-text-muted" role="status">
          {updateMutation.data.attentionAvailable
            ? 'Ventanillas guardadas. Tu negocio está disponible para recibir turnos.'
            : 'Ventanillas guardadas. Con 0 activas, tu negocio aparece como sin atención disponible.'}
        </p>
      )}
    </div>
  )
}
