import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession } from '../auth/session'
import { mockApi, renderPage } from '../test-utils'
import { UsersPage } from './UsersPage'

const options = { path: '/users', url: '/users', role: 'admin' as const }

const existingUsers = [
  { id: 1, email: 'admin@example.com', name: 'Admin', role: 'admin', createdAt: '2026-10-01T10:00:00Z' },
  { id: 2, email: 'olena@example.com', name: 'Olena Shevchenko', role: 'manager', createdAt: '2026-10-01T10:00:00Z' },
]

describe('UsersPage', () => {
  beforeEach(() => clearSession())
  afterEach(() => vi.unstubAllGlobals())

  it('lists the users with their roles', async () => {
    mockApi({ 'GET /api/users': existingUsers })

    renderPage(<UsersPage />, options)

    expect(await screen.findByText('Olena Shevchenko')).toBeTruthy()
    expect(screen.getByText('olena@example.com')).toBeTruthy()
    expect(screen.getAllByText('Manager').length).toBeGreaterThan(0)
  })

  it('sends the new user to the API', async () => {
    const fetchMock = mockApi({
      'GET /api/users': existingUsers,
      'POST /api/users': { id: 3, email: 'max@example.com', name: 'Max Bondar', role: 'manager' },
    })
    renderPage(<UsersPage />, options)
    await screen.findByText('Olena Shevchenko')

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Name'), 'Max Bondar')
    await user.type(screen.getByLabelText('Email'), 'max@example.com')
    await user.type(screen.getByLabelText('Password'), 'long-enough-pass')
    await user.click(screen.getByRole('button', { name: 'Add user' }))

    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({
      name: 'Max Bondar',
      email: 'max@example.com',
      password: 'long-enough-pass',
      role: 'manager',
    })
  })

  it('shows the API error when the email is already taken', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) =>
        init?.method === 'POST'
          ? new Response(JSON.stringify({ message: 'A user with this email already exists' }), { status: 409 })
          : new Response(JSON.stringify(existingUsers), { status: 200 }),
      ),
    )
    renderPage(<UsersPage />, options)
    await screen.findByText('Olena Shevchenko')

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Name'), 'Olena Again')
    await user.type(screen.getByLabelText('Email'), 'olena@example.com')
    await user.type(screen.getByLabelText('Password'), 'long-enough-pass')
    await user.click(screen.getByRole('button', { name: 'Add user' }))

    expect((await screen.findByRole('alert')).textContent).toBe('A user with this email already exists')
  })
})
