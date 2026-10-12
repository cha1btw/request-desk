import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../api/client'
import type { Client } from '../api/types'

export interface RequestFormValues {
  title: string
  description: string
  clientId: number
}

interface RequestFormProps {
  clients: Client[]
  initialValues?: RequestFormValues
  submitLabel: string
  onSubmit: (values: RequestFormValues) => Promise<void>
  onCancel?: () => void
}

// Used for both "new request" and "edit request".
export function RequestForm({ clients, initialValues, submitLabel, onSubmit, onCancel }: RequestFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  // Form fields hold strings; we convert to a number when submitting.
  const [clientId, setClientId] = useState(initialValues ? String(initialValues.clientId) : '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), clientId: Number(clientId) })
    } catch (err) {
      setError(getErrorMessage(err))
      setSubmitting(false)
    }
    // On success the parent leaves this form (navigates away or closes it),
    // so there is nothing to reset here.
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="field">
        <label htmlFor="client">Client</label>
        <select id="client" required value={clientId} onChange={(event) => setClientId(event.target.value)}>
          <option value="">Select a client...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          required
          maxLength={200}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          required
          rows={5}
          maxLength={5000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div className="actions">
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
