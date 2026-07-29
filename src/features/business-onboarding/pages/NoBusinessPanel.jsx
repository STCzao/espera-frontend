import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NoBusinessPanel() {
  return (
    <div className="business-alert business-alert--warning" role="status">
      <strong>Todavía no registraste tu negocio.</strong>{' '}
      Registralo para empezar a configurarlo; quedará pendiente de revisión hasta que lo aprobemos.
      <div className="mt-4">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-espera-purple bg-espera-purple px-4 text-sm font-semibold !text-white transition-colors hover:bg-[#3d0074] focus:outline-none focus:ring-4 focus:ring-espera-purple-soft"
          to="/business/new"
        >
          Registrar tu negocio
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
