import { create } from 'zustand'

export const useCurrentBusinessStore = create((set) => ({
  businessId: null,
  slug: null,
  name: null,
  status: null,
  listingStatus: null,
  operationalStatus: null,
  activeServiceWindows: null,
  activeQueueId: null,
  plan: null,
  setCurrentBusiness(business) {
    set({
      businessId: business?.id ?? null,
      slug: business?.slug ?? null,
      name: business?.name ?? null,
      status: business?.status ?? null,
      listingStatus: business?.listingStatus ?? null,
      operationalStatus: business?.operationalStatus ?? null,
      activeServiceWindows: business?.activeServiceWindows ?? null,
      activeQueueId: business?.activeQueueId ?? null,
      plan: business?.plan ?? null,
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
      activeQueueId: null,
      plan: null,
    })
  },
}))
