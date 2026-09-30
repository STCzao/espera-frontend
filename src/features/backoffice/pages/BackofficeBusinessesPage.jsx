import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { BusinessMetricsTable } from '../components/BusinessMetricsTable.jsx'

export function BackofficeBusinessesPage() {
  return (
    <section>
      <PanelPageHeader
        crumb="Negocios"
        description="Filtrá, suspendé/reactivá negocios y gestioná la suscripción de su organización."
        title="Negocios"
      />
      <BusinessMetricsTable />
    </section>
  )
}
