import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormError } from '../../../shared/ui/FormError.jsx'
import { PasswordField } from './PasswordField.jsx'

export function ResetPasswordFormPanel({ form, onSubmit, reduceMotion, resetMutation }) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = form

  const isBusy = resetMutation.isPending

  return (
    <motion.section
      animate={reduceMotion ? false : { opacity: 1, y: 0 }}
      className="w-full max-w-[480px] rounded-lg border border-white/18 bg-espera-card p-7 text-espera-text shadow-[0_18px_60px_rgba(0,0,0,0.20)] sm:p-8"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="m-0 max-w-[11ch] text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] text-espera-text">
            Nueva contraseña
          </h1>
          <p className="mt-4 max-w-[340px] text-espera-text-muted">
            Elegí una contraseña nueva para tu cuenta.
          </p>
        </div>
        <img
          alt=""
          className="mt-1 h-14 w-14 shrink-0 rounded-xl border border-espera-border"
          src="/Logo_espera.png"
        />
      </div>

      <form className="mt-8 grid gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <PasswordField
          autoComplete="new-password"
          description="Al menos 8 caracteres, con una mayúscula, una minúscula y un número."
          error={errors.password?.message}
          label="Contraseña nueva"
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

        {resetMutation.isError && (
          <FormError>
            El enlace puede ser inválido o haber vencido.{' '}
            <Link className="underline" to="/forgot-password">
              Pedí uno nuevo
            </Link>
            .
          </FormError>
        )}

        <FormButton icon={ArrowRight} isPending={isBusy} pendingLabel="Guardando">
          Guardar contraseña
        </FormButton>
      </form>
    </motion.section>
  )
}
