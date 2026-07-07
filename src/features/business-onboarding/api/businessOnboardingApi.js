import { httpClient } from '../../../shared/api/httpClient.js'

export const businessOnboardingApi = {
  listMine() {
    return httpClient.get('/business/me')
  },
  listCategories() {
    return httpClient.get('/business/categories')
  },
  createBusiness(payload) {
    return httpClient.post('/business', payload)
  },
  approveBusiness(businessId) {
    return httpClient.patch(`/business/${businessId}/approve`)
  },
}
