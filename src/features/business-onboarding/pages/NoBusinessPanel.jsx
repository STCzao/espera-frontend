import { Link } from 'react-router-dom'

export function NoBusinessPanel() {
  return (
    <div className="business-alert business-alert--warning" role="status">
      <strong>Todavía no registraste tu negocio.</strong>{' '}
      Registralo para empezar a configurarlo; quedará pendiente de revisión hasta que lo aprobemos.
      <div className="button-row">
        <Link className="button" to="/business/new">Registrar tu negocio</Link>
      </div>
    </div>
  )
}
