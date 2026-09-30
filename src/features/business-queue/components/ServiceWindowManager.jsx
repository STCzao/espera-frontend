import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog.jsx'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormError } from '../../../shared/ui/FormError.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'
import { FormSelect } from '../../../shared/ui/FormSelect.jsx'
import { PlanLimitExceededNotice } from '../../../shared/ui/PlanLimitExceededNotice.jsx'
import { useCurrentBusinessStore } from '../../../shared/business/currentBusinessStore.js'
import { getPlanLimit } from '../../../shared/business/planLimits.js'
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
  const [windowToDeactivate, setWindowToDeactivate] = useState(null)
  const [windowToDelete, setWindowToDelete] = useState(null)
  const [editingWindowId, setEditingWindowId] = useState(null)

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
    onSuccess: () => {
      invalidateWindows()
      setWindowToDeactivate(null)
    },
  })

  const editMutation = useMutation({
    mutationFn: ({ windowId, changes }) => businessQueueApi.editServiceWindow(queueId, windowId, changes),
    onSuccess: () => {
      invalidateWindows()
      setEditingWindowId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (windowId) => businessQueueApi.deleteServiceWindow(queueId, windowId),
    onSuccess: () => {
      invalidateWindows()
      setWindowToDelete(null)
    },
  })

  const windows = windowsQuery.data?.windows ?? []
  const plan = useCurrentBusinessStore((state) => state.plan)
  const maxServiceWindowsPerQueue = getPlanLimit(plan).maxServiceWindowsPerQueue
  const isOverPlanLimit = windows.length > maxServiceWindowsPerQueue

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

      {isOverPlanLimit && (
        <PlanLimitExceededNotice count={windows.length} label="ventanillas en esta cola" limit={maxServiceWindowsPerQueue} />
      )}

      {windowsQuery.isError && <FormError>No pudimos cargar las ventanillas.</FormError>}

      {windows.length === 0 && !windowsQuery.isLoading && (
        <p className="text-sm text-espera-text-muted">Todavía no cargaste ninguna ventanilla.</p>
      )}

      {windows.length > 0 && (
        <ul>
          {windows.map((window) => {
            const isToggling = toggleMutation.isPending && toggleMutation.variables === window.id
            const isDeleting = deleteMutation.isPending && deleteMutation.variables === window.id
            const isEditing = editingWindowId === window.id

            if (isEditing) {
              return (
                <li className="border-b border-espera-border py-3 last:border-b-0" key={window.id}>
                  <ServiceWindowEditForm
                    mutation={editMutation}
                    onCancel={() => setEditingWindowId(null)}
                    window={window}
                  />
                </li>
              )
            }

            return (
              <li className="border-b border-espera-border py-3 last:border-b-0" key={window.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-espera-text">{window.name}</p>
                    <p className="text-xs text-espera-text-muted">{typeLabels[window.type] ?? window.type}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      aria-label={`${window.isActive ? 'Desactivar' : 'Activar'} ${window.name}`}
                      className={
                        window.isActive
                          ? 'rounded-md bg-espera-purple-soft px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-espera-purple disabled:cursor-not-allowed disabled:opacity-60'
                          : 'rounded-md bg-espera-muted px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-espera-text-muted disabled:cursor-not-allowed disabled:opacity-60'
                      }
                      disabled={isToggling}
                      onClick={() =>
                        window.isActive
                          ? setWindowToDeactivate(window)
                          : toggleMutation.mutate(window.id)
                      }
                      type="button"
                    >
                      {window.isActive ? 'Activa' : 'Inactiva'}
                    </button>
                    <button
                      aria-label={`Editar ${window.name}`}
                      className="rounded-md px-2 py-1 text-xs font-semibold text-espera-purple transition-colors hover:bg-espera-purple-soft"
                      onClick={() => setEditingWindowId(window.id)}
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      aria-label={`Eliminar ${window.name}`}
                      className="rounded-md px-2 py-1 text-xs font-semibold text-espera-danger transition-colors hover:bg-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isDeleting}
                      onClick={() => setWindowToDelete(window)}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
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
        <FormError>{createMutation.error?.message ?? 'No pudimos crear la ventanilla.'}</FormError>
      )}
      {deleteMutation.isError && (
        <FormError>{deleteMutation.error?.message ?? 'No pudimos eliminar la ventanilla.'}</FormError>
      )}
      {toggleMutation.isError && (
        <FormError>{toggleMutation.error?.message ?? 'No pudimos actualizar la ventanilla.'}</FormError>
      )}

      <ConfirmDialog
        confirmLabel="Desactivar"
        description={
          windowToDeactivate?.currentTurn
            ? `${windowToDeactivate.name} está atendiendo el turno ${windowToDeactivate.currentTurn.displayNumber} ahora mismo. Va a dejar de recibir turnos nuevos.`
            : `${windowToDeactivate?.name ?? ''} va a dejar de recibir turnos nuevos.`
        }
        isConfirming={toggleMutation.isPending}
        onCancel={() => setWindowToDeactivate(null)}
        onConfirm={() => windowToDeactivate && toggleMutation.mutate(windowToDeactivate.id)}
        open={Boolean(windowToDeactivate)}
        title="¿Desactivar esta ventanilla?"
      />

      <ConfirmDialog
        confirmLabel="Eliminar"
        description={`${windowToDelete?.name ?? ''} se va a eliminar. Esta acción no se puede deshacer. Si está atendiendo a alguien ahora mismo, no se va a poder eliminar.`}
        isConfirming={deleteMutation.isPending}
        onCancel={() => setWindowToDelete(null)}
        onConfirm={() => windowToDelete && deleteMutation.mutate(windowToDelete.id)}
        open={Boolean(windowToDelete)}
        title="¿Eliminar esta ventanilla?"
      />
    </div>
  )
}

function ServiceWindowEditForm({ mutation, onCancel, window }) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({
    defaultValues: { name: window.name, type: window.type },
    resolver: zodResolver(serviceWindowSchema),
  })

  async function onSubmit(values) {
    try {
      await mutation.mutateAsync({ windowId: window.id, changes: values })
    } catch {
      // mutation.isError already drives the error message shown by the page.
    }
  }

  return (
    <form className="grid gap-3" noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormField error={errors.name?.message} label="Nombre" registration={register('name')} />
      <FormSelect defaultValue={window.type} error={errors.type?.message} label="Tipo" registration={register('type')}>
        <option value="cashier">Caja</option>
        <option value="customer_service">Atención al cliente</option>
        <option value="information">Información</option>
        <option value="admin">Administración</option>
        <option value="technical">Técnica</option>
      </FormSelect>
      {mutation.isError && (
        <FormError>{mutation.error?.message ?? 'No pudimos guardar los cambios.'}</FormError>
      )}
      <div className="flex gap-2">
        <FormButton isPending={mutation.isPending} pendingLabel="Guardando…" variant="solid">
          Guardar
        </FormButton>
        <FormButton onClick={onCancel} type="button" variant="outline">
          Cancelar
        </FormButton>
      </div>
    </form>
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
