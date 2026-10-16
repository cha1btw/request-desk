import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBar } from './StatusBar'

describe('StatusBar', () => {
  it('describes the split and the share of finished requests', () => {
    render(<StatusBar counts={{ new: 5, in_progress: 4, done: 3, total: 12 }} />)

    expect(screen.getByRole('img', { name: 'New: 5, In progress: 4, Done: 3' })).toBeTruthy()
    expect(screen.getByText('25% done (3 of 12)')).toBeTruthy()
  })

  it('renders nothing while loading or when there are no requests', () => {
    const { container, rerender } = render(<StatusBar counts={null} />)
    expect(container.innerHTML).toBe('')

    rerender(<StatusBar counts={{ new: 0, in_progress: 0, done: 0, total: 0 }} />)
    expect(container.innerHTML).toBe('')
  })
})
