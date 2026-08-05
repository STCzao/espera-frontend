import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { SubscriptionsList } from '../components/SubscriptionsList.jsx'

export function BackofficeSubscriptionsPage() {
  return (
    <section>
      <PanelPageHeader
        crumb="Suscripciones"
        description="Activá, cancelá o cambiá el plan de la suscripción de una organización."
        title="Suscripciones"
      />
      <SubscriptionsList />
    </section>
  )
}
