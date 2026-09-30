import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { useCurrentBusinessStore } from '../../../shared/business/currentBusinessStore.js'
import { OperationalStatusControl } from '../components/OperationalStatusControl.jsx'
import { QueuesControl } from '../components/QueuesControl.jsx'

export function BusinessOperationsPage() {
  const businessId = useCurrentBusinessStore((state) => state.businessId)
  const operationalStatus = useCurrentBusinessStore((state) => state.operationalStatus)

  if (!businessId) {
    return <p className="text-espera-text-muted">Cargando…</p>
  }

  return (
    <section>
      <PanelPageHeader
        crumb="Operación"
        description="Colas y estado operativo del negocio."
        title="Operación"
      />

      <div className="grid gap-6">
        <div className="max-w-2xl rounded-lg border border-espera-border bg-espera-surface">
          <div className="p-6">
            <OperationalStatusControl businessId={businessId} operationalStatus={operationalStatus} />
          </div>
        </div>

        <div className="max-w-2xl rounded-lg border border-espera-border bg-espera-surface">
          <div className="p-6">
            <QueuesControl businessId={businessId} />
          </div>
        </div>
      </div>
    </section>
  )
}
