import { Navigate, Outlet } from 'react-router'
import { useAuth } from './useAuth'

// Pages only for admins. This hides them in the UI; the real protection is on
// the server, where the API answers 403 to anyone who is not an admin.
export function AdminRoute() {
  const { user } = useAuth()

  if (user?.role !== 'admin') return <Navigate to="/requests" replace />
  return <Outlet />
}
