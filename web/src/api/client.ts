import { loadSession } from '../auth/session'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Set by AuthProvider: what to do when the server says our token is no good.
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

// Nest answers errors as { message: string | string[] }.
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] }
    if (Array.isArray(body.message)) return body.message.join(', ')
    if (body.message) return body.message
  } catch {
    // not JSON, fall through
  }
  return `Request failed (${response.status})`
}

function buildHeaders(hasBody: boolean): Record<string, string> {
  const headers: Record<string, string> = {}
  if (hasBody) headers['Content-Type'] = 'application/json'
  const token = loadSession()?.token
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const hadToken = loadSession() !== null
  const response = await fetch(`/api${path}`, {
    method,
    headers: buildHeaders(body !== undefined),
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    // A 401 while we were logged in means the token expired: log out.
    // (A 401 from the login form itself just means wrong password.)
    if (response.status === 401 && hadToken) onUnauthorized?.()
    throw new ApiError(response.status, await readErrorMessage(response))
  }
  return (await response.json()) as T
}

// Text for the user when a request failed. API errors carry a readable message
// (e.g. "Client 9 does not exist"); anything else means we never reached the server.
export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Cannot reach the server. Try again.'
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
}
