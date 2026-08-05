import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { businessOperationsApi } from '../api/businessOperationsApi.js'
import { createQueueSchema } from '../model/businessOperationsSchemas.js'

export function QueuesControl({ businessId }) {
  const queryClient = useQueryClient()

  const queuesQuery = useQuery({
    queryKey: ['business-queues', businessId],
    queryFn: () => businessOperationsApi.listQueues(businessId),
  })

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    defaultValues: { name: '', prefix: '' },
    resolver: zodResolver(createQueueSchema),
  })

  const createMutation = useMutation({
    mutationFn: (values) => businessOperationsApi.createQueue(businessId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-queues', businessId] })
      reset()
    },
  })

  function onSubmit(values) {
    createMutation.mutate({ ...values, prefix: values.prefix.toUpperCase() })
  }

  return (
    <div className="grid gap-4">
      <div>
        <span className="block font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-espera-text-muted">
          Colas
        </span>
        <p className="mt-1 text-sm text-espera-text-muted">
          La primera cola se crea sola al aprobarse el negocio. Tu plan puede permitir crear más — cada una con su
          propio prefijo de turno (ej. "A-001", "B-001").
        </p>
      </div>

      {queuesQuery.isLoading && (
        <ul>
          {[0, 1].map((index) => (
            <li className="flex items-center gap-3 border-t border-espera-border py-2.5 first:border-t-0" key={index}>
              <Skeleton className="h-4 w-32" />
            </li>
          ))}
        </ul>
      )}

      {queuesQuery.isError && (
        <p className="text-sm font-normal text-espera-danger" role="alert">
          No pudimos cargar las colas.
        </p>
      )}

      {queuesQuery.data && (
        <ul>
          {queuesQuery.data.map((queue) => (
            <li
              className="flex items-center justify-between gap-3 border-t border-espera-border py-2.5 first:border-t-0"
              key={queue.id}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-espera-text">{queue.name}</p>
                <p className="truncate text-xs text-espera-text-muted">Prefijo {queue.prefix}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider ${
                  queue.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-espera-muted text-espera-text-muted'
                }`}
              >
                {queue.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form className="flex flex-wrap items-end gap-4 border-t border-espera-border pt-4" noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="w-56">
          <FormField error={errors.name?.message} label="Nombre de la cola" registration={register('name')} />
        </div>
        <div className="w-28">
          <FormField
            error={errors.prefix?.message}
            label="Prefijo"
            maxLength={3}
            placeholder="ej. B"
            registration={register('prefix')}
          />
        </div>
        <div className="w-40">
          <FormButton isPending={createMutation.isPending} pendingLabel="Creando…" variant="solid">
            Crear cola
          </FormButton>
        </div>
      </form>

      {createMutation.isError && (
        <p className="text-sm font-normal text-espera-danger" role="alert">
          {createMutation.error?.message ?? 'No pudimos crear la cola. Intentá nuevamente.'}
        </p>
      )}
      {createMutation.isSuccess && (
        <p className="text-sm font-normal text-espera-text-muted" role="status">
          Cola creada.
        </p>
      )}
    </div>
  )
}
