import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, setUnauthorizedHandler } from '../api/client'
import type { LoginResponse } from '../api/types'
import { AuthContext } from './auth-context'
import { clearSession, loadSession, saveSession, type Session } from './session'

export function AuthProvider({ children }: { children: ReactNode }) {
  // Read once on first render: a reload keeps you logged in.
  const [session, setSession] = useState<Session | null>(loadSession)

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', { email, password })
    const next = { token: response.accessToken, user: response.user }
    saveSession(next)
    setSession(next)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  // If the API rejects our token (expired), log out; ProtectedRoute then redirects to /login.
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const value = useMemo(() => ({ user: session?.user ?? null, login, logout }), [session, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
