import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { useCurrentBusinessStore } from '../../../shared/business/currentBusinessStore.js'
import { OperationalStatusControl } from '../components/OperationalStatusControl.jsx'
import { ServiceWindowsControl } from '../components/ServiceWindowsControl.jsx'

export function BusinessOperationsPage() {
  const businessId = useCurrentBusinessStore((state) => state.businessId)
  const activeServiceWindows = useCurrentBusinessStore((state) => state.activeServiceWindows)
  const operationalStatus = useCurrentBusinessStore((state) => state.operationalStatus)

  if (!businessId) {
    return <p className="text-espera-text-muted">Cargando…</p>
  }

  return (
    <section>
      <PanelPageHeader
        crumb="Operación"
        description="Ventanillas activas y estado operativo del negocio."
        title="Operación"
      />

      <div className="grid gap-6">
        <div className="max-w-2xl rounded border border-espera-border bg-white">
          <div className="p-6">
            <ServiceWindowsControl activeServiceWindows={activeServiceWindows} businessId={businessId} />
          </div>
        </div>

        <div className="max-w-2xl rounded border border-espera-border bg-white">
          <div className="p-6">
            <OperationalStatusControl businessId={businessId} operationalStatus={operationalStatus} />
          </div>
        </div>
      </div>
    </section>
  )
}
