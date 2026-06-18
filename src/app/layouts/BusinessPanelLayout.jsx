import { Building2, CalendarClock, QrCode, Settings2, UsersRound } from 'lucide-react'
import { NavLink, Outlet, useParams } from 'react-router-dom'

const navItems = [
  { to: 'profile', label: 'Perfil', icon: Building2 },
  { to: 'hours', label: 'Horarios', icon: CalendarClock },
  { to: 'operations', label: 'Operacion', icon: Settings2 },
  { to: 'qr', label: 'QR', icon: QrCode },
  { to: 'employees', label: 'Empleados', icon: UsersRound },
]

export function BusinessPanelLayout() {
  const { businessId } = useParams()

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
        <Outlet />
      </section>
    </main>
  )
}
