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
import { businessOnboardingApi } from '../../business-onboarding/api/businessOnboardingApi.js'

const defaultValues = {
  email: '',
  password: '',
}

async function resolveOwnedBusinesses() {
  try {
    const { businesses } = await businessOnboardingApi.listMine()
    return businesses
  } catch {
    // Resolving owned businesses should never block the post-login redirect;
    // worst case the user lands on the empty /panel instead of their business panel.
    return []
  }
}

function resolvePostLoginPath(businesses) {
  // A user can own more than one business; selection between them is deferred,
  // so the first one found is used as the redirect target for now.
  return businesses[0]?.slug ? `/panel/business/${businesses[0].slug}` : '/panel'
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
      const [, businesses] = await Promise.all([
        queryClient.fetchQuery({ queryKey: sessionQueryKey, queryFn: fetchSessionUser }),
        resolveOwnedBusinesses(),
      ])

      navigate(location.state?.from?.pathname ?? resolvePostLoginPath(businesses), { replace: true })
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
