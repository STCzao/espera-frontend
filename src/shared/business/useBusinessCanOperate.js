import { useCurrentBusinessStore } from './currentBusinessStore.js'

// Mirrors the backend's own gate (bugfix/business-status-guards): most
// panel actions now require `business.status === 'approved'` server-side.
// Checking it here too avoids firing a request that's guaranteed to fail,
// and lets the UI explain *why* instead of surfacing a raw 409.
export function useBusinessCanOperate() {
  const status = useCurrentBusinessStore((state) => state.status)
  return status === 'approved'
}
