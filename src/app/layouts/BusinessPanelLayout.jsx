import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Building2, CalendarClock, Home, ListOrdered, Menu, Plus, QrCode, Settings2, UsersRound, X } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { LogoutButton } from '../../features/auth/components/LogoutButton.jsx'
import { businessOnboardingApi } from '../../features/business-onboarding/api/businessOnboardingApi.js'
import { useCurrentBusinessStore } from '../../shared/business/currentBusinessStore.js'
import { getPlanLimit } from '../../shared/business/planLimits.js'
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
  const navigate = useNavigate()
  const setCurrentBusiness = useCurrentBusinessStore((state) => state.setCurrentBusiness)
  const clearCurrentBusiness = useCurrentBusinessStore((state) => state.clearCurrentBusiness)
  const currentSlug = useCurrentBusinessStore((state) => state.slug)
  const name = useCurrentBusinessStore((state) => state.name)
  const status = useCurrentBusinessStore((state) => state.status)
  // No mostramos email ni un rótulo genérico de rol como relleno — hasta que
  // el backend exponga el nombre real (GET /auth/me hoy solo devuelve lo que
  // trae el JWT: id/email/role/approvalStatus, sin firstName/lastName), el
  // chip de usuario simplemente no se muestra.
  const userFirstName = useSessionStore((state) => state.user?.firstName)
  const plan = useCurrentBusinessStore((state) => state.plan)
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
  // Only Premium allows more than one Business per Organization (Basic and
  // Pro both cap at 1 — see PLAN_LIMITS in espera-back) — this link is
  // invisible for the vast majority of accounts, same gating criterion as
  // the switcher itself and "Crear cola" in QueuesControl.
  const canAddBusiness =
    Boolean(businessesQuery.data) && businessesQuery.data.length < getPlanLimit(plan).maxBusinesses

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
        <LogoutButton className="panel-layout__logout inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-transparent px-4 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-4 focus:ring-white/15" />
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
          <div className="panel-layout__topbar-right">
            <img alt="Espera" className="h-8 w-8 rounded-lg border border-espera-border" src="/Logo_espera.png" />
            {userFirstName && (
              <span aria-hidden="true" className="panel-layout__user-avatar">
                {userFirstName.charAt(0)}
              </span>
            )}
          </div>
        </header>
        <header className="panel-layout__topbar">
          <div className="panel-layout__topbar-right">
            {businessSlug && businessesQuery.data && businessesQuery.data.length > 1 ? (
              <select
                aria-label="Cambiar de sucursal"
                className="panel-layout__topbar-business panel-layout__business-switcher"
                onChange={(event) => navigate(`/panel/business/${event.target.value}`)}
                value={businessSlug}
              >
                {businessesQuery.data.map((business) => (
                  <option key={business.slug} value={business.slug}>
                    {business.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="panel-layout__topbar-business">
                {businessSlug ? (isCurrentBusiness && name ? name : '…') : 'Espera'}
              </span>
            )}
            {canAddBusiness && (
              <Link aria-label="Agregar sucursal" className="panel-layout__add-business" title="Agregar sucursal" to="/business/new">
                <Plus aria-hidden="true" size={16} />
              </Link>
            )}
            {userFirstName && (
              <span className="panel-layout__user-chip">
                <span aria-hidden="true" className="panel-layout__user-avatar">
                  {userFirstName.charAt(0)}
                </span>
                {userFirstName}
              </span>
            )}
            <img alt="Espera" className="h-9 w-9 shrink-0 rounded-lg border border-espera-border" src="/Logo_espera.png" />
          </div>
        </header>
        <div className="panel-layout__content">
          {approvalStatus === 'pending' && (
            <div className="business-alert business-alert--warning" role="status">
              <span className="business-alert__led" aria-hidden="true" />
              <strong>Tu negocio está pendiente de revisión.</strong>{' '}
              Podés corregir el perfil mientras esperás, pero invitar empleados, el QR, horarios, ventanillas,
              estado operativo y crear colas quedan disponibles recién cuando se apruebe.
            </div>
          )}
          {approvalStatus === 'rejected' && (
            <div className="business-alert business-alert--danger" role="alert">
              <strong>Este negocio fue rechazado.</strong> Corregí los datos del perfil y volvé a solicitar la
              aprobación, o contactá a soporte.
            </div>
          )}
          {approvalStatus === 'suspended' && (
            <div className="business-alert business-alert--danger" role="alert">
              <strong>Este negocio está suspendido.</strong> No puede operar ni recibir turnos nuevos hasta que el
              equipo de Espera lo reactive.
            </div>
          )}
          <Outlet />
        </div>
      </section>
    </main>
  )
}
