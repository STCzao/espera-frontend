import { Building2, CalendarClock, QrCode, Settings2, UsersRound } from 'lucide-react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useCurrentBusinessStore } from '../../shared/business/currentBusinessStore.js'
import { businessStatusLabels } from '../../shared/business/businessStatuses.js'

const navItems = [
  { to: 'profile', label: 'Perfil', icon: Building2 },
  { to: 'hours', label: 'Horarios', icon: CalendarClock },
  { to: 'operations', label: 'Operacion', icon: Settings2 },
  { to: 'qr', label: 'QR', icon: QrCode },
  { to: 'employees', label: 'Empleados', icon: UsersRound },
]

export function BusinessPanelLayout() {
  const { businessId } = useParams()
  const currentBusiness = useCurrentBusinessStore()
  const isCurrentBusiness = currentBusiness.businessId === businessId
  const approvalStatus = isCurrentBusiness ? currentBusiness.approvalStatus : null

  return (
    <main className="panel-layout">
      <aside className="panel-layout__sidebar">
        <span className="brand-mark">
          <span className="brand-mark__icon">E</span>
          Espera
        </span>
        <nav className="panel-layout__nav" aria-label="Negocio">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink key={item.to} to={item.to}>
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
        <small>Negocio: {businessId}</small>
      </aside>
      <section className="panel-layout__main">
        {approvalStatus === 'pending' && (
          <div className="business-alert business-alert--warning" role="status">
            <strong>Tu negocio está pendiente de revisión.</strong>{' '}
            Podés completar su configuración, pero todavía no estará disponible públicamente.
          </div>
        )}
        {approvalStatus === 'rejected' && (
          <div className="business-alert business-alert--danger" role="alert">
            <strong>Este negocio fue rechazado.</strong> Revisá los datos cargados o contactá a soporte.
          </div>
        )}
        {approvalStatus === 'approved' && currentBusiness.listingStatus && (
          <div className="business-context" role="status">
            Estado público: {businessStatusLabels[currentBusiness.listingStatus]}
          </div>
        )}
        <Outlet />
      </section>
    </main>
  )
}
