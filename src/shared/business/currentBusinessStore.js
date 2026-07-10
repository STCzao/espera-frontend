import { create } from 'zustand'

export const useCurrentBusinessStore = create((set) => ({
  businessId: null,
  slug: null,
  name: null,
  status: null,
  listingStatus: null,
  operationalStatus: null,
  activeServiceWindows: null,
  setCurrentBusiness(business) {
    set({
      businessId: business?.id ?? null,
      slug: business?.slug ?? null,
      name: business?.name ?? null,
      status: business?.status ?? null,
      listingStatus: business?.listingStatus ?? null,
      operationalStatus: business?.operationalStatus ?? null,
      activeServiceWindows: business?.activeServiceWindows ?? null,
    })
  },
  clearCurrentBusiness() {
    set({
      businessId: null,
      slug: null,
      name: null,
      status: null,
      listingStatus: null,
      operationalStatus: null,
      activeServiceWindows: null,
    })
  },
}))
