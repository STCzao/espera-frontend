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
  // Every queue the business has, not just the one activeQueueId resolves
  // to — a Pro/Premium business can have more than one (see
  // ListMyBusinessesUseCase in espera-back). Empty by default so callers
  // can safely `.length`/`.map` without a null check.
  queues: [],
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
      queues: business?.queues ?? [],
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
      queues: [],
      plan: null,
    })
  },
}))
