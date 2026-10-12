import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { ProtectedRoute } from './ProtectedRoute'
import { clearSession, saveSession } from './session'

function renderAt(path: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/requests" element={<p>Secret requests</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => clearSession())

  it('redirects to /login when there is no token', () => {
    renderAt('/requests')

    expect(screen.getByText('Login page')).toBeTruthy()
    expect(screen.queryByText('Secret requests')).toBeNull()
  })

  it('shows the page when the user is logged in', () => {
    saveSession({ token: 'abc', user: { id: 1, email: 'a@b.c', name: 'Anna', role: 'manager' } })

    renderAt('/requests')

    expect(screen.getByText('Secret requests')).toBeTruthy()
  })
})
