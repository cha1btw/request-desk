import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession } from '../auth/session'
import { makeRequest, mockApi, renderPage } from '../test-utils'
import { RequestsPage } from './RequestsPage'

const options = { path: '/requests', url: '/requests' }

describe('RequestsPage', () => {
  beforeEach(() => clearSession())
  afterEach(() => vi.unstubAllGlobals())

  it('lists the requests with their client and status', async () => {
    mockApi({ 'GET /api/requests': [makeRequest(), makeRequest({ id: 6, title: 'Paint the fence', status: 'done' })] })

    renderPage(<RequestsPage />, options)

    expect(await screen.findByRole('link', { name: 'Fix the door' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Paint the fence' })).toBeTruthy()
    expect(screen.getAllByText('Anna Petrenko')).toHaveLength(2)
  })

  it('asks the API for the chosen status', async () => {
    const fetchMock = mockApi({
      'GET /api/requests': [makeRequest()],
      'GET /api/requests?status=done': [makeRequest({ id: 6, title: 'Paint the fence', status: 'done' })],
    })
    renderPage(<RequestsPage />, options)
    await screen.findByRole('link', { name: 'Fix the door' })

    await userEvent.setup().selectOptions(screen.getByLabelText('Status'), 'Done')

    expect(await screen.findByRole('link', { name: 'Paint the fence' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Fix the door' })).toBeNull()
    expect(fetchMock).toHaveBeenLastCalledWith('/api/requests?status=done', expect.anything())
  })

  it('searches by client name after the user stops typing', async () => {
    const fetchMock = mockApi({
      'GET /api/requests': [makeRequest()],
      'GET /api/requests?clientName=ann': [makeRequest({ title: 'Only Anna' })],
    })
    renderPage(<RequestsPage />, options)
    await screen.findByRole('link', { name: 'Fix the door' })

    await userEvent.setup().type(screen.getByLabelText('Client name'), 'ann')

    expect(await screen.findByRole('link', { name: 'Only Anna' })).toBeTruthy()
    expect(fetchMock).toHaveBeenLastCalledWith('/api/requests?clientName=ann', expect.anything())
  })

  it('shows a message when nothing matches', async () => {
    mockApi({ 'GET /api/requests': [] })

    renderPage(<RequestsPage />, options)

    expect(await screen.findByText('No requests match these filters.')).toBeTruthy()
  })
})
