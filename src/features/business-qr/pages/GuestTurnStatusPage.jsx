import { useMutation, useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQueueRoom } from '../../../shared/queue/useQueueRoom.js'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog.jsx'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormError } from '../../../shared/ui/FormError.jsx'
import { LiveIndicator } from '../../../shared/ui/LiveIndicator.jsx'
import { guestTurnApi } from '../api/guestTurnApi.js'
import { GuestVisualScene } from '../components/GuestVisualScene.jsx'

// El visitante anónimo se suma a la sala de la cola por Socket.IO
// presentando su turnId (el backend valida que el turno sea de esa cola), y
// cada `queue:update` vuelve a pedir el estado. El polling queda como red de
// seguridad por si el socket no conecta (redes móviles, proxies). Ambos
// siguen mientras el turno esté activo, no solo en espera: antes el polling
// se cortaba en "called" y la página nunca se enteraba de que ya lo atendían.
const FALLBACK_POLL_INTERVAL_MS = 15000

const ACTIVE_STATUSES = new Set(['waiting', 'called', 'attending', 'redirected'])

const steps = ['En espera', 'Te llamamos', 'Atendido']

const cardClassName =
  'w-full max-w-[480px] rounded-lg border border-white/18 bg-espera-card p-7 text-espera-text shadow-[0_18px_60px_rgba(0,0,0,0.20)] sm:p-8'

function stepIndexFor(status) {
  if (status === 'waiting') return 0
  if (status === 'called' || status === 'attending' || status === 'redirected') return 1
  if (status === 'completed') return 2
  return -1
}

const sceneCopyByStatus = {
  loading: { title: 'Buscando tu turno…', description: 'Un momento.' },
  error: { title: 'Ups, algo falló.', description: 'No pudimos encontrar este turno.' },
  waiting: { title: 'Ya estás en la fila.', description: 'Seguí tu turno acá — se actualiza solo, no hace falta que recargues.' },
  yourTurn: { title: '¡Es tu turno!', description: 'Acercate al negocio ahora mismo.' },
  redirected: { title: 'Ya casi.', description: 'Te estamos derivando a otra ventanilla — esperá el llamado.' },
  completed: { title: 'Listo.', description: 'Tu turno ya fue atendido.' },
  cancelled: { title: 'Turno cancelado.', description: 'Este turno ya no está activo.' },
  no_show: { title: 'Te llamamos y no estabas.', description: 'Este turno ya no está activo.' },
}

export function GuestTurnStatusPage() {
  const { turnId } = useParams()
  const shouldReduceMotion = useReducedMotion()
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)

  const turnQuery = useQuery({
    queryKey: ['guest-turn-status', turnId],
    queryFn: () => guestTurnApi.getGuestTurnStatus(turnId),
    refetchInterval: (query) => (ACTIVE_STATUSES.has(query.state.data?.status) ? FALLBACK_POLL_INTERVAL_MS : false),
    retry: false,
  })

  const isActive = ACTIVE_STATUSES.has(turnQuery.data?.status)
  useQueueRoom(isActive ? turnQuery.data.queueId : null, () => turnQuery.refetch(), { turnId })

  const cancelMutation = useMutation({
    mutationFn: () => guestTurnApi.cancelGuestTurn(turnId),
    onSettled: () => {
      setIsConfirmingCancel(false)
      // Also on error: a 409 TURN_NOT_CANCELLABLE means the turn moved on
      // (they just got called) and the page should show that, not a stale "waiting".
      turnQuery.refetch()
    },
  })

  if (turnQuery.isLoading) {
    return (
      <GuestVisualScene {...sceneCopyByStatus.loading} reduceMotion={shouldReduceMotion}>
        <div className={cardClassName} />
      </GuestVisualScene>
    )
  }

  if (turnQuery.isError) {
    return (
      <GuestVisualScene {...sceneCopyByStatus.error} reduceMotion={shouldReduceMotion}>
        <section className={cardClassName}>
          <p className="m-0 text-sm text-espera-danger">{turnQuery.error?.message ?? 'El link puede ser inválido.'}</p>
        </section>
      </GuestVisualScene>
    )
  }

  const turn = turnQuery.data
  const isYourTurn = turn.status === 'called' || turn.status === 'attending'
  const stepIndex = stepIndexFor(turn.status)
  const sceneCopy =
    sceneCopyByStatus[isYourTurn ? 'yourTurn' : turn.status] ?? sceneCopyByStatus.waiting

  return (
    <GuestVisualScene {...sceneCopy} reduceMotion={shouldReduceMotion}>
      <motion.section
        animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
        className={cardClassName}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="m-0 font-mono text-sm uppercase tracking-wider text-espera-text-muted">Tu turno</p>
          {isActive && <LiveIndicator />}
        </div>

        <AnimatePresence mode="wait">
          <motion.h1
            animate={{ opacity: 1, scale: 1 }}
            className="m-0 font-mono text-5xl font-black tracking-tight text-espera-text"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
            key={turn.displayNumber}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {turn.displayNumber}
          </motion.h1>
        </AnimatePresence>

        {stepIndex >= 0 && <StepTracker activeIndex={stepIndex} reduceMotion={shouldReduceMotion} />}

        {isYourTurn && (
          <motion.div
            animate={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 1, scale: [1, 1.025, 1] }}
            className="mt-5 rounded-lg border border-espera-purple bg-espera-purple px-5 py-4 text-center text-white"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94 }}
            role="status"
            transition={
              shouldReduceMotion
                ? { duration: 0.25 }
                : { opacity: { duration: 0.25 }, scale: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } }
            }
          >
            <p className="m-0 text-xl font-extrabold uppercase tracking-wide">¡Es tu turno!</p>
            <p className="m-0 mt-1 text-sm text-white/85">Acercate al negocio ahora.</p>
          </motion.div>
        )}

        {turn.status === 'waiting' && (
          <div className="mt-5 grid gap-2">
            <p className="m-0 text-espera-text">
              Posición en la fila:{' '}
              <AnimatePresence mode="wait">
                <motion.strong
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-block font-semibold"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
                  key={turn.position}
                  transition={{ duration: 0.2 }}
                >
                  {turn.position}
                </motion.strong>
              </AnimatePresence>
            </p>
            {turn.estimatedWaitMinutes != null && (
              <p className="m-0 text-sm text-espera-text-muted">Tiempo estimado de espera: {turn.estimatedWaitMinutes} min.</p>
            )}
            <p className="m-0 mt-2 text-xs text-espera-text-muted">Esta página se actualiza sola — no hace falta que la recargues.</p>

            {cancelMutation.isError && <FormError>{cancelMutation.error?.message ?? 'No pudimos cancelar tu turno.'}</FormError>}

            <div className="mt-3">
              <FormButton onClick={() => setIsConfirmingCancel(true)} type="button" variant="outline">
                Salir de la fila
              </FormButton>
            </div>
          </div>
        )}

        {turn.status === 'redirected' && (
          <p className="mt-5 text-sm text-espera-text-muted">Te estamos derivando a otra ventanilla — esperá el llamado.</p>
        )}

        {turn.status === 'completed' && (
          <p className="mt-5 text-sm text-espera-text-muted">Tu turno ya fue atendido. ¡Gracias por tu visita!</p>
        )}

        {turn.status === 'cancelled' && <p className="mt-5 text-sm text-espera-text-muted">Este turno fue cancelado.</p>}

        {turn.status === 'no_show' && (
          <p className="mt-5 text-sm text-espera-text-muted">
            Te llamamos y no te encontramos. Si seguís cerca, podés pedir un turno nuevo escaneando el QR.
          </p>
        )}
      </motion.section>

      <ConfirmDialog
        cancelLabel="Seguir en la fila"
        confirmLabel="Salir de la fila"
        description={`Vas a perder tu lugar (${turn.displayNumber}). Si querés volver, vas a tener que pedir un turno nuevo.`}
        isConfirming={cancelMutation.isPending}
        onCancel={() => setIsConfirmingCancel(false)}
        onConfirm={() => cancelMutation.mutate()}
        open={isConfirmingCancel}
        title="¿Salir de la fila?"
      />
    </GuestVisualScene>
  )
}

function StepTracker({ activeIndex, reduceMotion }) {
  return (
    <div className="relative mt-6 grid grid-cols-3 gap-3">
      <div className="absolute left-[16.6%] right-[16.6%] top-[7px] h-px bg-espera-border" />
      <motion.div
        animate={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
        className="absolute left-[16.6%] top-[7px] h-px origin-left bg-espera-purple"
        style={{ maxWidth: '66.8%' }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />

      {steps.map((label, index) => {
        const isDone = index < activeIndex
        const isActive = index === activeIndex

        return (
          <div className="relative flex flex-col items-center gap-1.5 text-center" key={label}>
            <motion.span
              animate={
                isActive && !reduceMotion
                  ? { scale: [1, 1.25, 1], boxShadow: ['0 0 0 0 rgba(80,0,151,0.35)', '0 0 0 5px rgba(80,0,151,0)', '0 0 0 0 rgba(80,0,151,0)'] }
                  : { scale: 1 }
              }
              className={`h-3.5 w-3.5 rounded-full border-2 ${
                isDone || isActive ? 'border-espera-purple bg-espera-purple' : 'border-espera-border bg-espera-surface'
              }`}
              transition={isActive && !reduceMotion ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
            />
            <span className={`text-[11px] font-semibold ${isActive ? 'text-espera-purple' : 'text-espera-text-muted'}`}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
