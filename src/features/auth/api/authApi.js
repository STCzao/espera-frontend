import { httpClient } from '../../../shared/api/httpClient.js'
import { clearSession, persistSession } from '../../../shared/auth/session.js'

export const authApi = {
  async login(payload) {
    return persistSession(await httpClient.post('/auth/login', payload))
  },
  async register(payload) {
    return httpClient.post('/auth/register', payload)
  },
  async logout() {
    await httpClient.post('/auth/logout')
    clearSession()
  },
  me() {
    return httpClient.get('/auth/me')
  },
  verifyEmail(token) {
    return httpClient.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
  },
  resendVerification(payload) {
    return httpClient.post('/auth/resend-verification', payload)
  },
  forgotPassword(payload) {
    return httpClient.post('/auth/forgot-password', payload)
  },
  resetPassword(payload) {
    return httpClient.post('/auth/reset-password', payload)
  },
  googleUrl() {
    return httpClient.get('/auth/google/url')
  },
}
