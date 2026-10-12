import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './useAuth'

// Wraps the pages that need a login. Without a user it sends you to /login
// and remembers where you wanted to go.
export function ProtectedRoute() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}
