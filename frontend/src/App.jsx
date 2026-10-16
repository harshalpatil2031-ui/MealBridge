import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DonorDashboard from './pages/DonorDashboard'
import MatchingPage from './pages/MatchingPage'
import RescuePage from './pages/RescuePage'
import RecipientDashboard from './pages/RecipientDashboard'
import CoordinatorDashboard from './pages/CoordinatorDashboard'
import DonationDetailPage from './pages/DonationDetailPage'
import AnalyticsPage from './pages/AnalyticsPage'
import { getSession } from './api/session.js'
import './index.css'

const ROLE_HOME = {
  donor: '/donor',
  recipient: '/recipient',
  coordinator: '/coordinator',
}

function RoleRoute({ roles, children }) {
  const [session] = useState(getSession)
  const role = session?.user?.role
  if (!session?.token || !role || !ROLE_HOME[role]) return <Navigate to="/login" replace />
  if (!roles.includes(role)) return <Navigate to={ROLE_HOME[role]} replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<LandingPage />} />
        <Route path="/login"       element={<LoginPage />} />
        <Route path="/register"    element={<RegisterPage />} />
        <Route path="/donor" element={<RoleRoute roles={['donor']}><DonorDashboard /></RoleRoute>} />
        <Route path="/matching" element={<RoleRoute roles={['donor']}><MatchingPage /></RoleRoute>} />
        <Route path="/rescue" element={<RoleRoute roles={['donor', 'coordinator']}><RescuePage /></RoleRoute>} />
        <Route path="/recipient" element={<RoleRoute roles={['recipient']}><RecipientDashboard /></RoleRoute>} />
        <Route path="/coordinator" element={<RoleRoute roles={['coordinator']}><CoordinatorDashboard /></RoleRoute>} />
        <Route path="/donation/:id" element={<RoleRoute roles={['donor', 'recipient', 'coordinator']}><DonationDetailPage /></RoleRoute>} />
        <Route path="/analytics" element={<RoleRoute roles={['coordinator']}><AnalyticsPage /></RoleRoute>} />
        <Route path="*"            element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
