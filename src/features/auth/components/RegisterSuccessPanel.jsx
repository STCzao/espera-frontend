import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export function RegisterSuccessPanel({ reduceMotion }) {
  const navigate = useNavigate()

  return (
    <motion.section
      animate={reduceMotion ? false : { opacity: 1, y: 0 }}
      className="relative w-full max-w-[560px] overflow-hidden rounded-lg border border-white/18 bg-espera-card p-8 text-espera-text shadow-[0_18px_60px_rgba(0,0,0,0.20)]"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[80px] bg-espera-purple-soft" />
      <div className="relative">
        <button
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-espera-text-muted transition-colors hover:text-espera-text"
          onClick={() => navigate(-1)}
          type="button"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Volver
        </button>
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-espera-purple text-white">
          <CheckCircle2 size={26} aria-hidden="true" />
        </div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-espera-text-muted">
          Cuenta creada
        </p>
        <h1 className="m-0 max-w-[10ch] text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-espera-text">
          Revisá tu email.
        </h1>
        <p className="mt-5 text-espera-text-muted">
          Te enviamos un enlace de verificación. Abrilo para activar tu cuenta antes de iniciar sesión.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-espera-purple px-4 font-semibold text-white" to="/login">
            Ir a iniciar sesión
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </motion.section>
  )
}
