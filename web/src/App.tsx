import { Navigate, Route, Routes } from 'react-router'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { RequestsPage } from './pages/RequestsPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Everything inside needs a login */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/requests" element={<RequestsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/requests" replace />} />
    </Routes>
  )
}
