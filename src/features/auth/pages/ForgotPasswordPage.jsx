import { PlaceholderPage } from '../../../shared/ui/PlaceholderPage.jsx'

export function ForgotPasswordPage() {
  return (
    <PlaceholderPage
      title="Recuperar password"
      description="Solicitud de reset con respuesta generica para no filtrar cuentas."
      items={['POST /api/auth/forgot-password', 'Estado enviado', 'Rate limit visible']}
    />
  )
}
