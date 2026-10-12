import { Navigate, Route, Routes } from 'react-router'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Layout } from './components/Layout'
import { ClientsPage } from './pages/ClientsPage'
import { LoginPage } from './pages/LoginPage'
import { NewRequestPage } from './pages/NewRequestPage'
import { RequestDetailPage } from './pages/RequestDetailPage'
import { RequestsPage } from './pages/RequestsPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Everything inside needs a login */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/requests/new" element={<NewRequestPage />} />
          <Route path="/requests/:id" element={<RequestDetailPage />} />
          <Route path="/clients" element={<ClientsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/requests" replace />} />
    </Routes>
  )
}
