import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { BusinessNotOperatingNotice } from '../../../shared/ui/BusinessNotOperatingNotice.jsx'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'
import { PlanLimitExceededNotice } from '../../../shared/ui/PlanLimitExceededNotice.jsx'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { useBusinessCanOperate } from '../../../shared/business/useBusinessCanOperate.js'
import { useCurrentBusinessStore } from '../../../shared/business/currentBusinessStore.js'
import { getPlanLimit } from '../../../shared/business/planLimits.js'
import { businessOperationsApi } from '../api/businessOperationsApi.js'
import { createQueueSchema } from '../model/businessOperationsSchemas.js'

export function QueuesControl({ businessId }) {
  const canOperate = useBusinessCanOperate()
  const businessStatus = useCurrentBusinessStore((state) => state.status)
  const plan = useCurrentBusinessStore((state) => state.plan)
  const maxQueuesPerBusiness = getPlanLimit(plan).maxQueuesPerBusiness
  const queryClient = useQueryClient()

  const queuesQuery = useQuery({
    queryKey: ['business-queues', businessId],
    queryFn: () => businessOperationsApi.listQueues(businessId),
  })

  // `>= Infinity` is always false, so pro/premium (unlimited) never hits
  // this — only worth checking once the count has loaded.
  const isAtQueueLimit = Boolean(queuesQuery.data) && queuesQuery.data.length >= maxQueuesPerBusiness

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

  const toggleMutation = useMutation({
    mutationFn: (queueId) => businessOperationsApi.toggleQueue(businessId, queueId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-queues', businessId] }),
  })

  function onSubmit(values) {
    createMutation.mutate({ ...values, prefix: values.prefix.toUpperCase() })
  }

  // Mirrors the backend guard (QUEUE_LAST_ACTIVE) so the button is already
  // disabled instead of letting the employee submit and get rejected — every
  // live entry point (panel, QR, web, manual) operates through whichever
  // queue is "the" active one, so a business can't be left with none.
  const activeQueueCount = queuesQuery.data?.filter((queue) => queue.isActive).length ?? 0

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

      {queuesQuery.data && queuesQuery.data.length > maxQueuesPerBusiness && (
        <PlanLimitExceededNotice count={queuesQuery.data.length} label="colas" limit={maxQueuesPerBusiness} />
      )}

      {queuesQuery.data && (
        <ul>
          {queuesQuery.data.map((queue) => {
            const isLastActive = queue.isActive && activeQueueCount <= 1
            const isToggling = toggleMutation.isPending && toggleMutation.variables === queue.id

            return (
              <li
                className="flex items-center justify-between gap-3 border-t border-espera-border py-2.5 first:border-t-0"
                key={queue.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-espera-text">{queue.name}</p>
                  <p className="truncate text-xs text-espera-text-muted">Prefijo {queue.prefix}</p>
                </div>
                <button
                  aria-label={
                    isLastActive
                      ? `${queue.name} es la única cola activa — no se puede desactivar`
                      : `${queue.isActive ? 'Desactivar' : 'Activar'} ${queue.name}`
                  }
                  className={
                    queue.isActive
                      ? 'shrink-0 rounded-full bg-espera-purple-soft px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-espera-purple disabled:cursor-not-allowed disabled:opacity-60'
                      : 'shrink-0 rounded-full bg-espera-muted px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-espera-text-muted disabled:cursor-not-allowed disabled:opacity-60'
                  }
                  disabled={isToggling || isLastActive}
                  onClick={() => toggleMutation.mutate(queue.id)}
                  title={isLastActive ? 'Es la única cola activa del negocio.' : undefined}
                  type="button"
                >
                  {queue.isActive ? 'Activa' : 'Inactiva'}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {toggleMutation.isError && (
        <p className="text-sm font-normal text-espera-danger" role="alert">
          {toggleMutation.error?.message ?? 'No pudimos actualizar la cola.'}
        </p>
      )}

      {canOperate && !isAtQueueLimit && (
        <div className="border-t border-espera-border pt-4">
          <span className="mb-4 block font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-espera-text-muted">
            Crear cola
          </span>
          <form
            className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_170px] sm:items-end"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            <FormField error={errors.name?.message} label="Nombre de la cola" registration={register('name')} />
            <FormField
              error={errors.prefix?.message}
              label="Prefijo"
              maxLength={3}
              placeholder="ej. B"
              registration={register('prefix')}
            />
            <FormButton isPending={createMutation.isPending} pendingLabel="Creando…" variant="solid">
              Crear cola
            </FormButton>
          </form>

          {createMutation.isError && (
            <p className="mt-3 text-sm font-normal text-espera-danger" role="alert">
              {createMutation.error?.message ?? 'No pudimos crear la cola. Intentá nuevamente.'}
            </p>
          )}
          {createMutation.isSuccess && (
            <p className="mt-3 text-sm font-normal text-espera-text-muted" role="status">
              Cola creada.
            </p>
          )}
        </div>
      )}

      {canOperate && isAtQueueLimit && (
        <p className="border-t border-espera-border pt-4 text-sm text-espera-text-muted">
          {maxQueuesPerBusiness === 1
            ? 'Tu plan actual permite 1 cola por negocio, y ya la tenés.'
            : `Tu plan actual permite hasta ${maxQueuesPerBusiness} colas por negocio, y ya las tenés.`}{' '}
          Cambiá de plan para crear más.
        </p>
      )}

      {!canOperate && (
        <div className="border-t border-espera-border pt-4">
          <BusinessNotOperatingNotice status={businessStatus} />
        </div>
      )}
    </div>
  )
}
