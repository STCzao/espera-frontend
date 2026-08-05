import { Link } from 'react-router-dom'
import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { PlatformStatsHeader } from '../components/PlatformStatsHeader.jsx'

export function BackofficeHomePage() {
  return (
    <section>
      <PanelPageHeader crumb="Inicio" description="Estado agregado de la plataforma." title="Backoffice" />

      <p className="mb-6 text-sm text-espera-text-muted">
        ¿Buscás organizaciones o negocios recién dados de alta? Andá a{' '}
        <Link className="font-semibold text-espera-purple hover:underline" to="approvals">
          Aprobaciones
        </Link>
        . ¿Necesitás suspender un negocio, reactivarlo o gestionar su suscripción? Andá a{' '}
        <Link className="font-semibold text-espera-purple hover:underline" to="businesses">
          Negocios
        </Link>
        .
      </p>

      <PlatformStatsHeader />
    </section>
  )
}
