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

  it('shows the API error when the request does not exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'Request not found' }), { status: 404 })),
    )

    renderPage(<RequestDetailPage />, options)

    expect((await screen.findByRole('alert')).textContent).toBe('Request not found')
  })
})
