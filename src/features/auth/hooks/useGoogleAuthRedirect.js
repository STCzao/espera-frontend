import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/authApi.js'

export function useGoogleAuthRedirect() {
  const googleLoginMutation = useMutation({
    mutationFn: async () => {
      const { url } = await authApi.googleUrl()
      window.location.assign(url)
    },
  })

  return {
    googleLoginMutation,
    triggerGoogleLogin: () => googleLoginMutation.mutate(),
  }
}
