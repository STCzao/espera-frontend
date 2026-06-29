import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthFormShell } from '../components/AuthFormShell.jsx'
import { authApi } from '../api/authApi.js'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: () => navigate(location.state?.from?.pathname ?? '/business/register', { replace: true }),
  })

  function handleSubmit(event) {
    event.preventDefault()
    loginMutation.mutate({ email: email.trim().toLowerCase(), password })
  }

  return (
    <AuthFormShell title="Ingresar" description="Accedé para administrar tus negocios.">
      <form className="form-stack" onSubmit={handleSubmit}>
        <label>
          Email
          <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </label>
        <label>
          Contraseña
          <input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        </label>
        {loginMutation.isError && <p className="form-error" role="alert">{loginMutation.error.message}</p>}
        <button className="button" disabled={loginMutation.isPending} type="submit">
          {loginMutation.isPending ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
      <div className="button-row">
        <Link className="button secondary" to="/business/register">Registrar negocio</Link>
        <Link className="button secondary" to="/forgot-password">Olvidé mi contraseña</Link>
      </div>
    </AuthFormShell>
  )
}
