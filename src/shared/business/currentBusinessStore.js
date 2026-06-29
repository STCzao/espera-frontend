import { create } from 'zustand'

export const useCurrentBusinessStore = create((set) => ({
  businessId: null,
  approvalStatus: null,
  listingStatus: null,
  operationalStatus: null,
  canEditBusiness: false,
  canManageEmployees: false,
  canOperateQueue: false,
  setCurrentBusiness(business) {
    set({
      businessId: business?.businessId ?? null,
      approvalStatus: business?.approvalStatus ?? null,
      listingStatus: business?.listingStatus ?? null,
      operationalStatus: business?.operationalStatus ?? null,
      canEditBusiness: Boolean(business?.canEditBusiness),
      canManageEmployees: Boolean(business?.canManageEmployees),
      canOperateQueue: Boolean(business?.canOperateQueue),
    })
  },
  clearCurrentBusiness() {
    set({
      businessId: null,
      approvalStatus: null,
      listingStatus: null,
      operationalStatus: null,
      canEditBusiness: false,
      canManageEmployees: false,
      canOperateQueue: false,
    })
  },
}))
