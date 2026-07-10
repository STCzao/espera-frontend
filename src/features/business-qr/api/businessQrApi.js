import { httpClient } from '../../../shared/api/httpClient.js'

export const businessQrApi = {
  getQr(businessId) {
    return httpClient.get(`/business/${businessId}/qr`)
  },
  regenerateQr(businessId) {
    return httpClient.post(`/business/${businessId}/qr/regenerate`)
  },
  getQrPng(businessId) {
    return httpClient.getBlob(`/business/${businessId}/qr.png`)
  },
  resolveQr(token) {
    return httpClient.get(`/qr/${token}`)
  },
}
