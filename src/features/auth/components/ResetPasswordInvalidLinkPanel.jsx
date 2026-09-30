import { motion } from 'framer-motion'
import { ArrowRight, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ResetPasswordInvalidLinkPanel({ reduceMotion }) {
  return (
    <motion.section
      animate={reduceMotion ? false : { opacity: 1, y: 0 }}
      className="relative w-full max-w-[560px] overflow-hidden rounded-lg border border-white/18 bg-espera-card p-8 text-espera-text shadow-[0_18px_60px_rgba(0,0,0,0.20)]"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[80px] bg-espera-purple-soft" />
      <div className="relative">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-espera-danger text-white">
          <TriangleAlert size={26} aria-hidden="true" />
        </div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-espera-text-muted">
          Enlace inválido
        </p>
        <h1 className="m-0 max-w-[12ch] text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-espera-text">
          Este link no sirve.
        </h1>
        <p className="mt-5 text-espera-text-muted">
          El enlace de recuperación no es válido. Pedí uno nuevo para poder continuar.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-espera-purple px-4 font-semibold text-white"
            to="/forgot-password"
          >
            Pedir un nuevo enlace
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </motion.section>
  )
}
