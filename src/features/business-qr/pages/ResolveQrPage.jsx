import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormError } from '../../../shared/ui/FormError.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'
import { businessQrApi } from '../api/businessQrApi.js'
import { guestTurnApi } from '../api/guestTurnApi.js'
import { GuestVisualScene } from '../components/GuestVisualScene.jsx'
import { guestTurnSchema } from '../model/guestTurnSchema.js'

const operationalStatusLabels = {
  normal: 'Normal',
  delayed: 'Con demoras',
  paused: 'Pausado',
  closed: 'Cerrado',
}

const cardClassName =
  'w-full max-w-[480px] rounded-lg border border-white/18 bg-espera-card p-7 text-espera-text shadow-[0_18px_60px_rgba(0,0,0,0.20)] sm:p-8'

export function ResolveQrPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()

  const resolveQuery = useQuery({
    queryKey: ['resolve-qr', token],
    queryFn: () => businessQrApi.resolveQr(token),
    retry: false,
  })

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({ defaultValues: { guestName: '' }, resolver: zodResolver(guestTurnSchema) })

  const createTurnMutation = useMutation({
    mutationFn: ({ guestName }) => guestTurnApi.createGuestTurn(resolveQuery.data.business.id, guestName),
    onSuccess: (data) => navigate(`/q/turn/${data.turnId}`, { replace: true }),
  })

  function onSubmit(values) {
    createTurnMutation.mutate(values)
  }

  if (resolveQuery.isLoading) {
    return (
      <GuestVisualScene description="Un momento." reduceMotion={shouldReduceMotion} title="Cargando…">
        <div className={cardClassName} />
      </GuestVisualScene>
    )
  }

  if (resolveQuery.isError) {
    return (
      <GuestVisualScene
        description="No pudimos abrir este QR."
        reduceMotion={shouldReduceMotion}
        title="Ups, algo falló."
      >
        <section className={cardClassName}>
          <p className="m-0 text-sm text-espera-danger">
            {resolveQuery.error?.message ?? 'El código puede ser inválido o haber vencido.'}
          </p>
        </section>
      </GuestVisualScene>
    )
  }

  const { business } = resolveQuery.data
  const canTakeTurn = business.operationalStatus === 'normal' || business.operationalStatus === 'delayed'

  return (
    <GuestVisualScene
      description="Escaneaste el QR — pedí tu lugar en la fila sin cuenta ni app, y mirá tu posición actualizarse sola."
      reduceMotion={shouldReduceMotion}
      title="Sacá turno, ya."
    >
      <motion.section
        animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
        className={cardClassName}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <h1 className="m-0 text-2xl font-black leading-tight tracking-tight text-espera-text">{business.name}</h1>
        <p className="mt-2 text-espera-text-muted">{business.address || 'Sacá tu turno sin necesidad de tener la app.'}</p>

        <p className="mt-3 flex items-center gap-2 text-sm text-espera-text-muted">
          <StatusDot operationalStatus={business.operationalStatus} reduceMotion={shouldReduceMotion} />
          Estado: {operationalStatusLabels[business.operationalStatus] ?? business.operationalStatus}
        </p>

        {!canTakeTurn && (
          <div className="business-alert business-alert--warning" role="status">
            <span className="business-alert__led" aria-hidden="true" />
            El negocio está {(operationalStatusLabels[business.operationalStatus] ?? business.operationalStatus).toLowerCase()}{' '}
            y no está aceptando turnos nuevos en este momento.
          </div>
        )}

        {canTakeTurn && (
          <form className="mt-5 grid gap-5" noValidate onSubmit={handleSubmit(onSubmit)}>
            <FormField
              autoComplete="name"
              error={errors.guestName?.message}
              label="Tu nombre"
              registration={register('guestName')}
            />

            {createTurnMutation.isError && (
              <FormError>{createTurnMutation.error?.message ?? 'No pudimos sacar tu turno. Intentá nuevamente.'}</FormError>
            )}

            <FormButton isPending={createTurnMutation.isPending} pendingLabel="Sacando turno…" size="lg" variant="solid">
              Sacar turno
            </FormButton>
          </form>
        )}
      </motion.section>
    </GuestVisualScene>
  )
}

function StatusDot({ operationalStatus, reduceMotion }) {
  const isLive = operationalStatus === 'normal' || operationalStatus === 'delayed'
  const colorClass = isLive ? 'bg-espera-success' : 'bg-espera-text-muted'

  if (!isLive || reduceMotion) {
    return <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${colorClass}`} />
  }

  return (
    <motion.span
      animate={{ opacity: [1, 0.35, 1] }}
      aria-hidden="true"
      className={`h-1.5 w-1.5 rounded-full ${colorClass}`}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}
