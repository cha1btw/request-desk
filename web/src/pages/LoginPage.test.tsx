import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { clearSession, loadSession } from '../auth/session'
import { LoginPage } from './LoginPage'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/requests" element={<p>Requests page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

async function fillAndSubmit(password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), 'olena@example.com')
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('LoginPage', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    clearSession()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the error from the API when the password is wrong', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Invalid email or password' }, 401))
    renderLogin()

    await fillAndSubmit('wrong-password')

    expect((await screen.findByRole('alert')).textContent).toBe('Invalid email or password')
    expect(loadSession()).toBeNull()
  })

  it('saves the session and opens /requests after a successful login', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        accessToken: 'token-123',
        user: { id: 2, email: 'olena@example.com', name: 'Olena', role: 'manager' },
      }),
    )
    renderLogin()

    await fillAndSubmit('correct-password')

    expect(await screen.findByText('Requests page')).toBeTruthy()
    expect(loadSession()?.token).toBe('token-123')
  })

  it('shows a friendly message when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    renderLogin()

    await fillAndSubmit('whatever-pass')

    expect((await screen.findByRole('alert')).textContent).toContain('Cannot reach the server')
  })
})
