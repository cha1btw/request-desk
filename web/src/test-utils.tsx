import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { vi } from 'vitest'
import { AuthProvider } from './auth/AuthProvider'
import { saveSession } from './auth/session'

// Replaces fetch with a fake API. `routes` maps "METHOD /api/path" to the JSON to
// answer with (or a function that gets the request body and returns the JSON).
// A request that is not listed fails the test, so surprises do not go unnoticed.
export function mockApi(routes: Record<string, unknown | ((body: unknown) => unknown)>) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url}`
    if (!(key in routes)) throw new Error(`Unexpected request: ${key}`)
    const answer = routes[key]
    const body = typeof answer === 'function' ? answer(init?.body ? JSON.parse(String(init.body)) : undefined) : answer
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// Renders a page at `url`, logged in as a manager, inside the providers the real app has.
export function renderPage(element: ReactElement, { path, url }: { path: string; url: string }) {
  saveSession({ token: 'test-token', user: { id: 1, email: 'olena@example.com', name: 'Olena', role: 'manager' } })
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path={path} element={element} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

export const anna = { id: 1, name: 'Anna Petrenko', email: 'anna@example.com', phone: '+380 44 123 45 67', createdAt: '2026-10-01T10:00:00Z' }
export const olena = { id: 2, email: 'olena@example.com', name: 'Olena', role: 'manager' as const }

export function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 5,
    title: 'Fix the door',
    description: 'It does not close',
    status: 'new',
    clientId: anna.id,
    client: anna,
    createdAt: '2026-10-02T09:00:00Z',
    updatedAt: '2026-10-02T09:00:00Z',
    ...overrides,
  }
}
