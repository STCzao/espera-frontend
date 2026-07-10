import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { useCurrentBusinessStore } from '../../../shared/business/currentBusinessStore.js'
import { ServiceWindowsControl } from '../components/ServiceWindowsControl.jsx'

export function BusinessOperationsPage() {
  const businessId = useCurrentBusinessStore((state) => state.businessId)
  const activeServiceWindows = useCurrentBusinessStore((state) => state.activeServiceWindows)

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

      <div className="relative max-w-2xl overflow-hidden rounded-lg border border-espera-border bg-white shadow-[0_18px_34px_-26px_rgba(51,0,95,0.45)]">
        <div className="h-[3px] bg-gradient-to-r from-[#6a1ec2] via-espera-purple to-transparent" />
        <div className="p-6">
          <ServiceWindowsControl activeServiceWindows={activeServiceWindows} businessId={businessId} />
        </div>
      </div>
    </section>
  )
}
