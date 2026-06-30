import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthFormShell } from '../components/AuthFormShell.jsx'
import { ResendVerificationForm } from '../components/ResendVerificationForm.jsx'
import { authApi } from '../api/authApi.js'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const verifyQuery = useQuery({
    queryKey: ['verify-email', token],
    queryFn: () => authApi.verifyEmail(token),
    enabled: Boolean(token),
    retry: false,
  })

  if (!token) {
    return (
      <AuthFormShell title="Link inválido" description="Este enlace de verificación no es válido.">
        <ResendVerificationForm />
      </AuthFormShell>
    )
  }

  if (verifyQuery.isPending) {
    return <AuthFormShell title="Verificando tu email" description="Esperá un momento…" />
  }

  if (verifyQuery.isSuccess) {
    return (
      <AuthFormShell title="Email verificado" description="Ya podés iniciar sesión con tu cuenta.">
        <div className="button-row">
          <Link className="button" to="/login">
            Ir a iniciar sesión
          </Link>
        </div>
      </AuthFormShell>
    )
  }

  return (
    <AuthFormShell
      title="No pudimos verificar tu email"
      description="El enlace puede ser inválido o haber vencido. Pedí uno nuevo."
    >
      <ResendVerificationForm />
    </AuthFormShell>
  )
}
