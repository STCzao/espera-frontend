import { Building2, CalendarClock, ListOrdered, QrCode, Settings2, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCurrentBusinessStore } from '../../../shared/business/currentBusinessStore.js'

const shortcuts = [
  {
    to: 'queue',
    label: 'Cola',
    description: 'Mirá el estado en vivo y llamá al siguiente turno.',
    icon: ListOrdered,
  },
  {
    to: 'profile',
    label: 'Perfil',
    description: 'Nombre, categoría y dirección visibles para tus clientes.',
    icon: Building2,
  },
  {
    to: 'hours',
    label: 'Horarios',
    description: 'Definí cuándo atendés y tus días no laborables.',
    icon: CalendarClock,
  },
  {
    to: 'operations',
    label: 'Operación',
    description: 'Marcá demoras, pausas o cierre de atención en el momento.',
    icon: Settings2,
  },
  {
    to: 'qr',
    label: 'QR',
    description: 'Generá el código para que tus clientes entren a la cola.',
    icon: QrCode,
  },
  {
    to: 'employees',
    label: 'Empleados',
    description: 'Invitá a tu equipo a operar el panel con vos.',
    icon: UsersRound,
  },
]

const statusCopy = {
  pending: null, // ya cubierto por el banner de BusinessPanelLayout
  rejected: null, // ídem
  approved: 'Tu negocio está aprobado. Desde acá configurás todo lo que tus clientes van a ver y usar.',
}

export function BusinessHomePage() {
  const name = useCurrentBusinessStore((state) => state.name)
  const status = useCurrentBusinessStore((state) => state.status)

  return (
    <section>
      <header className="mb-2">
        <p className="mb-1 text-sm text-espera-text-muted">Hola,</p>
        <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.01em] text-espera-text">{name ?? '…'}</h1>
      </header>

      <p className="mb-6 max-w-[52ch] text-sm text-espera-text-muted">
        {statusCopy[status] ?? 'Este es el panel de tu negocio: configurá los datos, horarios y el acceso de tu equipo.'}
      </p>

      <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-espera-text-muted">
        Accesos rápidos
      </p>
      <div className="grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((item) => {
          const Icon = item.icon

          return (
            <Link
              className="flex items-start gap-3 rounded-2xl border border-espera-border bg-white p-4 shadow-[0_10px_24px_-18px_rgba(51,0,95,0.4)] transition-transform hover:-translate-y-0.5"
              key={item.to}
              to={item.to}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6a1ec2] to-[#33005f] text-white">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-espera-text">{item.label}</span>
                <span className="mt-0.5 block text-xs text-espera-text-muted">{item.description}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
