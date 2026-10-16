import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Avatar } from './Avatar'
import { ThemeToggle } from './ThemeToggle'

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
            {user?.role === 'admin' && <NavLink to="/users">Users</NavLink>}
          </nav>
          <div className="user-box">
            <ThemeToggle />
            {user && <Avatar name={user.name} />}
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
