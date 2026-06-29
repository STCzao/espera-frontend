import { useQuery } from '@tanstack/react-query'
import { useSessionStore } from '../../../shared/auth/sessionStore.js'
import { authApi } from '../api/authApi.js'

export function useSessionBootstrap() {
  const accessToken = useSessionStore((state) => state.accessToken)

  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const payload = await authApi.me()
      useSessionStore.getState().setUser(payload.user)
      return payload.user
    },
    enabled: Boolean(accessToken),
    retry: false,
  })
}
