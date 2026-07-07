import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, CalendarClock, QrCode, Settings2, UsersRound } from 'lucide-react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { LogoutButton } from '../../features/auth/components/LogoutButton.jsx'
import { businessOnboardingApi } from '../../features/business-onboarding/api/businessOnboardingApi.js'
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
  const { businessSlug } = useParams()
  const setCurrentBusiness = useCurrentBusinessStore((state) => state.setCurrentBusiness)
  const clearCurrentBusiness = useCurrentBusinessStore((state) => state.clearCurrentBusiness)
  const currentSlug = useCurrentBusinessStore((state) => state.slug)
  const name = useCurrentBusinessStore((state) => state.name)
  const status = useCurrentBusinessStore((state) => state.status)
  const listingStatus = useCurrentBusinessStore((state) => state.listingStatus)

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
        <span className="brand-mark">
          <span className="brand-mark__icon">E</span>
          Espera
        </span>
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
              <NavLink key={item.to} to={item.to}>
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
        {businessSlug && <small>Negocio: {isCurrentBusiness && name ? name : '…'}</small>}
        <LogoutButton className="button secondary" />
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
        {approvalStatus === 'approved' && listingStatus && (
          <div className="business-context" role="status">
            Estado público: {businessStatusLabels[listingStatus]}
          </div>
        )}
        <Outlet />
      </section>
    </main>
  )
}
