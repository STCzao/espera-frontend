import { httpClient } from '../../../shared/api/httpClient.js'

export const businessQueueApi = {
  getStatus(queueId) {
    return httpClient.get(`/queue/${queueId}/status`)
  },
  callNext(queueId) {
    return httpClient.post('/queue/turns/call-next', { queueId })
  },
  getQueueList(queueId) {
    return httpClient.get(`/queue/${queueId}/turns`)
  },
  createManualTurn(queueId, guestName) {
    return httpClient.post(`/queue/${queueId}/turns/manual`, { guestName })
  },
  cancelTurn(queueId, turnId) {
    return httpClient.post(`/queue/${queueId}/turns/${turnId}/cancel`)
  },
  attendTurn(queueId, turnId, serviceWindowId) {
    return httpClient.post(
      `/queue/${queueId}/turns/${turnId}/attend`,
      serviceWindowId ? { serviceWindowId } : undefined,
    )
  },
  listServiceWindows(queueId) {
    return httpClient.get(`/queue/${queueId}/windows`)
  },
  createServiceWindow(queueId, name, type) {
    return httpClient.post(`/queue/${queueId}/windows`, { name, type })
  },
  toggleServiceWindow(queueId, windowId) {
    return httpClient.patch(`/queue/${queueId}/windows/${windowId}/toggle`)
  },
}
