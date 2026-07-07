import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthField } from './AuthField.jsx'
import { GoogleAuthButton } from './GoogleAuthButton.jsx'
import { PasswordField } from './PasswordField.jsx'

export function RegisterFormPanel({
  form,
  googleLoginMutation,
  onGoogleLogin,
  onSubmit,
  reduceMotion,
  registerMutation,
}) {
  const navigate = useNavigate()
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = form

  const isBusy = registerMutation.isPending

  return (
    <motion.section
      animate={reduceMotion ? false : { opacity: 1, y: 0 }}
      className="w-full max-w-[610px] rounded-lg border border-white/18 bg-[#fdf9ff] p-7 text-espera-text shadow-[0_18px_60px_rgba(0,0,0,0.20)] sm:p-8"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <button
        className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-espera-text-muted transition-colors hover:text-espera-text"
        onClick={() => navigate(-1)}
        type="button"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Volver
      </button>

      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="m-0 max-w-[13ch] text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] text-espera-text">
            Creá tu cuenta
          </h1>
          <p className="mt-4 max-w-[390px] text-espera-text-muted">
            Accedé al panel y configurá tu negocio cuando estés listo.
          </p>
        </div>
        <img
          alt=""
          className="mt-1 h-14 w-14 shrink-0 rounded-xl border border-espera-border"
          src="/Logo_espera.png"
        />
      </div>

      <form className="mt-8 grid gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            autoComplete="given-name"
            error={errors.firstName?.message}
            label="Nombre"
            registration={register('firstName')}
          />
          <AuthField
            autoComplete="family-name"
            error={errors.lastName?.message}
            label="Apellido"
            registration={register('lastName')}
          />
        </div>

        <AuthField
          autoComplete="email"
          error={errors.email?.message}
          label="Email"
          registration={register('email')}
          type="email"
        />

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

        {registerMutation.isError && (
          <FormError>
            {registerMutation.error?.message ?? 'No pudimos crear la cuenta. Intentá nuevamente.'}
          </FormError>
        )}

        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-espera-border bg-white px-4 font-semibold text-espera-purple transition-colors hover:bg-espera-purple-soft focus:outline-none focus:ring-4 focus:ring-espera-purple-soft disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isBusy}
          type="submit"
        >
          {registerMutation.isPending ? (
            <>
              <Loader2 className="animate-spin" size={18} aria-hidden="true" />
              Creando cuenta
            </>
          ) : (
            <>
              Crear cuenta
              <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </button>

        <GoogleAuthButton googleMutation={googleLoginMutation} onClick={onGoogleLogin} />

        <p className="text-center text-sm text-espera-text-muted">
          ¿Ya tenés cuenta?{' '}
          <Link className="font-semibold text-espera-purple underline-offset-4 hover:underline" to="/login">
            Iniciá sesión
          </Link>
        </p>
      </form>
    </motion.section>
  )
}

function FormError({ children }) {
  return (
    <div className="rounded-lg border border-[#f3b7ce] bg-[#fff3f7] px-4 py-3 text-sm text-espera-danger" role="alert">
      {children}
    </div>
  )
}
