import { httpClient } from '../../../shared/api/httpClient.js'

function toQueryString(params) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') {
      query.set(key, value)
    }
  }
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

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
  suspendBusiness(businessId, reason) {
    return httpClient.patch(`/business/${businessId}/suspend`, { reason })
  },
  reactivateBusiness(businessId) {
    return httpClient.patch(`/business/${businessId}/reactivate`)
  },
  getPlatformMetrics(params = {}) {
    return httpClient.get(`/business/platform/metrics${toQueryString(params)}`)
  },
  listBusinesses(params = {}) {
    return httpClient.get(`/business${toQueryString(params)}`)
  },
  getSubscription(organizationId) {
    return httpClient.get(`/organizations/${organizationId}/subscription`)
  },
  activateSubscription(organizationId) {
    return httpClient.patch(`/organizations/${organizationId}/subscription/activate`)
  },
  cancelSubscription(organizationId, reason) {
    return httpClient.patch(`/organizations/${organizationId}/subscription/cancel`, { reason })
  },
  changeSubscriptionPlan(organizationId, plan) {
    return httpClient.patch(`/organizations/${organizationId}/subscription/plan`, { plan })
  },
  listReports(params = {}) {
    return httpClient.get(`/reports${toQueryString(params)}`)
  },
  resolveReport(reportId, note) {
    return httpClient.patch(`/reports/${reportId}/resolve`, note ? { note } : undefined)
  },
  dismissReport(reportId, note) {
    return httpClient.patch(`/reports/${reportId}/dismiss`, { note })
  },
  suspendReport(reportId, note) {
    return httpClient.patch(`/reports/${reportId}/suspend`, note ? { note } : undefined)
  },
}
