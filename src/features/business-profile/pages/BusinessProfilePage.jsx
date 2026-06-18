import { PlaceholderPage } from '../../../shared/ui/PlaceholderPage.jsx'

export function BusinessProfilePage() {
  return (
    <PlaceholderPage
      title="Perfil del negocio"
      description="Edicion de nombre, categoria, direccion y atributos por categoria."
      items={['PATCH /api/business/:businessId/profile', 'GET /api/business/categories/:categoryId/config']}
    />
  )
}
