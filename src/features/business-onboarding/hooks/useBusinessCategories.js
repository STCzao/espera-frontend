import { useQuery } from '@tanstack/react-query'
import { businessOnboardingApi } from '../api/businessOnboardingApi.js'

export function useBusinessCategories() {
  return useQuery({
    queryKey: ['business-categories'],
    queryFn: businessOnboardingApi.listCategories,
    select: (data) => data.categories,
  })
}
