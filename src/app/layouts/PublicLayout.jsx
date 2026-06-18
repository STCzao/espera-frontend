import { Clock3 } from 'lucide-react'
import { Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <main className="public-layout">
      <aside className="public-layout__aside">
        <span className="brand-mark">
          <span className="brand-mark__icon">
            <Clock3 size={20} aria-hidden="true" />
          </span>
          Espera
        </span>
        <div>
          <h1>Panel para negocios</h1>
          <p>Gestion inicial de cuenta, horarios, QR, empleados y operacion.</p>
        </div>
      </aside>
      <section className="public-layout__content">
        <Outlet />
      </section>
    </main>
  )
}
