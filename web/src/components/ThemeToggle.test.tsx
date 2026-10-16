import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('starts on Auto and leaves the root element alone', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('button', { name: /Theme: Auto/ })).toBeTruthy()
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('cycles Auto -> Light -> Dark -> Auto and saves the choice', async () => {
    render(<ThemeToggle />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button'))
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    await user.click(screen.getByRole('button'))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('request-desk-theme')).toBe('dark')

    await user.click(screen.getByRole('button'))
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('restores the saved choice', () => {
    localStorage.setItem('request-desk-theme', 'dark')
    render(<ThemeToggle />)
    expect(screen.getByRole('button', { name: /Theme: Dark/ })).toBeTruthy()
  })
})
