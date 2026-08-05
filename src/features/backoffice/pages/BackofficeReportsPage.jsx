import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { ReportsList } from '../components/ReportsList.jsx'

export function BackofficeReportsPage() {
  return (
    <section>
      <PanelPageHeader
        crumb="Reportes"
        description="Revisá reportes de usuarios y negocios: resolvé, descartá o suspendé al reportado."
        title="Reportes"
      />
      <ReportsList />
    </section>
  )
}
