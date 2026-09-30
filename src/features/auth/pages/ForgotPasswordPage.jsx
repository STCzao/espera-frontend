import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useReducedMotion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { authApi } from '../api/authApi.js'
import { ForgotPasswordFormPanel } from '../components/ForgotPasswordFormPanel.jsx'
import { ForgotPasswordSuccessPanel } from '../components/ForgotPasswordSuccessPanel.jsx'
import { AuthVisualScene } from '../components/AuthVisualScene.jsx'
import { forgotPasswordSchema } from '../model/authSchemas.js'

export function ForgotPasswordPage() {
  const shouldReduceMotion = useReducedMotion()
  const form = useForm({ defaultValues: { email: '' }, resolver: zodResolver(forgotPasswordSchema) })
  const forgotMutation = useMutation({ mutationFn: authApi.forgotPassword })

  return (
    <AuthVisualScene
      description="Pedí un enlace de recuperación y volvé a entrar a tu panel en minutos."
      reduceMotion={shouldReduceMotion}
      title="Volvé a entrar."
    >
      {forgotMutation.isSuccess ? (
        <ForgotPasswordSuccessPanel reduceMotion={shouldReduceMotion} />
      ) : (
        <ForgotPasswordFormPanel
          form={form}
          forgotMutation={forgotMutation}
          onSubmit={(values) => forgotMutation.mutate(values)}
          reduceMotion={shouldReduceMotion}
        />
      )}
    </AuthVisualScene>
  )
}
