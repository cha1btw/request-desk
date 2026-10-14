import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession } from '../auth/session'
import { makeRequest, mockApi, renderPage } from '../test-utils'
import { RequestsPage } from './RequestsPage'

const options = { path: '/requests', url: '/requests' }

// The answer of GET /requests: one page of rows plus the total.
const pageOf = (items: unknown[], { total = items.length, page = 1 } = {}) => ({ items, total, page, pageSize: 10 })

describe('RequestsPage', () => {
  beforeEach(() => clearSession())
  afterEach(() => vi.unstubAllGlobals())

  it('lists the requests with their client and status', async () => {
    mockApi({
      'GET /api/requests?page=1&pageSize=10': pageOf([
        makeRequest(),
        makeRequest({ id: 6, title: 'Paint the fence', status: 'done' }),
      ]),
    })

    renderPage(<RequestsPage />, options)

    expect(await screen.findByRole('link', { name: 'Fix the door' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Paint the fence' })).toBeTruthy()
    expect(screen.getAllByText('Anna Petrenko')).toHaveLength(2)
  })

  it('asks the API for the chosen status', async () => {
    const fetchMock = mockApi({
      'GET /api/requests?page=1&pageSize=10': pageOf([makeRequest()]),
      'GET /api/requests?status=done&page=1&pageSize=10': pageOf([
        makeRequest({ id: 6, title: 'Paint the fence', status: 'done' }),
      ]),
    })
    renderPage(<RequestsPage />, options)
    await screen.findByRole('link', { name: 'Fix the door' })

    await userEvent.setup().selectOptions(screen.getByLabelText('Status'), 'Done')

    expect(await screen.findByRole('link', { name: 'Paint the fence' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Fix the door' })).toBeNull()
    expect(fetchMock).toHaveBeenLastCalledWith('/api/requests?status=done&page=1&pageSize=10', expect.anything())
  })

  it('searches by client name after the user stops typing', async () => {
    const fetchMock = mockApi({
      'GET /api/requests?page=1&pageSize=10': pageOf([makeRequest()]),
      'GET /api/requests?clientName=ann&page=1&pageSize=10': pageOf([makeRequest({ title: 'Only Anna' })]),
    })
    renderPage(<RequestsPage />, options)
    await screen.findByRole('link', { name: 'Fix the door' })

    await userEvent.setup().type(screen.getByLabelText('Client name'), 'ann')

    expect(await screen.findByRole('link', { name: 'Only Anna' })).toBeTruthy()
    expect(fetchMock).toHaveBeenLastCalledWith('/api/requests?clientName=ann&page=1&pageSize=10', expect.anything())
  })

  it('downloads a CSV with the active filters', async () => {
    const fetchMock = mockApi({
      'GET /api/requests?status=done&page=1&pageSize=10': pageOf([makeRequest({ status: 'done' })]),
      'GET /api/requests/export?status=done': 'ID,Title',
    })
    // jsdom cannot create object URLs or follow download links, so we fake both.
    URL.createObjectURL = vi.fn(() => 'blob:fake')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    renderPage(<RequestsPage />, { path: '/requests', url: '/requests?status=done' })
    await screen.findByRole('link', { name: 'Fix the door' })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Export CSV' }))

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith('/api/requests/export?status=done', expect.anything())
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toMatch(/^requests-\d{4}-\d{2}-\d{2}\.csv$/)
    click.mockRestore()
  })

  it('shows a message when nothing matches', async () => {
    mockApi({ 'GET /api/requests?page=1&pageSize=10': pageOf([]) })

    renderPage(<RequestsPage />, options)

    expect(await screen.findByText('No requests match these filters.')).toBeTruthy()
  })

  it('shows the pager and loads the next page', async () => {
    const fetchMock = mockApi({
      'GET /api/requests?page=1&pageSize=10': pageOf([makeRequest()], { total: 25 }),
      'GET /api/requests?page=2&pageSize=10': pageOf([makeRequest({ id: 15, title: 'On page two' })], {
        total: 25,
        page: 2,
      }),
    })
    renderPage(<RequestsPage />, options)
    expect(await screen.findByText('Showing 1-10 of 25')).toBeTruthy()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Next' }))

    expect(await screen.findByRole('link', { name: 'On page two' })).toBeTruthy()
    expect(screen.getByText('Page 2 of 3')).toBeTruthy()
    expect(fetchMock).toHaveBeenLastCalledWith('/api/requests?page=2&pageSize=10', expect.anything())
  })

  it('goes back to page 1 when a filter changes', async () => {
    const fetchMock = mockApi({
      'GET /api/requests?page=2&pageSize=10': pageOf([makeRequest()], { total: 25, page: 2 }),
      'GET /api/requests?status=done&page=1&pageSize=10': pageOf([makeRequest({ status: 'done' })]),
    })
    renderPage(<RequestsPage />, { path: '/requests', url: '/requests?page=2' })
    await screen.findByText('Page 2 of 3')

    await userEvent.setup().selectOptions(screen.getByLabelText('Status'), 'Done')

    await screen.findByRole('link', { name: 'Fix the door' })
    expect(fetchMock).toHaveBeenLastCalledWith('/api/requests?status=done&page=1&pageSize=10', expect.anything())
  })

  it('explains an empty page that is past the end', async () => {
    mockApi({ 'GET /api/requests?page=9&pageSize=10': pageOf([], { total: 25, page: 9 }) })

    renderPage(<RequestsPage />, { path: '/requests', url: '/requests?page=9' })

    expect(await screen.findByText(/This page is empty/)).toBeTruthy()
  })
})
