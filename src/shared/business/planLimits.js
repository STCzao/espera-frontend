// Mirror of espera-back's PLAN_LIMITS (organization/domain/PlanLimits.ts).
// There's no endpoint that exposes this grid to the frontend, so it's
// duplicated here purely for UI hinting (e.g. warning when a business is
// already over its plan's limit) — the backend is still the only thing
// that actually enforces it on create. Keep these numbers in sync manually
// if the backend grid changes.
export const PLAN_LIMITS = {
  basic: { maxQueuesPerBusiness: 1, maxServiceWindowsPerQueue: 1 },
  pro: { maxQueuesPerBusiness: Infinity, maxServiceWindowsPerQueue: 3 },
  premium: { maxQueuesPerBusiness: Infinity, maxServiceWindowsPerQueue: 20 },
}

export function getPlanLimit(plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.basic
}
