import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Pager } from './Pager'

describe('Pager', () => {
  it('shows nothing when everything fits on one page', () => {
    const { container } = render(<Pager page={1} pageSize={10} total={7} onChange={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows the range and the page count', () => {
    render(<Pager page={2} pageSize={10} total={25} onChange={() => {}} />)

    expect(screen.getByText('Showing 11-20 of 25')).toBeTruthy()
    expect(screen.getByText('Page 2 of 3')).toBeTruthy()
  })

  it('cuts the range at the last row on the last page', () => {
    render(<Pager page={3} pageSize={10} total={25} onChange={() => {}} />)
    expect(screen.getByText('Showing 21-25 of 25')).toBeTruthy()
  })

  it('disables Previous on the first page and Next on the last page', () => {
    const { rerender } = render(<Pager page={1} pageSize={10} total={25} onChange={() => {}} />)
    expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(false)

    rerender(<Pager page={3} pageSize={10} total={25} onChange={() => {}} />)
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('asks for the next and the previous page', async () => {
    const onChange = vi.fn()
    render(<Pager page={2} pageSize={10} total={25} onChange={onChange} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Previous' }))

    expect(onChange).toHaveBeenNthCalledWith(1, 3)
    expect(onChange).toHaveBeenNthCalledWith(2, 1)
  })
})
