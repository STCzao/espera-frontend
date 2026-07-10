import { useCurrentBusinessStore } from '../business/currentBusinessStore.js'

export function PanelPageHeader({ crumb, description, title }) {
  const name = useCurrentBusinessStore((state) => state.name)

  return (
    <div className="mb-6">
      {name && (
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.03em] text-espera-text-muted">
          {name} / <span className="font-bold text-espera-purple">{crumb}</span>
        </p>
      )}
      <header className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
    </div>
  )
}
