import { Link } from 'react-router-dom'
import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'

export function BackofficeHomePage() {
  return (
    <section>
      <PanelPageHeader
        crumb="Inicio"
        description="Aprobaciones, negocios, métricas y reportes de la plataforma."
        title="Backoffice"
      />
      <p className="text-espera-text-muted">
        <Link className="font-semibold text-espera-purple hover:underline" to="approvals">
          Aprobaciones
        </Link>{' '}
        ya está disponible. El resto de las pantallas se van a ir agregando a medida que implementemos cada historia
        de la Épica 8.
      </p>
    </section>
  )
}
