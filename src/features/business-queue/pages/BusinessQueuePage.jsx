import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PhoneCall } from 'lucide-react'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { useCurrentBusinessStore } from '../../../shared/business/currentBusinessStore.js'
import { useQueueRoom } from '../../../shared/queue/useQueueRoom.js'
import { businessQueueApi } from '../api/businessQueueApi.js'
import { QueueTurnList } from '../components/QueueTurnList.jsx'

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

  useQueueRoom(activeQueueId, () => {
    queryClient.invalidateQueries({ queryKey: ['queue-status', activeQueueId] })
    queryClient.invalidateQueries({ queryKey: ['queue-list', activeQueueId] })
  })

  const callNextMutation = useMutation({
    mutationFn: () => businessQueueApi.callNext(activeQueueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-status', activeQueueId] })
      queryClient.invalidateQueries({ queryKey: ['queue-list', activeQueueId] })
    },
  })

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

  return (
    <section>
      <PanelPageHeader crumb="Cola" description="Estado de la cola en tiempo real." title="Cola" />

      <div className="grid gap-6">
        <div className="relative max-w-2xl overflow-hidden rounded-lg border border-espera-border bg-white shadow-[0_18px_34px_-26px_rgba(51,0,95,0.45)]">
          <div className="h-[3px] bg-gradient-to-r from-[#6a1ec2] via-espera-purple to-transparent" />
          <div className="grid gap-6 p-6">
            {statusQuery.isLoading && <p className="text-espera-text-muted">Cargando…</p>}
            {statusQuery.isError && (
              <p className="text-sm font-normal text-espera-danger" role="alert">
                No pudimos cargar el estado de la cola.
              </p>
            )}

            {data && (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat label="Estado" value={operationalStatusLabels[data.operationalStatus] ?? data.operationalStatus} />
                  <Stat label="En espera" value={data.waitingCount} />
                  <Stat label="Llamados" value={data.calledCount} />
                  <Stat label="Ventanillas" value={data.activeServiceWindows} />
                </div>

                <p className="text-sm text-espera-text-muted">
                  {data.estimatedTotalWaitMinutes != null
                    ? `Tiempo estimado de espera total: ${data.estimatedTotalWaitMinutes} min.`
                    : 'Sin atención disponible: no hay ventanillas activas.'}
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

                {callNextMutation.isError && (
                  <p className="text-sm font-normal text-espera-danger" role="alert">
                    {callNextMutation.error?.message ?? 'No pudimos llamar al siguiente turno.'}
                  </p>
                )}
                {callNextMutation.isSuccess && (
                  <p className="text-sm font-normal text-espera-text-muted" role="status">
                    Llamando al turno {callNextMutation.data.displayNumber}.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="relative max-w-2xl overflow-hidden rounded-lg border border-espera-border bg-white shadow-[0_18px_34px_-26px_rgba(51,0,95,0.45)]">
          <div className="h-[3px] bg-gradient-to-r from-[#6a1ec2] via-espera-purple to-transparent" />
          <div className="grid gap-4 p-6">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-espera-text-muted">
              Turnos activos
            </span>

            {listQuery.isLoading && <p className="text-espera-text-muted">Cargando…</p>}
            {listQuery.isError && (
              <p className="text-sm font-normal text-espera-danger" role="alert">
                No pudimos cargar la lista de turnos.
              </p>
            )}
            {listQuery.data && <QueueTurnList items={listQuery.data.items} />}
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-espera-border bg-espera-purple-soft/30 p-3">
      <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-espera-text-muted">
        {label}
      </span>
      <span className="mt-1 block text-2xl font-extrabold text-espera-text">{value}</span>
    </div>
  )
}
