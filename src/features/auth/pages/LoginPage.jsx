import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useReducedMotion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../api/authApi.js'
import { LoginFormPanel } from '../components/LoginFormPanel.jsx'
import { LoginVisualScene } from '../components/LoginVisualScene.jsx'
import { fetchSessionUser, sessionQueryKey } from '../hooks/useSessionBootstrap.js'
import { loginSchema } from '../model/authSchemas.js'

const defaultValues = {
  email: '',
  password: '',
}

function resolvePostLoginPath(user) {
  return user?.businessId ? `/panel/business/${user.businessId}` : '/business/register'
}

export function LoginPage() {
  const shouldReduceMotion = useReducedMotion()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const form = useForm({
    defaultValues,
    resolver: zodResolver(loginSchema),
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async () => {
      // Shares the AuthLayout session query key so /auth/me isn't fetched twice on redirect.
      const user = await queryClient.fetchQuery({
        queryKey: sessionQueryKey,
        queryFn: fetchSessionUser,
      })

      navigate(location.state?.from?.pathname ?? resolvePostLoginPath(user), { replace: true })
    },
  })

  function handleSubmit(values) {
    loginMutation.mutate(values)
  }

  return (
    <LoginVisualScene reduceMotion={shouldReduceMotion}>
      <LoginFormPanel
        form={form}
        loginMutation={loginMutation}
        onSubmit={handleSubmit}
        reduceMotion={shouldReduceMotion}
      />
    </LoginVisualScene>
  )
}
