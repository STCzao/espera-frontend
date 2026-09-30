import { httpClient } from '../../../shared/api/httpClient.js'

export const businessHoursApi = {
  getHours(businessId) {
    return httpClient.get(`/business/${businessId}/hours`)
  },
  updateHours(businessId, payload) {
    return httpClient.put(`/business/${businessId}/hours`, payload)
  },
}
