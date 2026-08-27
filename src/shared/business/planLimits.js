// Mirror of espera-back's PLAN_LIMITS (organization/domain/PlanLimits.ts).
// There's no endpoint that exposes this grid to the frontend, so it's
// duplicated here purely for UI hinting (e.g. warning when a business is
// already over its plan's limit) — the backend is still the only thing
// that actually enforces it on create. Keep these numbers in sync manually
// if the backend grid changes.
//
// maxQueuesPerBusiness is 1 across every plan, on purpose (2026-08-20
// reformulation, see docs/epica-3-cola.md "Reformulación del pitch de
// planes" in espera-back): a second Queue only means something once a
// customer can be routed to it, and no entry point does that yet — the
// QR/web-ligera flow always resolves the single "active" queue. The
// one-queue-many-windows model already covers the real use case (several
// staff sharing one line). maxServiceWindowsPerQueue is the real lever:
// Basic 1, Pro 10, Premium 20. maxBusinesses: Premium is 3, not
// unlimited — no organization has been run at a bigger scale yet.
export const PLAN_LIMITS = {
  basic: { maxBusinesses: 1, maxQueuesPerBusiness: 1, maxServiceWindowsPerQueue: 1 },
  pro: { maxBusinesses: 1, maxQueuesPerBusiness: 1, maxServiceWindowsPerQueue: 10 },
  premium: { maxBusinesses: 3, maxQueuesPerBusiness: 1, maxServiceWindowsPerQueue: 20 },
}

export function getPlanLimit(plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.basic
}
