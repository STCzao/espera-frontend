import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { LoadingScreen } from '../../../shared/ui/LoadingScreen.jsx'
import { businessOnboardingApi } from '../api/businessOnboardingApi.js'
import { NoBusinessPanel } from './NoBusinessPanel.jsx'

// Bare /panel (no :businessSlug) used to always render NoBusinessPanel,
// assuming zero businesses — true right after a first login, but wrong for
// an owner who already has one and lands here from somewhere else (e.g.
// "Volver al panel" on /business/new). Resolve it for real instead of
// guessing: same "first one found" rule as resolvePostLoginPath.js.
export function PanelIndexRedirect() {
  const businessesQuery = useQuery({
    queryKey: ['business-me'],
    queryFn: businessOnboardingApi.listMine,
    select: (data) => data.businesses,
  })

  if (businessesQuery.isLoading) {
    return <LoadingScreen />
  }

  const firstBusiness = businessesQuery.data?.[0]
  if (firstBusiness) {
    return <Navigate replace to={`/panel/business/${firstBusiness.slug}`} />
  }

  return <NoBusinessPanel />
}
