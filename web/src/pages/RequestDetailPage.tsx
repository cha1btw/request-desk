import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api, getErrorMessage } from '../api/client'
import type { Client, CustomerRequest, RequestStatus } from '../api/types'
import { useFetch } from '../api/useFetch'
import { useAuth } from '../auth/useAuth'
import { Avatar } from '../components/Avatar'
import { RelativeTime } from '../components/RelativeTime'
import { RequestForm, type RequestFormValues } from '../components/RequestForm'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate } from '../format'
import { REQUEST_STATUSES } from '../statuses'

export function RequestDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: request, error, loading, reload } = useFetch<CustomerRequest>(`/requests/${id}`)
  const [editing, setEditing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [savingStatus, setSavingStatus] = useState(false)

  async function changeStatus(status: RequestStatus) {
    setActionError(null)
    setSavingStatus(true)
    try {
      await api.patch(`/requests/${id}`, { status })
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setSavingStatus(false)
    }
  }

  // Admins only (the API enforces it too). Asks first, because it cannot be undone.
  async function deleteRequest() {
    if (!window.confirm('Delete this request and all its comments? This cannot be undone.')) return
    setActionError(null)
    try {
      await api.delete(`/requests/${id}`)
      navigate('/requests', { replace: true })
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }

  async function saveEdits(values: RequestFormValues) {
    await api.patch(`/requests/${id}`, values)
    setEditing(false)
    reload()
  }

  if (error) {
    return (
      <>
        <p className="error" role="alert">
          {error}
        </p>
        <Link to="/requests">Back to requests</Link>
      </>
    )
  }
  if (!request) return loading ? <p className="muted">Loading...</p> : null

  return (
    <>
      <p>
        <Link to="/requests">&larr; All requests</Link>
      </p>

      <div className="page-title">
        <h1>{request.title}</h1>
        <StatusBadge status={request.status} />
      </div>

      {actionError && (
        <p className="error" role="alert">
          {actionError}
        </p>
      )}

      {editing ? (
        <EditRequest request={request} onSave={saveEdits} onCancel={() => setEditing(false)} />
      ) : (
        <div className="card">
          <p className="description">{request.description}</p>
          <dl className="details">
            <dt>Client</dt>
            <dd>
              {request.client.name}
              <br />
              <span className="muted">
                {request.client.email} · {request.client.phone}
              </span>
            </dd>
            <dt>Created</dt>
            <dd>{formatDate(request.createdAt)}</dd>
            <dt>Last updated</dt>
            <dd>{formatDate(request.updatedAt)}</dd>
          </dl>
          <div className="actions">
            <div className="field inline-field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={request.status}
                disabled={savingStatus}
                onChange={(event) => changeStatus(event.target.value as RequestStatus)}
              >
                {REQUEST_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
              Edit
            </button>
            {user?.role === 'admin' && (
              <button type="button" className="btn btn-danger" onClick={deleteRequest}>
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      <Comments request={request} onAdded={reload} />
    </>
  )
}

// Loads the client list only when the user opens the edit form.
function EditRequest(props: {
  request: CustomerRequest
  onSave: (values: RequestFormValues) => Promise<void>
  onCancel: () => void
}) {
  const { data: clients, error } = useFetch<Client[]>('/clients')

  if (error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    )
  }
  if (!clients) return <p className="muted">Loading...</p>

  return (
    <RequestForm
      clients={clients}
      initialValues={{
        title: props.request.title,
        description: props.request.description,
        clientId: props.request.clientId,
      }}
      submitLabel="Save changes"
      onSubmit={props.onSave}
      onCancel={props.onCancel}
    />
  )
}

function Comments({ request, onAdded }: { request: CustomerRequest; onAdded: () => void }) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const comments = request.comments ?? []

  async function addComment(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await api.post(`/requests/${request.id}/comments`, { text: text.trim() })
      setText('')
      onAdded()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="comments">
      <h2>Comments ({comments.length})</h2>
      {comments.length === 0 && <p className="muted">No comments yet.</p>}
      <ul>
        {comments.map((comment) => (
          <li key={comment.id} className="comment">
            <p className="comment-meta">
              <Avatar name={comment.author.name} /> <strong>{comment.author.name}</strong> · <RelativeTime iso={comment.createdAt} />
            </p>
            <p className="description">{comment.text}</p>
          </li>
        ))}
      </ul>

      <form className="card" onSubmit={addComment}>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="field">
          <label htmlFor="comment">Add a comment</label>
          <textarea
            id="comment"
            rows={3}
            required
            maxLength={2000}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </div>
        <button type="submit" className="btn" disabled={submitting || text.trim() === ''}>
          {submitting ? 'Adding...' : 'Add comment'}
        </button>
      </form>
    </section>
  )
}
