import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSessionBootstrap } from '../../features/auth/hooks/useSessionBootstrap.js'
import { useSessionStore } from '../../shared/auth/sessionStore.js'
import { LoadingScreen } from '../../shared/ui/LoadingScreen.jsx'

export function AuthLayout() {
  const location = useLocation()
  const status = useSessionStore((state) => state.status)
  const sessionQuery = useSessionBootstrap()

  if (status === 'unknown' || sessionQuery.isLoading) {
    return <LoadingScreen />
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
