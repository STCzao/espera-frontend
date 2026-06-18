import { PlaceholderPage } from '../../../shared/ui/PlaceholderPage.jsx'

export function VerifyEmailPage() {
  return (
    <PlaceholderPage
      title="Verificar email"
      description="Confirma token de email y permite reenviar verificacion si aplica."
      items={['GET /api/auth/verify-email', 'POST /api/auth/resend-verification']}
    />
  )
}
