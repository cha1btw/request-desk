import type { User } from '../api/types'

export interface Session {
  token: string
  user: User
}

const STORAGE_KEY = 'request-desk.session'

// The token lives in localStorage so a page reload keeps you logged in.
// Trade-off: any XSS bug could read it (see "What I would improve next" in the README).
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}
