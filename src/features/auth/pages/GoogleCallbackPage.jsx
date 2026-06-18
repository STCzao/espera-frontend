import { PlaceholderPage } from '../../../shared/ui/PlaceholderPage.jsx'

export function GoogleCallbackPage() {
  return (
    <PlaceholderPage
      title="Google callback"
      description="Pantalla tecnica para completar OAuth web del panel."
      items={['Lee state/codigo del proveedor', 'POST /api/auth/register-business/google', 'Manejo de pending review']}
    />
  )
}
