import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NoBusinessPanel() {
  return (
    <div className="business-alert business-alert--warning" role="status">
      <strong>Todavía no registraste tu negocio.</strong>{' '}
      Registralo para empezar a configurarlo; quedará pendiente de revisión hasta que lo aprobemos.
      <div className="mt-4">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#33005f] bg-gradient-to-br from-[#6a1ec2] to-[#33005f] px-4 text-sm font-semibold !text-white shadow-[0_8px_18px_-10px_rgba(80,0,151,0.6)] transition-all hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-espera-purple-soft"
          to="/business/new"
        >
          Registrar tu negocio
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
