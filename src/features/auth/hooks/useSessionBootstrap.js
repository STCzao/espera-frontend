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
  const accessToken = useSessionStore((state) => state.accessToken)

  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchSessionUser,
    enabled: Boolean(accessToken),
    retry: false,
  })
}
