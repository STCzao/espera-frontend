import { PlaceholderPage } from '../../../shared/ui/PlaceholderPage.jsx'

export function BusinessOperationsPage() {
  return (
    <PlaceholderPage
      title="Operacion"
      description="Ventanillas activas y estado operativo del negocio."
      items={['PUT /api/business/:businessId/service-windows', 'PATCH /api/business/:businessId/operational-status']}
    />
  )
}
