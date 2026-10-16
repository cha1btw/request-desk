import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { useShortcuts } from './useShortcuts'

function Probe({ withSearch = true }: { withSearch?: boolean }) {
  useShortcuts()
  const { pathname } = useLocation()
  return (
    <>
      <p data-testid="path">{pathname}</p>
      {withSearch && <input id="client-search" aria-label="search" />}
      <textarea aria-label="notes" />
    </>
  )
}

function setup(withSearch = true) {
  render(
    <MemoryRouter initialEntries={['/requests']}>
      <Probe withSearch={withSearch} />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

describe('useShortcuts', () => {
  it('"/" focuses the search field without typing the slash', async () => {
    const user = setup()
    await user.keyboard('/')
    expect(document.activeElement).toBe(screen.getByLabelText('search'))
    expect((screen.getByLabelText('search') as HTMLInputElement).value).toBe('')
  })

  it('"n" opens the new request page', async () => {
    const user = setup()
    await user.keyboard('n')
    expect(screen.getByTestId('path').textContent).toBe('/requests/new')
  })

  it('does nothing while the user is typing in a field', async () => {
    const user = setup()
    await user.click(screen.getByLabelText('notes'))
    await user.keyboard('n')
    expect(screen.getByTestId('path').textContent).toBe('/requests')
  })

  it('ignores "/" on pages without a search field', async () => {
    const user = setup(false)
    await user.keyboard('/')
    expect(document.activeElement).toBe(document.body)
  })
})
