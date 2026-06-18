import { httpClient } from '../../../shared/api/httpClient.js'

export const businessOperationsApi = {
  updateServiceWindows(businessId, payload) {
    return httpClient.put(`/business/${businessId}/service-windows`, payload)
  },
  updateOperationalStatus(businessId, payload) {
    return httpClient.patch(`/business/${businessId}/operational-status`, payload)
  },
}
