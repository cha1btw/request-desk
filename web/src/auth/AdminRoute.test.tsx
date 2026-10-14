import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { AdminRoute } from './AdminRoute'
import { AuthProvider } from './AuthProvider'
import { clearSession, saveSession } from './session'

function renderAt(role: 'admin' | 'manager') {
  saveSession({ token: 'abc', user: { id: 1, email: 'a@b.c', name: 'Anna', role } })
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/users']}>
        <Routes>
          <Route path="/requests" element={<p>Requests page</p>} />
          <Route element={<AdminRoute />}>
            <Route path="/users" element={<p>Users page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('AdminRoute', () => {
  beforeEach(() => clearSession())

  it('shows the page to an admin', () => {
    renderAt('admin')
    expect(screen.getByText('Users page')).toBeTruthy()
  })

  it('sends a manager back to /requests', () => {
    renderAt('manager')
    expect(screen.getByText('Requests page')).toBeTruthy()
    expect(screen.queryByText('Users page')).toBeNull()
  })
})
