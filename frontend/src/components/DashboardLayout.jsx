import { Link, NavLink } from 'react-router-dom'

const navigation = [
  { to: '/donor', label: 'Donor dashboard', icon: '🍱' },
  { to: '/recipient', label: 'Recipient dashboard', icon: '🏠' },
  { to: '/coordinator', label: 'Coordinator', icon: '🧭' },
  { to: '/analytics', label: 'Analytics', icon: '📊' },
]

export default function DashboardLayout({ title, subtitle, children }) {
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-brand">Meal<span>Bridge</span></Link>
        <p className="dashboard-sidebar-label">WORKSPACE</p>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          {navigation.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `dashboard-nav-link${isActive ? ' active' : ''}`}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="dashboard-sidebar-footer"><span className="online-dot" /> Demo workspace</div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div><p className="dashboard-eyebrow">MEALBRIDGE · OPERATIONS</p><h1>{title}</h1><p className="dashboard-subtitle">{subtitle}</p></div>
          <Link className="dashboard-avatar" to="/">N</Link>
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
    <span>{message.type === 'error' ? '⚠' : '✓'}</span><span>{message.text}</span>
    <button aria-label="Dismiss notification" onClick={onClose}>×</button>
  </div>
}

export function SectionHeading({ eyebrow, title, detail, action }) {
  return <div className="section-heading">
    <div>{eyebrow && <p className="dashboard-eyebrow">{eyebrow}</p>}<h2>{title}</h2>{detail && <p>{detail}</p>}</div>
    {action}
  </div>
}
