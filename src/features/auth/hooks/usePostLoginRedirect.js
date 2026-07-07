import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchSessionUser, sessionQueryKey } from './useSessionBootstrap.js'
import { resolveOwnedBusinesses, resolvePostLoginPath } from '../model/resolvePostLoginPath.js'

export function usePostLoginRedirect() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  return async function redirectAfterLogin() {
    // Shares the AuthLayout session query key so /auth/me isn't fetched twice on redirect.
    const [, businesses] = await Promise.all([
      queryClient.fetchQuery({ queryKey: sessionQueryKey, queryFn: fetchSessionUser }),
      resolveOwnedBusinesses(),
    ])

    navigate(location.state?.from?.pathname ?? resolvePostLoginPath(businesses), { replace: true })
  }
}
