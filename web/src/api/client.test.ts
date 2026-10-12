import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveSession, clearSession } from '../auth/session'
import { api, ApiError, setUnauthorizedHandler } from './client'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('api client', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    clearSession()
  })

  afterEach(() => {
    setUnauthorizedHandler(null)
    vi.unstubAllGlobals()
  })

  it('sends the saved token in the Authorization header', async () => {
    saveSession({ token: 'abc', user: { id: 1, email: 'a@b.c', name: 'A', role: 'admin' } })
    fetchMock.mockResolvedValue(jsonResponse([]))

    await api.get('/requests')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/requests')
    expect(init.headers.Authorization).toBe('Bearer abc')
  })

  it('sends JSON bodies with a Content-Type header', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }))

    await api.post('/clients', { name: 'Anna' })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.body).toBe('{"name":"Anna"}')
  })

  it('joins validation messages into one ApiError message', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: ['name should not be empty', 'email must be an email'] }, 400))

    const error = await api.post('/clients', {}).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(400)
    expect((error as ApiError).message).toBe('name should not be empty, email must be an email')
  })

  it('calls the unauthorized handler on 401 when a token was sent', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    saveSession({ token: 'expired', user: { id: 1, email: 'a@b.c', name: 'A', role: 'admin' } })
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Unauthorized' }, 401))

    await expect(api.get('/requests')).rejects.toBeInstanceOf(ApiError)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not call the handler on a 401 from the login form (no token yet)', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Invalid email or password' }, 401))

    await expect(api.post('/auth/login', {})).rejects.toThrow('Invalid email or password')
    expect(handler).not.toHaveBeenCalled()
  })
})
