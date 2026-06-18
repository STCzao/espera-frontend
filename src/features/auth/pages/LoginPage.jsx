import { Link } from 'react-router-dom'
import { AuthFormShell } from '../components/AuthFormShell.jsx'

export function LoginPage() {
  return (
    <AuthFormShell title="Ingresar" description="Base lista para conectar login local y Google web.">
      <div className="button-row">
        <Link className="button" to="/panel/business/demo/profile">Entrar al panel demo</Link>
        <Link className="button secondary" to="/business/register">Registrar negocio</Link>
      </div>
    </AuthFormShell>
  )
}
