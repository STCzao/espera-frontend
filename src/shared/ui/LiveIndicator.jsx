import { motion, useReducedMotion } from 'framer-motion'

// Pulsing dot used wherever data on screen is actually kept in sync live
// (Socket.IO, polling) — never decorative. If the underlying data isn't
// live, don't reach for this just to look busy.
export function LiveIndicator({ label = 'En vivo' }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-espera-purple">
      {shouldReduceMotion ? (
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-espera-purple" />
      ) : (
        <motion.span
          animate={{ opacity: [1, 0.35, 1] }}
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-espera-purple"
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {label}
    </span>
  )
}
