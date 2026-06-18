import { PlaceholderPage } from '../../../shared/ui/PlaceholderPage.jsx'

export function BusinessPendingReviewPage() {
  return (
    <PlaceholderPage
      title="Revision pendiente"
      description="Estado autenticado sin acceso operativo hasta aprobacion."
      items={['ACCOUNT_PENDING_REVIEW', 'Reenviar verificacion si falta email', 'Canal de soporte']}
    />
  )
}
