import { PanelPageHeader } from '../../../shared/ui/PanelPageHeader.jsx'
import { UsersList } from '../components/UsersList.jsx'

export function BackofficeUsersPage() {
  return (
    <section>
      <PanelPageHeader
        crumb="Usuarios"
        description="Buscá usuarios, revisá su estado y bloqueá/desbloqueá accesos."
        title="Usuarios"
      />
      <UsersList />
    </section>
  )
}
