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
        Todavía no hay pantallas cargadas acá — se van a ir agregando a medida que implementemos cada historia de la
        Épica 8.
      </p>
    </section>
  )
}
