import { useState, type FormEvent } from 'react'
import { api, getErrorMessage } from '../api/client'
import type { Client } from '../api/types'
import { useFetch } from '../api/useFetch'
import { formatDate } from '../format'

export function ClientsPage() {
  const { data: clients, error, loading, reload } = useFetch<Client[]>('/clients')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function addClient(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      await api.post('/clients', { name: name.trim(), email: email.trim(), phone: phone.trim() })
      setName('')
      setEmail('')
      setPhone('')
      reload()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>Clients</h1>

      <form className="card" onSubmit={addClient}>
        <h2>Add a client</h2>
        {formError && (
          <p className="error" role="alert">
            {formError}
          </p>
        )}
        <div className="form-row">
          <div className="field">
            <label htmlFor="client-name">Name</label>
            <input id="client-name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="client-email">Email</label>
            <input id="client-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="client-phone">Phone</label>
            <input id="client-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add client'}
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading && !clients && <p className="muted">Loading...</p>}
      {clients && clients.length === 0 && <p className="muted">No clients yet.</p>}
      {clients && clients.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.name}</td>
                  <td>{client.email}</td>
                  <td>{client.phone}</td>
                  <td className="muted">{formatDate(client.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
