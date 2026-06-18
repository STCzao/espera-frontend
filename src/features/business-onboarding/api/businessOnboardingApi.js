import { httpClient } from '../../../shared/api/httpClient.js'

export const businessOnboardingApi = {
  registerBusiness(payload) {
    return httpClient.post('/auth/register-business', payload)
  },
  registerBusinessWithGoogle(payload) {
    return httpClient.post('/auth/register-business/google', payload)
  },
}
