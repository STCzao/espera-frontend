import { businessOnboardingApi } from '../../business-onboarding/api/businessOnboardingApi.js'

export async function resolveOwnedBusinesses() {
  try {
    const { businesses } = await businessOnboardingApi.listMine()
    return businesses
  } catch {
    // Resolving owned businesses should never block the post-login redirect;
    // worst case the user lands on the empty /panel instead of their business panel.
    return []
  }
}

export function resolvePostLoginPath(businesses, user) {
  // super_admin accounts operate the Backoffice, never the business panel —
  // they're created via a one-off script (no business ownership involved).
  if (user?.role === 'super_admin') {
    return '/backoffice'
  }

  // A user can own more than one business; selection between them is deferred,
  // so the first one found is used as the redirect target for now.
  return businesses[0]?.slug ? `/panel/business/${businesses[0].slug}` : '/panel'
}
