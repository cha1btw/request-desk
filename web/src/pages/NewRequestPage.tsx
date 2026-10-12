import { Link, useNavigate } from 'react-router'
import { api } from '../api/client'
import type { Client, CustomerRequest } from '../api/types'
import { useFetch } from '../api/useFetch'
import { RequestForm, type RequestFormValues } from '../components/RequestForm'

export function NewRequestPage() {
  const navigate = useNavigate()
  const { data: clients, error, loading } = useFetch<Client[]>('/clients')

  async function createRequest(values: RequestFormValues) {
    const created = await api.post<CustomerRequest>('/requests', values)
    navigate(`/requests/${created.id}`)
  }

  return (
    <>
      <h1>New request</h1>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="muted">Loading...</p>}
      {clients && clients.length === 0 && (
        <div className="card">
          <p>
            A request belongs to a client, and there are no clients yet. <Link to="/clients">Add a client first</Link>.
          </p>
        </div>
      )}
      {clients && clients.length > 0 && (
        <RequestForm
          clients={clients}
          submitLabel="Create request"
          onSubmit={createRequest}
          onCancel={() => navigate('/requests')}
        />
      )}
    </>
  )
}
