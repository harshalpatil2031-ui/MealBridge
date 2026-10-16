import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<LandingPage />} />
        <Route path="/login"       element={<LoginPage />} />
        <Route path="/register"    element={<RegisterPage />} />
        <Route path="/donor"       element={<DonorDashboard />} />
        <Route path="/matching"    element={<MatchingPage />} />
        <Route path="/rescue"      element={<RescuePage />} />
        <Route path="/recipient"   element={<RecipientDashboard />} />
        <Route path="/coordinator" element={<CoordinatorDashboard />} />
        <Route path="/donation/:id" element={<DonationDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="*"            element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
