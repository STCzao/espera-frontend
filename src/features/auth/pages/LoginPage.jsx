import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useReducedMotion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { authApi } from '../api/authApi.js'
import { useGoogleAuthRedirect } from '../hooks/useGoogleAuthRedirect.js'
import { usePostLoginRedirect } from '../hooks/usePostLoginRedirect.js'
import { LoginFormPanel } from '../components/LoginFormPanel.jsx'
import { LoginVisualScene } from '../components/LoginVisualScene.jsx'
import { loginSchema } from '../model/authSchemas.js'

const defaultValues = {
  email: '',
  password: '',
}

export function LoginPage() {
  const shouldReduceMotion = useReducedMotion()
  const redirectAfterLogin = usePostLoginRedirect()
  const { googleLoginMutation, triggerGoogleLogin } = useGoogleAuthRedirect()

  const form = useForm({
    defaultValues,
    resolver: zodResolver(loginSchema),
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: redirectAfterLogin,
  })

  function handleSubmit(values) {
    loginMutation.mutate(values)
  }

  return (
    <LoginVisualScene reduceMotion={shouldReduceMotion}>
      <LoginFormPanel
        form={form}
        googleLoginMutation={googleLoginMutation}
        loginMutation={loginMutation}
        onGoogleLogin={triggerGoogleLogin}
        onSubmit={handleSubmit}
        reduceMotion={shouldReduceMotion}
      />
    </LoginVisualScene>
  )
}
