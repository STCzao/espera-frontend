import { httpClient } from '../../../shared/api/httpClient.js'

export const backofficeApi = {
  listPendingOrganizations() {
    return httpClient.get('/organizations/pending')
  },
  approveOrganization(organizationId) {
    return httpClient.patch(`/organizations/${organizationId}/approve`)
  },
  rejectOrganization(organizationId, reason) {
    return httpClient.patch(`/organizations/${organizationId}/reject`, { reason })
  },
  listPendingBusinesses() {
    return httpClient.get('/business/pending')
  },
  getBusinessReview(businessId) {
    return httpClient.get(`/business/${businessId}/review`)
  },
  approveBusiness(businessId, note) {
    return httpClient.patch(`/business/${businessId}/approve`, note ? { note } : undefined)
  },
  rejectBusiness(businessId, reason) {
    return httpClient.patch(`/business/${businessId}/reject`, { reason })
  },
}
