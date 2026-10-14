import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StatusFilter } from './StatusFilter'

const counts = { new: 5, in_progress: 4, done: 3, total: 12 }

describe('StatusFilter', () => {
  it('shows a button with a count for every status', () => {
    render(<StatusFilter value="" counts={counts} onChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'All 12' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'New 5' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'In progress 4' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Done 3' })).toBeTruthy()
  })

  it('marks only the selected status as pressed', () => {
    render(<StatusFilter value="done" counts={counts} onChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'Done 3' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'All 12' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('works without numbers while they are loading', () => {
    render(<StatusFilter value="" counts={null} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'New' })).toBeTruthy()
  })

  it('reports the chosen status, and an empty string for "All"', async () => {
    const onChange = vi.fn()
    render(<StatusFilter value="done" counts={counts} onChange={onChange} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'In progress 4' }))
    await user.click(screen.getByRole('button', { name: 'All 12' }))

    expect(onChange).toHaveBeenNthCalledWith(1, 'in_progress')
    expect(onChange).toHaveBeenNthCalledWith(2, '')
  })
})
