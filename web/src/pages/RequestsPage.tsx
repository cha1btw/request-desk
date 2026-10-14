import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api, getErrorMessage } from '../api/client'
import { useFetch } from '../api/useFetch'
import type { CustomerRequest } from '../api/types'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate } from '../format'
import { REQUEST_STATUSES } from '../statuses'

export function RequestsPage() {
  // The filters live in the URL (/requests?status=done&clientName=ann), so a
  // reload keeps them and a filtered view can be bookmarked or shared.
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') ?? ''
  const clientName = searchParams.get('clientName') ?? ''

  // What the user is typing. It reaches the URL (and the API) 300 ms after
  // they stop typing, so we do not send a request on every keystroke.
  const [searchText, setSearchText] = useState(clientName)

  useEffect(() => {
    const value = searchText.trim()
    if (value === clientName) return
    const timer = setTimeout(() => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          if (value) next.set('clientName', value)
          else next.delete('clientName')
          return next
        },
        { replace: true },
      )
    }, 300)
    return () => clearTimeout(timer)
  }, [searchText, clientName, setSearchParams])

  function changeStatus(value: string) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value) next.set('status', value)
        else next.delete('status')
        return next
      },
      { replace: true },
    )
  }

  const query = new URLSearchParams()
  if (status) query.set('status', status)
  if (clientName) query.set('clientName', clientName)
  const queryString = query.toString()

  const { data: requests, error, loading } = useFetch<CustomerRequest[]>(
    `/requests${queryString ? `?${queryString}` : ''}`,
  )

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // Downloads the list with the filters that are active right now.
  async function exportCsv() {
    setExportError(null)
    setExporting(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      await api.download(`/requests/export${queryString ? `?${queryString}` : ''}`, `requests-${today}.csv`)
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
      {loading && !requests && <p className="muted">Loading...</p>}

      {requests && requests.length === 0 && (
        <div className="card muted">No requests match these filters.</div>
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
    </>
  )
}
