import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession } from '../auth/session'
import { renderPage } from '../test-utils'
import { Layout } from './Layout'

describe('Layout', () => {
  beforeEach(() => clearSession())
  afterEach(() => vi.unstubAllGlobals())

  it('shows the Users link to an admin', () => {
    renderPage(<Layout />, { path: '/requests', url: '/requests', role: 'admin' })
    expect(screen.getByRole('link', { name: 'Users' })).toBeTruthy()
  })

  it('hides the Users link from a manager', () => {
    renderPage(<Layout />, { path: '/requests', url: '/requests', role: 'manager' })
    expect(screen.queryByRole('link', { name: 'Users' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Clients' })).toBeTruthy()
  })
})
