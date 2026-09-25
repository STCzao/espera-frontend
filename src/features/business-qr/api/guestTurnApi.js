import { httpClient } from '../../../shared/api/httpClient.js'

export const guestTurnApi = {
  createGuestTurn(businessId, guestName) {
    return httpClient.post('/queue/guest-turns', { businessId, guestName })
  },
  getGuestTurnStatus(turnId) {
    return httpClient.get(`/queue/guest-turns/${turnId}`)
  },
  // Public: the turnId is the access key, same as the status polling. Only
  // succeeds while the turn is still `waiting` (409 TURN_NOT_CANCELLABLE otherwise).
  cancelGuestTurn(turnId) {
    return httpClient.post(`/queue/guest-turns/${turnId}/cancel`)
  },
}
