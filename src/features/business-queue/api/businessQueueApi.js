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
}
