import { create } from 'zustand'

export const useCurrentBusinessStore = create((set) => ({
  businessId: null,
  slug: null,
  name: null,
  status: null,
  listingStatus: null,
  operationalStatus: null,
  setCurrentBusiness(business) {
    set({
      businessId: business?.id ?? null,
      slug: business?.slug ?? null,
      name: business?.name ?? null,
      status: business?.status ?? null,
      listingStatus: business?.listingStatus ?? null,
      operationalStatus: business?.operationalStatus ?? null,
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
    })
  },
}))
