import { useQuery } from '@tanstack/react-query'
import { businessProfileApi } from '../api/businessProfileApi.js'

export function useCategoryConfig(categoryId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['business-category-config', categoryId],
    queryFn: () => businessProfileApi.categoryConfig(categoryId),
    select: (data) => data.attributes,
    enabled: enabled && Boolean(categoryId),
  })
}
