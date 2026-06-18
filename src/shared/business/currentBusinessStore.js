import { create } from 'zustand'

export const useCurrentBusinessStore = create((set) => ({
  businessId: null,
  canEditBusiness: false,
  canManageEmployees: false,
  canOperateQueue: false,
  setCurrentBusiness(business) {
    set({
      businessId: business?.businessId ?? null,
      canEditBusiness: Boolean(business?.canEditBusiness),
      canManageEmployees: Boolean(business?.canManageEmployees),
      canOperateQueue: Boolean(business?.canOperateQueue),
    })
  },
  clearCurrentBusiness() {
    set({
      businessId: null,
      canEditBusiness: false,
      canManageEmployees: false,
      canOperateQueue: false,
    })
  },
}))
