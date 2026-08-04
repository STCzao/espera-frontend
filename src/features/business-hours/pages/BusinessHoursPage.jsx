import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { useCurrentBusinessStore } from '../../../shared/business/currentBusinessStore.js'
import { businessHoursApi } from '../api/businessHoursApi.js'
import { NonWorkingDaysEditor } from '../components/NonWorkingDaysEditor.jsx'
import { WeeklyHoursEditor } from '../components/WeeklyHoursEditor.jsx'
import { businessHoursSchema } from '../model/businessHoursSchemas.js'

const defaultValues = {
  weeklyHours: [],
  nonWorkingDays: [],
}

export function BusinessHoursPage() {
  const businessId = useCurrentBusinessStore((state) => state.businessId)
  const queryClient = useQueryClient()

  const hoursQuery = useQuery({
    queryKey: ['business-hours', businessId],
    queryFn: () => businessHoursApi.getHours(businessId),
    enabled: Boolean(businessId),
  })

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({ defaultValues, resolver: zodResolver(businessHoursSchema) })

  useEffect(() => {
    if (!hoursQuery.data) {
      return
    }

    reset({
      weeklyHours: hoursQuery.data.weeklyHours ?? [],
      nonWorkingDays: hoursQuery.data.nonWorkingDays ?? [],
    })
  }, [hoursQuery.data, reset])

  const updateMutation = useMutation({
    mutationFn: (values) => businessHoursApi.updateHours(businessId, values),
    onSuccess: (data) => queryClient.setQueryData(['business-hours', businessId], data),
  })

  function onSubmit(values) {
    updateMutation.mutate(values)
  }

  if (!businessId || hoursQuery.isLoading) {
    return <p className="text-espera-text-muted">Cargando…</p>
  }

  return (
    <section>
      <PanelPageHeader
        crumb="Horarios"
        description="Definí cuándo atendés y tus días no laborables."
        title="Horarios de atención"
      />

      <div className="max-w-2xl rounded-lg border border-espera-border bg-white">
        <div className="p-6">
          <form className="grid gap-7" noValidate onSubmit={handleSubmit(onSubmit)}>
            <WeeklyHoursEditor control={control} errors={errors} register={register} />
            <NonWorkingDaysEditor control={control} errors={errors} register={register} />

            {hoursQuery.isError && (
              <p className="text-sm font-normal text-espera-danger" role="alert">
                No pudimos cargar los horarios guardados.
              </p>
            )}
            {updateMutation.isError && (
              <p className="text-sm font-normal text-espera-danger" role="alert">
                {updateMutation.error?.message ?? 'No pudimos guardar los horarios. Intentá nuevamente.'}
              </p>
            )}
            {updateMutation.isSuccess && (
              <p className="text-sm font-normal text-espera-text-muted" role="status">
                Horarios guardados.
              </p>
            )}

            <div className="max-w-[220px]">
              <FormButton isPending={updateMutation.isPending} pendingLabel="Guardando…" variant="solid">
                Guardar cambios
              </FormButton>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
