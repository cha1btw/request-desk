import { useState, type FormEvent } from 'react'
import { api, getErrorMessage } from '../api/client'
import type { AdminUser, Role } from '../api/types'
import { useFetch } from '../api/useFetch'
import { formatDate } from '../format'

export function UsersPage() {
  const { data: users, error, loading, reload } = useFetch<AdminUser[]>('/users')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('manager')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function addUser(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      await api.post('/users', { name: name.trim(), email: email.trim(), password, role })
      setName('')
      setEmail('')
      setPassword('')
      setRole('manager')
      reload()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>Users</h1>

      <form className="card" onSubmit={addUser}>
        <h2>Add a user</h2>
        {formError && (
          <p className="error" role="alert">
            {formError}
          </p>
        )}
        <div className="form-row">
          <div className="field">
            <label htmlFor="user-name">Name</label>
            <input id="user-name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="user-email">Email</label>
            <input id="user-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="user-password">Password</label>
            <input
              id="user-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="user-role">Role</label>
            <select id="user-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <p className="muted hint">The password must be at least 8 characters. The user can log in with it right away.</p>
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add user'}
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading && !users && <p className="muted">Loading...</p>}
      {users && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th className="hide-narrow">Added</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge badge-${user.role}`}>{user.role === 'admin' ? 'Admin' : 'Manager'}</span>
                  </td>
                  <td className="muted hide-narrow">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
