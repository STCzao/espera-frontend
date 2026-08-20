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
  createManualTurn(queueId, values) {
    return httpClient.post(`/queue/${queueId}/turns/manual`, values)
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
  editServiceWindow(queueId, windowId, changes) {
    return httpClient.patch(`/queue/${queueId}/windows/${windowId}`, changes)
  },
  deleteServiceWindow(queueId, windowId) {
    return httpClient.delete(`/queue/${queueId}/windows/${windowId}`)
  },
  redirectTurn(queueId, turnId, targetServiceWindowId) {
    return httpClient.post(`/queue/${queueId}/turns/${turnId}/redirect`, { targetServiceWindowId })
  },
  markNoShow(queueId, turnId) {
    return httpClient.post(`/queue/${queueId}/turns/${turnId}/no-show`)
  },
  getTurnHistory(queueId, date) {
    return httpClient.get(`/queue/${queueId}/turns/history${date ? `?date=${date}` : ''}`)
  },
  getMetrics(queueId, date) {
    return httpClient.get(`/queue/${queueId}/metrics${date ? `?date=${date}` : ''}`)
  },
}
