import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Building2, CalendarClock, Home, ListOrdered, QrCode, Settings2, UsersRound } from 'lucide-react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { LogoutButton } from '../../features/auth/components/LogoutButton.jsx'
import { businessOnboardingApi } from '../../features/business-onboarding/api/businessOnboardingApi.js'
import { useCurrentBusinessStore } from '../../shared/business/currentBusinessStore.js'

const navItems = [
  { to: '.', label: 'Inicio', icon: Home, end: true },
  { to: 'queue', label: 'Cola', icon: ListOrdered, end: true },
  { to: 'queue/history', label: 'Historial', icon: BarChart3 },
  { to: 'profile', label: 'Perfil', icon: Building2 },
  { to: 'hours', label: 'Horarios', icon: CalendarClock },
  { to: 'operations', label: 'Operacion', icon: Settings2 },
  { to: 'qr', label: 'QR', icon: QrCode },
  { to: 'employees', label: 'Empleados', icon: UsersRound },
]

export function BusinessPanelLayout() {
  const { businessSlug } = useParams()
  const setCurrentBusiness = useCurrentBusinessStore((state) => state.setCurrentBusiness)
  const clearCurrentBusiness = useCurrentBusinessStore((state) => state.clearCurrentBusiness)
  const currentSlug = useCurrentBusinessStore((state) => state.slug)
  const name = useCurrentBusinessStore((state) => state.name)
  const status = useCurrentBusinessStore((state) => state.status)

  const businessesQuery = useQuery({
    queryKey: ['business-me'],
    queryFn: businessOnboardingApi.listMine,
    select: (data) => data.businesses,
    enabled: Boolean(businessSlug),
  })

  useEffect(() => {
    if (!businessSlug) {
      clearCurrentBusiness()
      return
    }

    const match = businessesQuery.data?.find((business) => business.slug === businessSlug)
    if (match) {
      setCurrentBusiness(match)
    }
  }, [businessSlug, businessesQuery.data, setCurrentBusiness, clearCurrentBusiness])

  const isCurrentBusiness = Boolean(businessSlug) && currentSlug === businessSlug
  const approvalStatus = isCurrentBusiness ? status : null

  return (
    <main className="panel-layout">
      <aside className="panel-layout__sidebar">
        <img
          alt="Espera"
          className="h-10 w-10 rounded-lg border border-espera-border shadow-[0_6px_16px_-6px_rgba(80,0,151,0.55)]"
          src="/Logo_espera.png"
        />
        <nav className="panel-layout__nav" aria-label="Negocio">
          {navItems.map((item) => {
            const Icon = item.icon

            if (!businessSlug) {
              return (
                <span key={item.to} className="panel-layout__nav-item--disabled" aria-disabled="true">
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
              )
            }

            return (
              <NavLink end={item.end} key={item.to} to={item.to}>
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
        {businessSlug && (
          <small className="panel-layout__business-name">Negocio: {isCurrentBusiness && name ? name : '…'}</small>
        )}
        <LogoutButton className="panel-layout__logout inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-espera-border bg-white px-4 text-sm font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft focus:outline-none focus:ring-4 focus:ring-espera-purple-soft" />
      </aside>
      <section className="panel-layout__main">
        {approvalStatus === 'pending' && (
          <div className="business-alert business-alert--warning" role="status">
            <span className="business-alert__led" aria-hidden="true" />
            <strong>Tu negocio está pendiente de revisión.</strong>{' '}
            Podés completar su configuración, pero todavía no estará disponible públicamente.
          </div>
        )}
        {approvalStatus === 'rejected' && (
          <div className="business-alert business-alert--danger" role="alert">
            <strong>Este negocio fue rechazado.</strong> Revisá los datos cargados o contactá a soporte.
          </div>
        )}
        <Outlet />
      </section>
    </main>
  )
}
