import { httpClient } from '../../../shared/api/httpClient.js'

export const businessProfileApi = {
  updateProfile(businessId, payload) {
    return httpClient.patch(`/business/${businessId}/profile`, payload)
  },
  categoryConfig(categoryId) {
    return httpClient.get(`/business/categories/${categoryId}/config`)
  },
}
