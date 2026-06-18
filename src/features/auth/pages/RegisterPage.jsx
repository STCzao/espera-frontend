import { PlaceholderPage } from '../../../shared/ui/PlaceholderPage.jsx'

export function RegisterPage() {
  return (
    <PlaceholderPage
      title="Registro de usuario"
      description="Formulario publico para crear cuenta de consumidor."
      items={['POST /api/auth/register', 'Verificacion de email', 'Errores de validacion del backend']}
    />
  )
}
