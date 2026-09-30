import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthVisualScene } from '../components/AuthVisualScene.jsx'
import { ResendVerificationForm } from '../components/ResendVerificationForm.jsx'
import { authApi } from '../api/authApi.js'

function VerifyEmailCard({ children, description, reduceMotion, title }) {
  return (
    <motion.section
      animate={reduceMotion ? false : { opacity: 1, y: 0 }}
      className="w-full max-w-[480px] rounded-lg border border-white/18 bg-espera-card p-7 text-espera-text shadow-[0_18px_60px_rgba(0,0,0,0.20)] sm:p-8"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="m-0 max-w-[13ch] text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] text-espera-text">
            {title}
          </h1>
          <p className="mt-4 max-w-[340px] text-espera-text-muted">{description}</p>
        </div>
        <img
          alt=""
          className="mt-1 h-14 w-14 shrink-0 rounded-xl border border-espera-border"
          src="/Logo_espera.png"
        />
      </div>

      {children}
    </motion.section>
  )
}

export function VerifyEmailPage() {
  const shouldReduceMotion = useReducedMotion()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const verifyQuery = useQuery({
    queryKey: ['verify-email', token],
    queryFn: () => authApi.verifyEmail(token),
    enabled: Boolean(token),
    retry: false,
  })

  let card

  if (!token) {
    card = (
      <VerifyEmailCard
        description="Este enlace de verificación no es válido."
        reduceMotion={shouldReduceMotion}
        title="Link inválido"
      >
        <ResendVerificationForm />
      </VerifyEmailCard>
    )
  } else if (verifyQuery.isPending) {
    card = (
      <VerifyEmailCard
        description="Esperá un momento…"
        reduceMotion={shouldReduceMotion}
        title="Verificando tu email"
      />
    )
  } else if (verifyQuery.isSuccess) {
    card = (
      <VerifyEmailCard
        description="Ya podés iniciar sesión con tu cuenta."
        reduceMotion={shouldReduceMotion}
        title="Email verificado"
      >
        <Link
          className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-espera-purple bg-espera-purple px-5 font-semibold text-white transition-all hover:bg-[#3d0074] focus:outline-none focus:ring-4 focus:ring-espera-purple-soft"
          to="/login"
        >
          Ir a iniciar sesión
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </VerifyEmailCard>
    )
  } else {
    card = (
      <VerifyEmailCard
        description="El enlace puede ser inválido o haber vencido. Pedí uno nuevo."
        reduceMotion={shouldReduceMotion}
        title="No pudimos verificar tu email"
      >
        <ResendVerificationForm />
      </VerifyEmailCard>
    )
  }

  return (
    <AuthVisualScene
      description="Un último paso antes de entrar al panel de tu negocio."
      reduceMotion={shouldReduceMotion}
      title="Casi listo."
    >
      {card}
    </AuthVisualScene>
  )
}
