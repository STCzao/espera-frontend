import { PlaceholderPage } from '../../../shared/ui/PlaceholderPage.jsx'

export function BusinessQrPage() {
  return (
    <PlaceholderPage
      title="QR del negocio"
      description="Vista para descargar o regenerar el QR de entrada."
      items={['GET /api/business/:businessId/qr', 'POST /api/business/:businessId/qr/regenerate', 'GET /api/business/:businessId/qr.png']}
    />
  )
}
