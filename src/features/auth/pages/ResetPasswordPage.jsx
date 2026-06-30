import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useReducedMotion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/authApi.js'
import { AuthVisualScene } from '../components/AuthVisualScene.jsx'
import { ResetPasswordFormPanel } from '../components/ResetPasswordFormPanel.jsx'
import { ResetPasswordInvalidLinkPanel } from '../components/ResetPasswordInvalidLinkPanel.jsx'
import { resetPasswordSchema } from '../model/authSchemas.js'

const defaultValues = { password: '', confirmPassword: '' }

export function ResetPasswordPage() {
  const shouldReduceMotion = useReducedMotion()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const form = useForm({ defaultValues, resolver: zodResolver(resetPasswordSchema) })

  const resetMutation = useMutation({
    mutationFn: (values) => authApi.resetPassword({ ...values, token }),
    onSuccess: () => navigate('/login', { replace: true }),
  })

  return (
    <AuthVisualScene
      description="Definí una contraseña nueva y volvé a tener el control de tu panel."
      reduceMotion={shouldReduceMotion}
      title="Tu acceso, de vuelta."
    >
      {token ? (
        <ResetPasswordFormPanel
          form={form}
          onSubmit={(values) => resetMutation.mutate(values)}
          reduceMotion={shouldReduceMotion}
          resetMutation={resetMutation}
        />
      ) : (
        <ResetPasswordInvalidLinkPanel reduceMotion={shouldReduceMotion} />
      )}
    </AuthVisualScene>
  )
}
