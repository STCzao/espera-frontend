import { PlaceholderPage } from '../../../shared/ui/PlaceholderPage.jsx'

export function AcceptEmployeeInvitationPage() {
  return (
    <PlaceholderPage
      title="Aceptar invitacion"
      description="Alta publica de empleado por token, sin sesion previa."
      items={['POST /api/business/employee-invitations/:token/accept', 'Token publico', 'Invitacion vence a los 7 dias']}
    />
  )
}
