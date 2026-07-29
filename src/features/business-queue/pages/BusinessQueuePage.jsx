import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PhoneCall } from 'lucide-react'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { useCurrentBusinessStore } from '../../../shared/business/currentBusinessStore.js'
import { useQueueRoom } from '../../../shared/queue/useQueueRoom.js'
import { businessQueueApi } from '../api/businessQueueApi.js'
import { ManualTurnForm } from '../components/ManualTurnForm.jsx'
import { QueueRecentCalls } from '../components/QueueRecentCalls.jsx'
import { QueueTurnList } from '../components/QueueTurnList.jsx'
import { ServiceWindowManager } from '../components/ServiceWindowManager.jsx'

const operationalStatusLabels = {
  normal: 'Normal',
  delayed: 'Con demoras',
  paused: 'Pausado',
  closed: 'Cerrado',
}

export function BusinessQueuePage() {
  const activeQueueId = useCurrentBusinessStore((state) => state.activeQueueId)
  const queryClient = useQueryClient()

  const statusQuery = useQuery({
    queryKey: ['queue-status', activeQueueId],
    queryFn: () => businessQueueApi.getStatus(activeQueueId),
    enabled: Boolean(activeQueueId),
  })

  const listQuery = useQuery({
    queryKey: ['queue-list', activeQueueId],
    queryFn: () => businessQueueApi.getQueueList(activeQueueId),
    enabled: Boolean(activeQueueId),
  })

  const windowsQuery = useQuery({
    queryKey: ['queue-windows', activeQueueId],
    queryFn: () => businessQueueApi.listServiceWindows(activeQueueId),
    enabled: Boolean(activeQueueId),
  })

  function invalidateQueue() {
    queryClient.invalidateQueries({ queryKey: ['queue-status', activeQueueId] })
    queryClient.invalidateQueries({ queryKey: ['queue-list', activeQueueId] })
  }

  useQueueRoom(activeQueueId, invalidateQueue)

  const callNextMutation = useMutation({
    mutationFn: () => businessQueueApi.callNext(activeQueueId),
    onSuccess: invalidateQueue,
  })

  const manualTurnMutation = useMutation({
    mutationFn: (guestName) => businessQueueApi.createManualTurn(activeQueueId, guestName),
    onSuccess: invalidateQueue,
  })

  const cancelTurnMutation = useMutation({
    mutationFn: (turnId) => businessQueueApi.cancelTurn(activeQueueId, turnId),
    onSuccess: invalidateQueue,
  })

  const attendTurnMutation = useMutation({
    mutationFn: ({ turnId, serviceWindowId }) => businessQueueApi.attendTurn(activeQueueId, turnId, serviceWindowId),
    onSuccess: invalidateQueue,
  })

  const pendingTurnId =
    (cancelTurnMutation.isPending && cancelTurnMutation.variables) ||
    (attendTurnMutation.isPending && attendTurnMutation.variables?.turnId) ||
    null

  if (!activeQueueId) {
    return (
      <section>
        <PanelPageHeader crumb="Cola" description="Estado de la cola en tiempo real." title="Cola" />
        <p className="text-espera-text-muted">
          Todavía no tenés una cola activa. Se crea automáticamente cuando tu negocio es aprobado.
        </p>
      </section>
    )
  }

  const data = statusQuery.data
  const queueIsEmpty = data?.waitingCount === 0
  const windows = windowsQuery.data?.windows ?? []
  const activeWindows = windows.filter((window) => window.isActive)

  return (
    <section>
      <PanelPageHeader crumb="Cola" description="Estado de la cola en tiempo real." title="Cola" />

      <div className="grid gap-6">
        {/* Indicadores */}
        <div className="rounded border border-espera-border bg-white">
          {statusQuery.isLoading && <p className="p-5 text-espera-text-muted">Cargando…</p>}
          {statusQuery.isError && (
            <p className="p-5 text-sm font-normal text-espera-danger" role="alert">
              No pudimos cargar el estado de la cola.
            </p>
          )}

          {data && (
            <>
              <dl className="grid grid-cols-2 divide-x divide-y divide-espera-border sm:grid-cols-5 sm:divide-y-0">
                <Stat label="Estado" value={operationalStatusLabels[data.operationalStatus] ?? data.operationalStatus} />
                <Stat label="En espera" value={data.waitingCount} />
                <Stat label="Llamados" value={data.calledCount} />
                <Stat label="Atendiendo" value={data.attendingCount} />
                <Stat label="Ventanillas activas" value={`${activeWindows.length}/${windows.length}`} />
              </dl>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-espera-border bg-espera-purple-soft/15 px-5 py-3.5">
                <p className="text-sm text-espera-text-muted">
                  {data.estimatedTotalWaitMinutes != null ? (
                    <>
                      Tiempo estimado de espera total:{' '}
                      <strong className="font-semibold text-espera-text">{data.estimatedTotalWaitMinutes} min</strong>.
                    </>
                  ) : (
                    'Sin atención disponible: no hay ventanillas activas.'
                  )}
                </p>

                <div className="max-w-[220px]">
                  <FormButton
                    disabled={callNextMutation.isPending || queueIsEmpty}
                    icon={PhoneCall}
                    isPending={callNextMutation.isPending}
                    onClick={() => callNextMutation.mutate()}
                    pendingLabel="Llamando…"
                    type="button"
                    variant="solid"
                  >
                    {queueIsEmpty ? 'Cola vacía' : 'Siguiente'}
                  </FormButton>
                </div>
              </div>

              {callNextMutation.isError && (
                <p className="border-t border-espera-border px-5 py-3 text-sm font-normal text-espera-danger" role="alert">
                  {callNextMutation.error?.message ?? 'No pudimos llamar al siguiente turno.'}
                </p>
              )}
              {callNextMutation.isSuccess && (
                <p className="border-t border-espera-border px-5 py-3 text-sm font-normal text-espera-text-muted" role="status">
                  Llamando al turno {callNextMutation.data.displayNumber}.
                </p>
              )}
            </>
          )}
        </div>

        {/* Ventanillas: qué está pasando ahora */}
        <div className="rounded border border-espera-border bg-white">
          <div className="p-5">
            <ServiceWindowManager queueId={activeQueueId} />
          </div>
        </div>

        {/* Turnos + últimos llamados */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
          <div className="rounded border border-espera-border bg-white">
            <div className="border-b border-espera-border bg-espera-purple-soft/15 p-4">
              <ManualTurnForm mutation={manualTurnMutation} />
              {manualTurnMutation.isError && (
                <p className="mt-2 text-sm font-normal text-espera-danger" role="alert">
                  {manualTurnMutation.error?.message ?? 'No pudimos agregar el turno.'}
                </p>
              )}
            </div>

            {listQuery.isLoading && <p className="p-5 text-espera-text-muted">Cargando…</p>}
            {listQuery.isError && (
              <p className="p-5 text-sm font-normal text-espera-danger" role="alert">
                No pudimos cargar la lista de turnos.
              </p>
            )}
            {listQuery.data && (
              <QueueTurnList
                items={listQuery.data.items}
                onAttend={(turnId, serviceWindowId) => attendTurnMutation.mutate({ turnId, serviceWindowId })}
                onCancel={(turnId) => cancelTurnMutation.mutate(turnId)}
                pendingTurnId={pendingTurnId}
                windows={windows}
              />
            )}
            {cancelTurnMutation.isError && (
              <p className="border-t border-espera-border p-4 text-sm font-normal text-espera-danger" role="alert">
                {cancelTurnMutation.error?.message ?? 'No pudimos cancelar el turno.'}
              </p>
            )}
            {attendTurnMutation.isError && (
              <p className="border-t border-espera-border p-4 text-sm font-normal text-espera-danger" role="alert">
                {attendTurnMutation.error?.message ?? 'No pudimos actualizar el turno.'}
              </p>
            )}
          </div>

          <div className="rounded border border-espera-border bg-white">
            <div className="border-b border-espera-border bg-espera-purple-soft/15 px-5 py-3">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-espera-text-muted">
                Últimos llamados
              </span>
            </div>
            <QueueRecentCalls calls={data?.recentCalls ?? []} />
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value }) {
  return (
    <div className="p-4">
      <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-espera-text-muted">
        {label}
      </span>
      <span className="mt-1.5 block text-2xl font-semibold tabular-nums text-espera-text">{value}</span>
    </div>
  )
}
