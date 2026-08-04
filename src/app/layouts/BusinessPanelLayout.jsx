import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Building2, CalendarClock, Home, ListOrdered, Menu, QrCode, Settings2, UsersRound, X } from 'lucide-react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { LogoutButton } from '../../features/auth/components/LogoutButton.jsx'
import { businessOnboardingApi } from '../../features/business-onboarding/api/businessOnboardingApi.js'
import { useCurrentBusinessStore } from '../../shared/business/currentBusinessStore.js'
import { useSessionStore } from '../../shared/auth/sessionStore.js'

const primaryNavItems = [
  { to: '.', label: 'Inicio', icon: Home, end: true },
  { to: 'queue', label: 'Cola', icon: ListOrdered, end: true },
  { to: 'queue/history', label: 'Historial', icon: BarChart3 },
]

const configNavItems = [
  { to: 'profile', label: 'Perfil', icon: Building2 },
  { to: 'hours', label: 'Horarios', icon: CalendarClock },
  { to: 'operations', label: 'Operacion', icon: Settings2 },
  { to: 'qr', label: 'QR', icon: QrCode },
  { to: 'employees', label: 'Empleados', icon: UsersRound },
]

function renderNavItem(item, businessSlug, onNavigate) {
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
    <NavLink end={item.end} key={item.to} onClick={onNavigate} to={item.to}>
      <Icon size={18} aria-hidden="true" />
      <span>{item.label}</span>
    </NavLink>
  )
}

export function BusinessPanelLayout() {
  const { businessSlug } = useParams()
  const setCurrentBusiness = useCurrentBusinessStore((state) => state.setCurrentBusiness)
  const clearCurrentBusiness = useCurrentBusinessStore((state) => state.clearCurrentBusiness)
  const currentSlug = useCurrentBusinessStore((state) => state.slug)
  const name = useCurrentBusinessStore((state) => state.name)
  const status = useCurrentBusinessStore((state) => state.status)
  const userEmail = useSessionStore((state) => state.user?.email)
  const [isNavOpen, setIsNavOpen] = useState(false)

  useEffect(() => {
    if (!isNavOpen) {
      return undefined
    }

    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsNavOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isNavOpen])

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
      {isNavOpen && (
        <div
          aria-hidden="true"
          className="panel-layout__backdrop"
          onClick={() => setIsNavOpen(false)}
        />
      )}
      <aside className="panel-layout__sidebar" data-open={isNavOpen}>
        <div className="panel-layout__sidebar-head">
          <img
            alt="Espera"
            className="h-10 w-10 rounded-lg border border-espera-border"
            src="/Logo_espera.png"
          />
          <button
            aria-label="Cerrar menú"
            className="panel-layout__drawer-close"
            onClick={() => setIsNavOpen(false)}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <nav className="panel-layout__nav" aria-label="Negocio">
          <div className="panel-layout__nav-section">
            {primaryNavItems.map((item) => renderNavItem(item, businessSlug, () => setIsNavOpen(false)))}
          </div>
          <div className="panel-layout__nav-section">
            <p className="panel-layout__nav-group-label">Configuración</p>
            {configNavItems.map((item) => renderNavItem(item, businessSlug, () => setIsNavOpen(false)))}
          </div>
        </nav>
        <LogoutButton className="panel-layout__logout inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-espera-border bg-white px-4 text-sm font-semibold text-espera-text transition-colors hover:bg-espera-purple-soft focus:outline-none focus:ring-4 focus:ring-espera-purple-soft" />
      </aside>
      <section className="panel-layout__main">
        <header className="panel-layout__mobile-topbar">
          <button
            aria-expanded={isNavOpen}
            aria-label="Abrir menú"
            className="panel-layout__menu-btn"
            onClick={() => setIsNavOpen(true)}
            type="button"
          >
            <Menu aria-hidden="true" size={20} />
          </button>
          {userEmail && (
            <span aria-hidden="true" className="panel-layout__user-avatar">
              {userEmail.charAt(0).toUpperCase()}
            </span>
          )}
        </header>
        <header className="panel-layout__topbar">
          <span className="panel-layout__topbar-business">
            {businessSlug ? (isCurrentBusiness && name ? name : '…') : 'Espera'}
          </span>
          {userEmail && (
            <span className="panel-layout__user-chip">
              <span aria-hidden="true" className="panel-layout__user-avatar">
                {userEmail.charAt(0).toUpperCase()}
              </span>
              {userEmail}
            </span>
          )}
        </header>
        <div className="panel-layout__content">
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
        </div>
      </section>
    </main>
  )
}
