import { useEffect, useState } from 'react'
import { Building2, CircleCheckBig, CreditCard, Flag, LayoutDashboard, Menu, X } from 'lucide-react'
import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { LogoutButton } from '../../features/auth/components/LogoutButton.jsx'
import { useSessionStore } from '../../shared/auth/sessionStore.js'

const navItems = [
  { to: '.', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: 'approvals', label: 'Aprobaciones', icon: CircleCheckBig },
  { to: 'businesses', label: 'Negocios', icon: Building2 },
  { to: 'subscriptions', label: 'Suscripciones', icon: CreditCard },
  { to: 'reports', label: 'Reportes', icon: Flag },
]

export function BackofficePanelLayout() {
  const role = useSessionStore((state) => state.user?.role)
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

  // Backoffice is super_admin-only — anyone else who lands here (stale
  // bookmark, manual URL) gets sent back to the business panel.
  if (role !== 'super_admin') {
    return <Navigate to="/panel" replace />
  }

  return (
    <main className="panel-layout">
      {isNavOpen && (
        <div aria-hidden="true" className="panel-layout__backdrop" onClick={() => setIsNavOpen(false)} />
      )}
      <aside className="panel-layout__sidebar" data-open={isNavOpen}>
        <div className="panel-layout__sidebar-head">
          <img alt="Espera" className="h-10 w-10 rounded-lg border border-espera-border" src="/Logo_espera.png" />
          <button
            aria-label="Cerrar menú"
            className="panel-layout__drawer-close"
            onClick={() => setIsNavOpen(false)}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <nav className="panel-layout__nav" aria-label="Backoffice">
          <div className="panel-layout__nav-section">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink end={item.end} key={item.to} onClick={() => setIsNavOpen(false)} to={item.to}>
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
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
          <span className="panel-layout__topbar-business">Backoffice Espera</span>
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
          <Outlet />
        </div>
      </section>
    </main>
  )
}
