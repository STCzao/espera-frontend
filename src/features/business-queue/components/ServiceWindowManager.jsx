import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'
import { FormSelect } from '../../../shared/ui/FormSelect.jsx'
import { businessQueueApi } from '../api/businessQueueApi.js'
import { serviceWindowSchema } from '../model/businessQueueSchemas.js'

const typeLabels = {
  cashier: 'Caja',
  customer_service: 'Atención al cliente',
  information: 'Información',
  admin: 'Administración',
  technical: 'Técnica',
}

export function ServiceWindowManager({ queueId }) {
  const queryClient = useQueryClient()

  const windowsQuery = useQuery({
    queryKey: ['queue-windows', queueId],
    queryFn: () => businessQueueApi.listServiceWindows(queueId),
    enabled: Boolean(queueId),
  })

  function invalidateWindows() {
    queryClient.invalidateQueries({ queryKey: ['queue-windows', queueId] })
  }

  const createMutation = useMutation({
    mutationFn: (values) => businessQueueApi.createServiceWindow(queueId, values.name, values.type),
    onSuccess: invalidateWindows,
  })

  const toggleMutation = useMutation({
    mutationFn: (windowId) => businessQueueApi.toggleServiceWindow(queueId, windowId),
    onSuccess: invalidateWindows,
  })

  const windows = windowsQuery.data?.windows ?? []

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-espera-text-muted">
          Ventanillas
        </span>
        <span className="text-xs text-espera-text-muted">
          {windows.length} configuradas · {windows.filter((window) => window.isActive).length} activas
        </span>
      </div>

      {windowsQuery.isError && (
        <p className="text-sm font-normal text-espera-danger" role="alert">
          No pudimos cargar las ventanillas.
        </p>
      )}

      {windows.length === 0 && !windowsQuery.isLoading && (
        <p className="text-sm text-espera-text-muted">Todavía no cargaste ninguna ventanilla.</p>
      )}

      {windows.length > 0 && (
        <ul>
          {windows.map((window) => {
            const isToggling = toggleMutation.isPending && toggleMutation.variables === window.id

            return (
              <li className="border-b border-espera-border py-3 last:border-b-0" key={window.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-espera-text">{window.name}</p>
                    <p className="text-xs text-espera-text-muted">{typeLabels[window.type] ?? window.type}</p>
                  </div>
                  <button
                    aria-label={`${window.isActive ? 'Desactivar' : 'Activar'} ${window.name}`}
                    className={
                      window.isActive
                        ? 'rounded bg-espera-purple-soft px-2 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-espera-purple disabled:cursor-not-allowed disabled:opacity-60'
                        : 'rounded bg-espera-muted px-2 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-espera-text-muted disabled:cursor-not-allowed disabled:opacity-60'
                    }
                    disabled={isToggling}
                    onClick={() => toggleMutation.mutate(window.id)}
                    type="button"
                  >
                    {window.isActive ? 'Activa' : 'Inactiva'}
                  </button>
                </div>

                {window.isActive && window.currentTurn && (
                  <div className="mt-2.5 flex items-baseline gap-2 border-t border-dashed border-espera-border pt-2.5">
                    <span className="font-mono text-sm font-semibold text-espera-purple">
                      {window.currentTurn.displayNumber}
                    </span>
                    <span className="text-xs text-espera-text-muted">atendiendo</span>
                  </div>
                )}
                {window.isActive && !window.currentTurn && (
                  <p className="mt-2.5 border-t border-dashed border-espera-border pt-2.5 text-xs text-espera-text-muted">
                    Libre
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <ServiceWindowForm mutation={createMutation} />
      {createMutation.isError && (
        <p className="text-sm font-normal text-espera-danger" role="alert">
          {createMutation.error?.message ?? 'No pudimos crear la ventanilla.'}
        </p>
      )}
    </div>
  )
}

function ServiceWindowForm({ mutation }) {
  // Same remount-on-success trick as ManualTurnForm: reset() from
  // react-hook-form didn't reliably clear the DOM input in this project.
  const [formKey, setFormKey] = useState(0)

  return (
    <ServiceWindowFormFields key={formKey} mutation={mutation} onSubmitted={() => setFormKey((key) => key + 1)} />
  )
}

function ServiceWindowFormFields({ mutation, onSubmitted }) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({ defaultValues: { name: '', type: 'cashier' }, resolver: zodResolver(serviceWindowSchema) })

  async function onSubmit(values) {
    try {
      await mutation.mutateAsync(values)
      onSubmitted()
    } catch {
      // mutation.isError already drives the error message shown by the page.
    }
  }

  return (
    <form className="grid gap-3 border-t border-espera-border pt-4" noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormField
        error={errors.name?.message}
        label="Nombre"
        placeholder="Ventanilla 1"
        registration={register('name')}
      />
      <FormSelect defaultValue="cashier" error={errors.type?.message} label="Tipo" registration={register('type')}>
        <option value="cashier">Caja</option>
        <option value="customer_service">Atención al cliente</option>
        <option value="information">Información</option>
        <option value="admin">Administración</option>
        <option value="technical">Técnica</option>
      </FormSelect>
      <FormButton isPending={mutation.isPending} pendingLabel="Creando…" variant="outline">
        Agregar ventanilla
      </FormButton>
    </form>
  )
}
