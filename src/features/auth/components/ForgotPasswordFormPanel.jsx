import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FormButton } from '../../../shared/ui/FormButton.jsx'
import { FormError } from '../../../shared/ui/FormError.jsx'
import { FormField } from '../../../shared/ui/FormField.jsx'

export function ForgotPasswordFormPanel({ form, forgotMutation, onSubmit, reduceMotion }) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = form

  const isBusy = forgotMutation.isPending

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
            Recuperar contraseña
          </h1>
          <p className="mt-4 max-w-[340px] text-espera-text-muted">
            Ingresá tu email y te mandamos un enlace para crear una nueva.
          </p>
        </div>
        <img
          alt=""
          className="mt-1 h-14 w-14 shrink-0 rounded-xl border border-espera-border"
          src="/Logo_espera.png"
        />
      </div>

      <form className="mt-8 grid gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          autoComplete="email"
          error={errors.email?.message}
          label="Email"
          registration={register('email')}
          type="email"
        />

        {forgotMutation.isError && (
          <FormError>No pudimos procesar la solicitud. Probá de nuevo en unos minutos.</FormError>
        )}

        <FormButton icon={ArrowRight} isPending={isBusy} pendingLabel="Enviando">
          Enviar enlace de recuperación
        </FormButton>

        <p className="text-center text-sm text-espera-text-muted">
          <Link className="font-semibold text-espera-purple underline-offset-4 hover:underline" to="/login">
            Volver a iniciar sesión
          </Link>
        </p>
      </form>
    </motion.section>
  )
}
