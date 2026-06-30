import { httpClient } from '../../../shared/api/httpClient.js'

export const businessOnboardingApi = {
  listMine() {
    return httpClient.get('/business/me')
  },
  registerBusiness(payload) {
    return httpClient.post('/auth/register-business', payload)
  },
  registerBusinessWithGoogle(payload) {
    return httpClient.post('/auth/register-business/google', payload)
  },
  createBusiness(payload) {
    return httpClient.post('/business', payload)
  },
  approveBusiness(businessId) {
    return httpClient.patch(`/business/${businessId}/approve`)
  },
}
