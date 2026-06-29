import { PlaceholderPage } from '../../../shared/ui/PlaceholderPage.jsx'

export function BusinessPendingReviewPage() {
  return (
    <PlaceholderPage
      title="Revision pendiente"
      description="La revisión comercial corresponde a este negocio y no bloquea el acceso a tu cuenta."
      items={['Podés completar la configuración', 'El negocio todavía no está publicado', 'La revisión se informa por sucursal']}
    />
  )
}
