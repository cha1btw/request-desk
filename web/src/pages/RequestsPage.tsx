import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api, getErrorMessage } from '../api/client'
import { useFetch } from '../api/useFetch'
import type { CustomerRequest, Page } from '../api/types'
import { Pager } from '../components/Pager'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate } from '../format'
import { REQUEST_STATUSES } from '../statuses'

const PAGE_SIZE = 10

// A copy of the URL parameters with some keys set (or removed when the value is empty).
function withParams(previous: URLSearchParams, changes: Record<string, string>): URLSearchParams {
  const next = new URLSearchParams(previous)
  for (const [key, value] of Object.entries(changes)) {
    if (value) next.set(key, value)
    else next.delete(key)
  }
  return next
}

export function RequestsPage() {
  // The filters and the page live in the URL (/requests?status=done&page=2), so a
  // reload keeps them and a filtered view can be bookmarked or shared.
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') ?? ''
  const clientName = searchParams.get('clientName') ?? ''
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)

  // What the user is typing. It reaches the URL (and the API) 300 ms after
  // they stop typing, so we do not send a request on every keystroke.
  const [searchText, setSearchText] = useState(clientName)

  useEffect(() => {
    const value = searchText.trim()
    if (value === clientName) return
    const timer = setTimeout(() => {
      // A different search means a different list, so go back to page 1.
      setSearchParams((previous) => withParams(previous, { clientName: value, page: '' }), { replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchText, clientName, setSearchParams])

  function changeStatus(value: string) {
    setSearchParams((previous) => withParams(previous, { status: value, page: '' }), { replace: true })
  }

  function goToPage(nextPage: number) {
    setSearchParams((previous) => withParams(previous, { page: nextPage === 1 ? '' : String(nextPage) }))
  }

  // The filters alone are what the CSV export needs.
  const filters = new URLSearchParams()
  if (status) filters.set('status', status)
  if (clientName) filters.set('clientName', clientName)
  const filterString = filters.toString()

  const listQuery = new URLSearchParams(filters)
  listQuery.set('page', String(page))
  listQuery.set('pageSize', String(PAGE_SIZE))

  const { data, error, loading } = useFetch<Page<CustomerRequest>>(`/requests?${listQuery}`)
  const requests = data?.items

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // Downloads the whole list (all pages) with the filters that are active right now.
  async function exportCsv() {
    setExportError(null)
    setExporting(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      await api.download(`/requests/export${filterString ? `?${filterString}` : ''}`, `requests-${today}.csv`)
    } catch (err) {
      setExportError(getErrorMessage(err))
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <div className="page-title">
        <h1>Requests</h1>
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <Link to="/requests/new" className="btn">
            New request
          </Link>
        </div>
      </div>

      {exportError && (
        <p className="error" role="alert">
          {exportError}
        </p>
      )}

      <div className="toolbar">
        <div className="field">
          <label htmlFor="status-filter">Status</label>
          <select id="status-filter" value={status} onChange={(event) => changeStatus(event.target.value)}>
            <option value="">All statuses</option>
            {REQUEST_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="client-search">Client name</label>
          <input
            id="client-search"
            type="search"
            placeholder="Search by client..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading && !data && <p className="muted">Loading...</p>}

      {data && data.total === 0 && <div className="card muted">No requests match these filters.</div>}

      {/* The page number in the URL is past the last page (for example after a filter changed in another tab). */}
      {data && data.total > 0 && requests?.length === 0 && (
        <div className="card muted">This page is empty. Use Previous to go back.</div>
      )}

      {requests && requests.length > 0 && (
        // While a new result loads we keep the old rows, slightly faded.
        <div className={loading ? 'table-wrap is-loading' : 'table-wrap'} aria-busy={loading}>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Client</th>
                <th>Status</th>
                <th className="hide-narrow">Created</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <Link to={`/requests/${request.id}`}>{request.title}</Link>
                  </td>
                  <td>{request.client.name}</td>
                  <td>
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="muted hide-narrow">{formatDate(request.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onChange={goToPage} />}
    </>
  )
}
