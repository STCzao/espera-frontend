import { PlaceholderPage } from '../../../shared/ui/PlaceholderPage.jsx'

export function ResolveQrPage() {
  return (
    <PlaceholderPage
      title="Entrada por QR"
      description="Landing publica que resuelve negocio y prepara el flujo de turno."
      items={['GET /api/qr/:token', 'Mostrar estado operativo', 'CTA informativo hasta cola persistida']}
    />
  )
}
