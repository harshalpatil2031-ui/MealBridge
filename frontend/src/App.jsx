import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DonorDashboard from './pages/DonorDashboard'
import './index.css'

// Placeholder pages — will be replaced by real dashboards
const ComingSoon = ({ page }) => (
  <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
    <div style={{ fontSize: '3rem' }}>🚧</div>
    <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: '1.6rem' }}>{page} Dashboard</h2>
    <p style={{ color: 'var(--text-secondary)' }}>Building now — check back soon!</p>
    <a href="/" className="btn-primary" style={{ marginTop: 8 }}>← Back to Home</a>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<LandingPage />} />
        <Route path="/login"       element={<LoginPage />} />
        <Route path="/register"    element={<RegisterPage />} />
        <Route path="/donor"       element={<DonorDashboard />} />
        <Route path="/recipient"   element={<ComingSoon page="Recipient" />} />
        <Route path="/coordinator" element={<ComingSoon page="Coordinator" />} />
        <Route path="*"            element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
