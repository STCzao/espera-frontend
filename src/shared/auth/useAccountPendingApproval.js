import { useSessionStore } from './sessionStore.js'

// Mirrors the backend's `authorize` gate: a business_admin whose *account*
// isn't approved yet gets 403 ACCOUNT_PENDING_APPROVAL on every business
// endpoint except POST /business, GET /business/me and GET /auth/me. That is
// a different check from useBusinessCanOperate (the business's own status):
// an approved owner opening a second, still-pending branch keeps access to
// its profile, hours and employees. Approving the owner's first business also
// approves the account, so this clears on the next /auth/me.
const UNAPPROVED_STATUSES = new Set(['pending', 'rejected'])

export function useAccountPendingApproval() {
  const user = useSessionStore((state) => state.user)
  return user?.role === 'business_admin' && UNAPPROVED_STATUSES.has(user.approvalStatus)
}
