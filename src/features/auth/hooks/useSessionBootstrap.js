import { useQuery } from '@tanstack/react-query'
import { authApi } from '../api/authApi.js'

export function useSessionBootstrap() {
  return useQuery({
    queryKey: ['session'],
    queryFn: authApi.me,
    retry: false,
  })
}
