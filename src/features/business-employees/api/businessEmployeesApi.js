import { httpClient } from '../../../shared/api/httpClient.js'

export const businessEmployeesApi = {
  invite(businessId, payload) {
    return httpClient.post(`/business/${businessId}/employees/invitations`, payload)
  },
  list(businessId) {
    return httpClient.get(`/business/${businessId}/employees`)
  },
  acceptInvitation(token, payload) {
    return httpClient.post(`/business/employee-invitations/${token}/accept`, payload)
  },
  revoke(businessId, userId) {
    return httpClient.delete(`/business/${businessId}/employees/${userId}`)
  },
}
