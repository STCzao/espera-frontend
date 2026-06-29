import { useQuery } from '@tanstack/react-query'
import { useSessionStore } from '../../../shared/auth/sessionStore.js'
import { authApi } from '../api/authApi.js'

export const sessionQueryKey = ['session']

export async function fetchSessionUser() {
  const payload = await authApi.me()
  useSessionStore.getState().setUser(payload.user)
  return payload.user
}

export function useSessionBootstrap() {
  // Always enabled: even with no cached accessToken, httpClient retries a 401
  // through POST /auth/refresh-token (httpOnly cookie), so this is what
  // restores a session after a hard reload that lost the in-memory/local token.
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchSessionUser,
    retry: false,
  })
}
