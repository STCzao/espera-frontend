import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthVisualScene } from '../../auth/components/AuthVisualScene.jsx'
import { PasswordField } from '../../auth/components/PasswordField.jsx'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormError } from '../../../shared/ui/FormError.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'
import { businessEmployeesApi } from '../api/businessEmployeesApi.js'
import { acceptEmployeeInvitationSchema } from '../model/businessEmployeesSchemas.js'

const defaultValues = { firstName: '', lastName: '', password: '', confirmPassword: '' }

export function AcceptEmployeeInvitationPage() {
  const shouldReduceMotion = useReducedMotion()
  const navigate = useNavigate()
  const { token } = useParams()

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({ defaultValues, resolver: zodResolver(acceptEmployeeInvitationSchema) })

  const acceptMutation = useMutation({
    mutationFn: (values) => businessEmployeesApi.acceptInvitation(token, values),
    onSuccess: () => navigate('/login', { replace: true }),
  })

  function onSubmit(values) {
    acceptMutation.mutate(values)
  }

  return (
    <AuthVisualScene
      description="Aceptá la invitación para operar el panel de este negocio con tu propio acceso."
      reduceMotion={shouldReduceMotion}
      title="Sumate al equipo."
    >
      <motion.section
        animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
        className="w-full max-w-[480px] rounded-lg border border-white/18 bg-espera-card p-7 text-espera-text shadow-[0_18px_60px_rgba(0,0,0,0.20)] sm:p-8"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="m-0 max-w-[11ch] text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] text-espera-text">
              Aceptar invitación
            </h1>
            <p className="mt-4 max-w-[340px] text-espera-text-muted">
              Creá tu acceso como empleado para este negocio.
            </p>
          </div>
          <img
            alt=""
            className="mt-1 h-14 w-14 shrink-0 rounded-xl border border-espera-border"
            src="/Logo_espera.png"
          />
        </div>

        <form className="mt-8 grid gap-5" noValidate onSubmit={handleSubmit(onSubmit)}>
          <FormField error={errors.firstName?.message} label="Nombre" registration={register('firstName')} />
          <FormField error={errors.lastName?.message} label="Apellido" registration={register('lastName')} />

          <PasswordField
            autoComplete="new-password"
            description="Al menos 8 caracteres, con una mayúscula, una minúscula y un número."
            error={errors.password?.message}
            label="Contraseña"
            registration={register('password')}
          />

          <PasswordField
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            label="Confirmar contraseña"
            registration={register('confirmPassword')}
            toggleLabelHidden="Mostrar confirmación de contraseña"
            toggleLabelVisible="Ocultar confirmación de contraseña"
          />

          {acceptMutation.isError && (
            <FormError>{acceptMutation.error?.message ?? 'La invitación puede ser inválida o haber vencido.'}</FormError>
          )}

          <FormButton isPending={acceptMutation.isPending} pendingLabel="Creando acceso…" variant="solid">
            Crear acceso
          </FormButton>
        </form>
      </motion.section>
    </AuthVisualScene>
  )
}
