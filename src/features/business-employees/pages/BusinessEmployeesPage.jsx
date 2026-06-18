import { PlaceholderPage } from '../../../shared/ui/PlaceholderPage.jsx'

export function BusinessEmployeesPage() {
  return (
    <PlaceholderPage
      title="Empleados"
      description="Invitaciones, listado y revocacion de empleados."
      items={['POST /api/business/:businessId/employees/invitations', 'GET /api/business/:businessId/employees', 'DELETE /api/business/:businessId/employees/:userId']}
    />
  )
}
