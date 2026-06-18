import { PlaceholderPage } from '../../../shared/ui/PlaceholderPage.jsx'

export function ResetPasswordPage() {
  return (
    <PlaceholderPage
      title="Nuevo password"
      description="Pantalla consumida desde /reset-password?token=:token."
      items={['Lee token de query string', 'POST /api/auth/reset-password', 'Redireccion a login']}
    />
  )
}
