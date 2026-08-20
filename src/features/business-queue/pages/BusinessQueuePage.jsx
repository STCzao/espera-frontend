import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { PhoneCall, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog.jsx'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { LiveIndicator } from '../../../shared/ui/LiveIndicator.jsx'
import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { Skeleton } from '../../../shared/ui/Skeleton.jsx'
import { useCurrentBusinessStore } from '../../../shared/business/currentBusinessStore.js'
import { formatMinutes } from '../../../shared/format/duration.js'
import { useQueueRoom } from '../../../shared/queue/useQueueRoom.js'
import { businessQueueApi } from '../api/businessQueueApi.js'
import { ManualTurnForm } from '../components/ManualTurnForm.jsx'
import { QueueRecentCalls } from '../components/QueueRecentCalls.jsx'
import { QueueTurnList } from '../components/QueueTurnList.jsx'
import { ServiceWindowManager } from '../components/ServiceWindowManager.jsx'
import { ServiceWindowsSummary } from '../components/ServiceWindowsSummary.jsx'

const operationalStatusLabels = {
  normal: 'Normal',
  delayed: 'Con demoras',
  paused: 'Pausado',
  closed: 'Cerrado',
}

export function BusinessQueuePage() {
  const activeQueueId = useCurrentBusinessStore((state) => state.activeQueueId)
  const queryClient = useQueryClient()
  const shouldReduceMotion = useReducedMotion()
  const [activeTab, setActiveTab] = useState('live')
  const [turnToCancel, setTurnToCancel] = useState(null)
  const [turnToMarkNoShow, setTurnToMarkNoShow] = useState(null)

  const statusQuery = useQuery({
    queryKey: ['queue-status', activeQueueId],
    queryFn: () => businessQueueApi.getStatus(activeQueueId),
    enabled: Boolean(activeQueueId),
  })

  const listQuery = useQuery({
    queryKey: ['queue-list', activeQueueId],
    queryFn: () => businessQueueApi.getQueueList(activeQueueId),
    enabled: Boolean(activeQueueId),
    // Socket events refetch this on every turn change, but the per-turn
    // minute counters ("esperando hace X min", "llega en ~X min") drift
    // between events too — they're a function of the clock, not of queue
    // activity. Without this, the employee would have to do the math
    // themselves (was this "20 min" from a minute ago or from 20 minutes
    // ago?). A 30s refetch keeps the numbers themselves honest instead.
    refetchInterval: 30_000,
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
    mutationFn: (values) => businessQueueApi.createManualTurn(activeQueueId, values),
    onSuccess: invalidateQueue,
  })

  const cancelTurnMutation = useMutation({
    mutationFn: (turnId) => businessQueueApi.cancelTurn(activeQueueId, turnId),
    onSuccess: () => {
      invalidateQueue()
      setTurnToCancel(null)
    },
  })

  const attendTurnMutation = useMutation({
    mutationFn: ({ turnId, serviceWindowId }) => businessQueueApi.attendTurn(activeQueueId, turnId, serviceWindowId),
    onSuccess: invalidateQueue,
  })

  const redirectTurnMutation = useMutation({
    mutationFn: ({ turnId, targetServiceWindowId }) =>
      businessQueueApi.redirectTurn(activeQueueId, turnId, targetServiceWindowId),
    onSuccess: invalidateQueue,
  })

  const markNoShowMutation = useMutation({
    mutationFn: (turnId) => businessQueueApi.markNoShow(activeQueueId, turnId),
    onSuccess: () => {
      invalidateQueue()
      setTurnToMarkNoShow(null)
    },
  })

  const pendingTurnId =
    (cancelTurnMutation.isPending && cancelTurnMutation.variables) ||
    (attendTurnMutation.isPending && attendTurnMutation.variables?.turnId) ||
    (redirectTurnMutation.isPending && redirectTurnMutation.variables?.turnId) ||
    (markNoShowMutation.isPending && markNoShowMutation.variables) ||
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
  // Backend rejects "Llamar siguiente" with 409 TURN_STILL_CALLED while a
  // called turn hasn't been resolved — attended or marked absent. Disabling
  // it here instead of letting the employee hit that error is the same
  // pattern already used for the "last active queue" toggle.
  const hasUnresolvedCalledTurn = (data?.calledCount ?? 0) > 0

  return (
    <section>
      <PanelPageHeader crumb="Cola" description="Estado de la cola en tiempo real." title="Cola" />

      <div className="grid gap-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-start">
          {/* Tarjeta principal: tabs + estado en vivo / gestión de ventanillas */}
          <div className="rounded-lg border border-espera-border bg-espera-surface">
            <div className="flex gap-1 border-b border-espera-border px-5 pt-2">
              <TabButton active={activeTab === 'live'} onClick={() => setActiveTab('live')}>
                En vivo
              </TabButton>
              <TabButton active={activeTab === 'windows'} onClick={() => setActiveTab('windows')}>
                Ventanillas
              </TabButton>
              <Link className="px-1 pb-3 pt-2.5 text-sm font-semibold text-espera-text-muted hover:text-espera-text" to="history">
                Historial
              </Link>
            </div>

            {activeTab === 'live' && (
              <>
                {statusQuery.isLoading && <HeroSkeleton />}
                {statusQuery.isError && (
                  <p className="p-5 text-sm font-normal text-espera-danger" role="alert">
                    No pudimos cargar el estado de la cola.
                  </p>
                )}

                {data && (
                  <>
                    <div className="px-6 pb-1 pt-5">
                      <div className="flex items-center gap-2.5">
                        <p className="text-sm text-espera-text-muted">Personas esperando</p>
                        <LiveIndicator />
                      </div>
                      <p className="mt-1 flex items-baseline font-mono text-[42px] font-extrabold leading-none tracking-tight text-espera-text">
                        <AnimatePresence mode="wait">
                          <motion.span
                            animate={{ opacity: 1, y: 0 }}
                            initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
                            key={data.waitingCount}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                          >
                            {data.waitingCount}
                          </motion.span>
                        </AnimatePresence>
                        <span className="ml-2 text-lg font-bold text-espera-text-muted">turnos</span>
                      </p>
                      <p className="mt-2 text-sm text-espera-text-muted">
                        {data.estimatedTotalWaitMinutes != null ? (
                          <>
                            Tiempo estimado de espera:{' '}
                            <strong className="font-semibold text-espera-text">
                              {formatMinutes(data.estimatedTotalWaitMinutes)}
                            </strong>
                          </>
                        ) : (
                          'Sin atención disponible: no hay ventanillas activas.'
                        )}{' '}
                        · Estado: {operationalStatusLabels[data.operationalStatus] ?? data.operationalStatus}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <div className="w-full max-w-[200px]">
                          <FormButton
                            disabled={callNextMutation.isPending || hasUnresolvedCalledTurn || queueIsEmpty}
                            icon={PhoneCall}
                            isPending={callNextMutation.isPending}
                            onClick={() => callNextMutation.mutate()}
                            pendingLabel="Llamando…"
                            size="lg"
                            type="button"
                            variant="solid"
                          >
                            {hasUnresolvedCalledTurn
                              ? 'Resolvé el turno llamado'
                              : queueIsEmpty
                                ? 'Cola vacía'
                                : 'Llamar siguiente'}
                          </FormButton>
                        </div>
                        <div className="w-full max-w-[220px]">
                          <FormButton
                            icon={UserPlus}
                            onClick={() => document.querySelector('input[name="guestName"]')?.focus()}
                            type="button"
                            variant="secondary"
                          >
                            Agregar turno manual
                          </FormButton>
                        </div>
                      </div>

                      {callNextMutation.isError && (
                        <p className="mt-3 text-sm font-normal text-espera-danger" role="alert">
                          {callNextMutation.error?.message ?? 'No pudimos llamar al siguiente turno.'}
                        </p>
                      )}
                      {callNextMutation.isSuccess && (
                        <p className="mt-3 text-sm font-normal text-espera-text-muted" role="status">
                          Llamando al turno {callNextMutation.data.displayNumber}.
                        </p>
                      )}
                    </div>

                    <dl className="mt-5 grid grid-cols-2 divide-x divide-y divide-espera-border border-t border-espera-border sm:grid-cols-5 sm:divide-y-0">
                      <Stat label="En espera" value={data.waitingCount} />
                      <Stat label="Llamados" value={data.calledCount} />
                      <Stat label="Atendiendo" value={data.attendingCount} />
                      <Stat label="Derivados" value={data.redirectedCount ?? 0} />
                      <Stat label="Ventanillas" value={data.activeServiceWindows} />
                    </dl>
                  </>
                )}
              </>
            )}

            {activeTab === 'windows' && (
              <div className="p-5">
                <ServiceWindowManager queueId={activeQueueId} />
              </div>
            )}
          </div>

          {/* Ventanillas: qué está pasando ahora */}
          <div className="rounded-lg border border-espera-border bg-espera-surface">
            <ServiceWindowsSummary onManage={() => setActiveTab('windows')} queueId={activeQueueId} />
          </div>
        </div>

        {/* Turnos activos */}
        <div className="rounded-lg border border-espera-border bg-espera-surface">
          <div className="border-b border-espera-border p-4">
            <ManualTurnForm mutation={manualTurnMutation} />
            {manualTurnMutation.isError && (
              <p className="mt-2 text-sm font-normal text-espera-danger" role="alert">
                {manualTurnMutation.error?.message ?? 'No pudimos agregar el turno.'}
              </p>
            )}
          </div>

          {listQuery.isLoading && <TurnRowsSkeleton />}
          {listQuery.isError && (
            <p className="p-5 text-sm font-normal text-espera-danger" role="alert">
              No pudimos cargar la lista de turnos.
            </p>
          )}
          {listQuery.data && (
            <QueueTurnList
              items={listQuery.data.items}
              onAttend={(turnId, serviceWindowId) => attendTurnMutation.mutate({ turnId, serviceWindowId })}
              onCancel={(turnId, displayNumber) => setTurnToCancel({ turnId, displayNumber })}
              onMarkNoShow={(turnId, displayNumber) => setTurnToMarkNoShow({ turnId, displayNumber })}
              onRedirect={(turnId, targetServiceWindowId) => redirectTurnMutation.mutate({ turnId, targetServiceWindowId })}
              pendingTurnId={pendingTurnId}
              windows={windowsQuery.data?.windows ?? []}
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
          {redirectTurnMutation.isError && (
            <p className="border-t border-espera-border p-4 text-sm font-normal text-espera-danger" role="alert">
              {redirectTurnMutation.error?.message ?? 'No pudimos derivar el turno.'}
            </p>
          )}
          {markNoShowMutation.isError && (
            <p className="border-t border-espera-border p-4 text-sm font-normal text-espera-danger" role="alert">
              {markNoShowMutation.error?.message ?? 'No pudimos marcar el turno como ausente.'}
            </p>
          )}
        </div>

        {/* Últimos llamados */}
        <div className="rounded-lg border border-espera-border bg-espera-surface">
          <div className="border-b border-espera-border bg-espera-purple-soft/15 px-5 py-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-espera-text-muted">
              Últimos llamados
            </span>
          </div>
          {statusQuery.isLoading ? <RecentCallRowsSkeleton /> : <QueueRecentCalls calls={data?.recentCalls ?? []} />}
        </div>
      </div>

      <ConfirmDialog
        confirmLabel="Cancelar turno"
        description={
          turnToCancel
            ? `El turno ${turnToCancel.displayNumber} va a salir de la cola. Esta acción no se puede deshacer.`
            : ''
        }
        isConfirming={cancelTurnMutation.isPending}
        onCancel={() => setTurnToCancel(null)}
        onConfirm={() => turnToCancel && cancelTurnMutation.mutate(turnToCancel.turnId)}
        open={Boolean(turnToCancel)}
        title="¿Cancelar este turno?"
      />

      <ConfirmDialog
        confirmLabel="Marcar ausente"
        description={
          turnToMarkNoShow
            ? `El turno ${turnToMarkNoShow.displayNumber} queda registrado como que no se presentó cuando lo llamaron.`
            : ''
        }
        isConfirming={markNoShowMutation.isPending}
        onCancel={() => setTurnToMarkNoShow(null)}
        onConfirm={() => turnToMarkNoShow && markNoShowMutation.mutate(turnToMarkNoShow.turnId)}
        open={Boolean(turnToMarkNoShow)}
        title="¿Marcar este turno como ausente?"
      />
    </section>
  )
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      className={`px-1 pb-3 pt-2.5 text-sm font-semibold transition-colors ${
        active
          ? 'border-b-2 border-espera-purple text-espera-purple'
          : 'border-b-2 border-transparent text-espera-text-muted hover:text-espera-text'
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function HeroSkeleton() {
  return (
    <div className="px-6 pb-1 pt-5">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-10 w-28" />
      <Skeleton className="mt-3 h-4 w-64" />
      <div className="mt-4 flex flex-wrap gap-3">
        <Skeleton className="h-12 w-full max-w-[200px] !rounded-lg" />
        <Skeleton className="h-12 w-full max-w-[220px] !rounded-lg" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-espera-border pt-5 sm:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-6 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}

function TurnRowsSkeleton() {
  return (
    <ul>
      {[0, 1, 2].map((index) => (
        <li className="flex items-center gap-3.5 border-t border-espera-border px-5 py-3 first:border-t-0" key={index}>
          <Skeleton className="h-10 w-10 shrink-0 !rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-1.5 h-3 w-56" />
          </div>
          <Skeleton className="h-6 w-20 shrink-0 !rounded-md" />
        </li>
      ))}
    </ul>
  )
}

function RecentCallRowsSkeleton() {
  return (
    <ul>
      {[0, 1].map((index) => (
        <li className="flex items-center gap-3.5 border-b border-espera-border px-5 py-3 last:border-b-0" key={index}>
          <Skeleton className="h-9 w-9 shrink-0 !rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-3 w-14" />
        </li>
      ))}
    </ul>
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
