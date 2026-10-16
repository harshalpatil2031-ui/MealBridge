import { Link, NavLink, useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../api/session.js'
import { logout as endSession } from '../api/auth.js'
import { BarChart3, Compass, House, TriangleAlert } from 'lucide-react'

const navigationByRole = {
  recipient: [{ to: '/recipient', label: 'Recipient dashboard', Icon: House }],
  coordinator: [
    { to: '/coordinator', label: 'Coordinator overview', Icon: Compass },
    { to: '/analytics', label: 'Analytics', Icon: BarChart3 },
  ],
}

export default function DashboardLayout({ title, subtitle, children }) {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const role = currentUser?.role
  const navigation = navigationByRole[role] || []

  const logout = async () => {
    await endSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-brand">Meal<span>Bridge</span></Link>
        <p className="dashboard-sidebar-label">WORKSPACE</p>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          {navigation.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `dashboard-nav-link${isActive ? ' active' : ''}`}>
              <item.Icon size={17} strokeWidth={1.8} aria-hidden="true" />{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="dashboard-sidebar-footer">
          <span className="online-dot" /> Demo workspace
          <button type="button" onClick={logout} style={{ display: 'block', marginTop: 12, padding: 0, border: 0, background: 'none', color: 'inherit', cursor: 'pointer', font: 'inherit' }}>Log out</button>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div><p className="dashboard-eyebrow">MEALBRIDGE · OPERATIONS</p><h1>{title}</h1><p className="dashboard-subtitle">{subtitle}</p></div>
          <Link className="dashboard-avatar" to="/" aria-label={`Signed in as ${currentUser?.name || 'user'}`}>{currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}</Link>
        </header>
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  )
}

export function StatusBadge({ status }) {
  const normalized = status?.toUpperCase().replaceAll(' ', '_') || 'PENDING'
  return <span className={`status-badge status-${normalized.toLowerCase()}`}>{normalized.replaceAll('_', ' ')}</span>
}

export function Toast({ message, onClose }) {
  if (!message) return null
  return <div role="status" className={`app-toast ${message.type === 'error' ? 'error' : 'success'}`}>
    <span>{message.type === 'error' ? <TriangleAlert size={16} /> : '✓'}</span><span>{message.text}</span>
    <button aria-label="Dismiss notification" onClick={onClose}>×</button>
  </div>
}

export function SectionHeading({ eyebrow, title, detail, action }) {
  return <div className="section-heading">
    <div>{eyebrow && <p className="dashboard-eyebrow">{eyebrow}</p>}<h2>{title}</h2>{detail && <p>{detail}</p>}</div>
    {action}
  </div>
}
