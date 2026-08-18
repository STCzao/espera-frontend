import { httpClient } from '../../../shared/api/httpClient.js'

export const guestTurnApi = {
  createGuestTurn(businessId, guestName) {
    return httpClient.post('/queue/guest-turns', { businessId, guestName })
  },
  getGuestTurnStatus(turnId) {
    return httpClient.get(`/queue/guest-turns/${turnId}`)
  },
}
