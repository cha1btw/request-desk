import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'

// The frame around every logged-in page: top bar + the current page below it.
export function Layout() {
  const { user, logout } = useAuth()

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <NavLink to="/requests" className="brand">
            Request Desk
          </NavLink>
          <nav className="nav">
            <NavLink to="/requests">Requests</NavLink>
            <NavLink to="/clients">Clients</NavLink>
          </nav>
          <div className="user-box">
            <span>
              {user?.name} ({user?.role})
            </span>
            <button type="button" className="btn btn-secondary" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </>
  )
}
