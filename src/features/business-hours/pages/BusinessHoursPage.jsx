import { PlaceholderPage } from '../../../shared/ui/PlaceholderPage.jsx'

export function BusinessHoursPage() {
  return (
    <PlaceholderPage
      title="Horarios"
      description="Configuracion semanal y dias no laborables."
      items={['GET /api/business/:businessId/hours', 'PUT /api/business/:businessId/hours', 'Validar rangos sin solaparse']}
    />
  )
}
