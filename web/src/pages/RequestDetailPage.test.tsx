import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession } from '../auth/session'
import { makeRequest, mockApi, olena, renderPage } from '../test-utils'
import { RequestDetailPage } from './RequestDetailPage'

const options = { path: '/requests/:id', url: '/requests/5' }

describe('RequestDetailPage', () => {
  beforeEach(() => clearSession())
  afterEach(() => vi.unstubAllGlobals())

  it('shows the request with its client and comments', async () => {
    mockApi({
      'GET /api/requests/5': makeRequest({
        comments: [{ id: 1, text: 'Called the client', requestId: 5, authorId: 2, author: olena, createdAt: '2026-10-02T10:00:00Z' }],
      }),
    })

    renderPage(<RequestDetailPage />, options)

    expect(await screen.findByRole('heading', { name: 'Fix the door' })).toBeTruthy()
    expect(screen.getByText('It does not close')).toBeTruthy()
    expect(screen.getByText('Called the client')).toBeTruthy()
    expect(screen.getByText('Comments (1)')).toBeTruthy()
  })

  it('sends only the new status when it is changed', async () => {
    const fetchMock = mockApi({
      'GET /api/requests/5': makeRequest(),
      'PATCH /api/requests/5': makeRequest({ status: 'done' }),
    })
    renderPage(<RequestDetailPage />, options)
    await screen.findByRole('heading', { name: 'Fix the door' })

    await userEvent.setup().selectOptions(screen.getByLabelText('Status'), 'Done')

    const patchCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH')
    expect(patchCall?.[1]?.body).toBe('{"status":"done"}')
  })

  it('posts a new comment', async () => {
    const fetchMock = mockApi({
      'GET /api/requests/5': makeRequest(),
      'POST /api/requests/5/comments': { id: 2, text: 'Visit planned for Monday' },
    })
    renderPage(<RequestDetailPage />, options)
    await screen.findByRole('heading', { name: 'Fix the door' })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Add a comment'), 'Visit planned for Monday')
    await user.click(screen.getByRole('button', { name: 'Add comment' }))

    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(postCall?.[1]?.body).toBe('{"text":"Visit planned for Monday"}')
  })

  describe('deleting', () => {
    const routes = { 'GET /api/requests/5': makeRequest(), 'DELETE /api/requests/5': null }

    afterEach(() => vi.restoreAllMocks())

    it('does not offer Delete to a manager', async () => {
      mockApi(routes)
      renderPage(<RequestDetailPage />, options)
      await screen.findByRole('heading', { name: 'Fix the door' })

      expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull()
    })

    it('deletes after the admin confirms', async () => {
      const fetchMock = mockApi(routes)
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
      renderPage(<RequestDetailPage />, { ...options, role: 'admin' })
      await screen.findByRole('heading', { name: 'Fix the door' })

      await userEvent.setup().click(screen.getByRole('button', { name: 'Delete' }))

      expect(confirm).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls.some(([url, init]) => url === '/api/requests/5' && init?.method === 'DELETE')).toBe(true)
    })

    it('deletes nothing when the admin cancels', async () => {
      const fetchMock = mockApi(routes)
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      renderPage(<RequestDetailPage />, { ...options, role: 'admin' })
      await screen.findByRole('heading', { name: 'Fix the door' })

      await userEvent.setup().click(screen.getByRole('button', { name: 'Delete' }))

      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
    })
  })

  it('shows the API error when the request does not exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'Request not found' }), { status: 404 })),
    )

    renderPage(<RequestDetailPage />, options)

    expect((await screen.findByRole('alert')).textContent).toBe('Request not found')
  })
})
