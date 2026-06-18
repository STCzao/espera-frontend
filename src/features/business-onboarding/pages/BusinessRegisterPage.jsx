import { PlaceholderPage } from '../../../shared/ui/PlaceholderPage.jsx'

export function BusinessRegisterPage() {
  return (
    <PlaceholderPage
      title="Registro de negocio"
      description="Primer formulario prioritario del panel web."
      items={['POST /api/auth/register-business', 'approvalStatus: pending', 'Bloqueo hasta aprobacion']}
    />
  )
}
