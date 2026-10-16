import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, Building2, CircleAlert, Compass, Utensils } from 'lucide-react'
import { login, saveSession } from '../api/auth.js'

const ROLE_HOME = { donor: '/donor', recipient: '/recipient', coordinator: '/coordinator' }
const DEMO_ACCOUNTS = {
  donor: { label: 'Donor', Icon: Utensils, email: 'harshal@sunrise.in', password: 'MealBridgeDonor2026!', description: 'Offer surplus food' },
  recipient: { label: 'NGO', Icon: Building2, email: 'anita@ashatrust.org', password: 'MealBridgeNGO2026!', description: 'Request food for your community' },
  coordinator: { label: 'Coordinator', Icon: Compass, email: 'admin@mealbridge.in', password: 'MealBridgeCoordinator2026!', description: 'Coordinate and monitor rescue' },
}

export default function LoginPage() {
  const [email, setEmail] = useState(DEMO_ACCOUNTS.donor.email)
  const [password, setPassword] = useState(DEMO_ACCOUNTS.donor.password)
  const [selectedRole, setSelectedRole] = useState('donor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const selectDemoRole = (role) => {
    const account = DEMO_ACCOUNTS[role]
    setSelectedRole(role)
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try {
      const session = await login({ email, password })
      saveSession(session)
      navigate(ROLE_HOME[session.user.role] || '/', { replace: true })
    } catch (loginError) {
      setError(loginError.message || 'Could not sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Glow orbs */}
      <div className="orb orb-orange" style={{ width: 400, height: 400, top: -100, left: -100, filter: 'blur(90px)' }} />
      <div className="orb orb-green"  style={{ width: 350, height: 350, bottom: -80, right: -80, filter: 'blur(90px)' }} />

      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg,#f97316,#ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', boxShadow: '0 4px 20px rgba(249,115,22,0.4)'
            }}><Utensils size={19} strokeWidth={1.8} color="#fff" /></div>
            <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-primary)' }}>
              Meal<span className="gradient-text-orange">Bridge</span>
            </span>
          </Link>
          <div style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Welcome back — sign in to continue
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(17,24,39,0.8)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '30px 32px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)'
        }}>

          <div style={{ marginBottom: 22 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, marginBottom: 10 }}>Choose a demo account</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 9 }}>
              {Object.entries(DEMO_ACCOUNTS).map(([role, account]) => {
                const active = selectedRole === role
                return <button key={role} type="button" onClick={() => selectDemoRole(role)} aria-pressed={active}
                  style={{ textAlign: 'left', minHeight: 88, padding: '11px 10px', cursor: 'pointer',
                    borderRadius: 'var(--radius-md)', border: `1px solid ${active ? 'rgba(249,115,22,0.75)' : 'var(--border)'}`,
                    background: active ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.025)', color: 'var(--text-primary)',
                    boxShadow: active ? '0 0 0 1px rgba(249,115,22,0.18)' : 'none' }}>
                  <span style={{ display: 'block', marginBottom: 5 }}><account.Icon size={19} strokeWidth={1.7} color={active ? '#fb923c' : 'var(--text-muted)'} /></span>
                  <strong style={{ display: 'block', fontSize: '0.8rem' }}>{account.label}</strong>
                  <span style={{ display: 'block', marginTop: 3, color: 'var(--text-muted)', fontSize: '0.66rem', lineHeight: 1.3 }}>{account.description}</span>
                </button>
              })}
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.18)', color: 'var(--text-secondary)', fontSize: '0.76rem', lineHeight: 1.65 }}>
              <strong style={{ color: 'var(--orange-light)' }}>{DEMO_ACCOUNTS[selectedRole].label} demo credentials</strong><br />
              {DEMO_ACCOUNTS[selectedRole].email} / <strong>{DEMO_ACCOUNTS[selectedRole].password}</strong>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600,
                color: 'var(--text-secondary)', marginBottom: 8 }}>Email Address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@organisation.com"
                style={{
                  width: '100%', padding: '13px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                  fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#f97316'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600,
                color: 'var(--text-secondary)', marginBottom: 8 }}>Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '13px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                  fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#f97316'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                color: '#f87171', fontSize: '0.85rem', marginBottom: 16
              }}><CircleAlert size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />{error}</div>
            )}

            <button id="login-submit" type="submit" className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
              disabled={loading}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-slow 0.7s linear infinite',
                      display: 'inline-block' }} />
                    Signing in...
                  </span>
                : <><ArrowRight size={17} /> Sign In</>}
            </button>
          </form>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            No account yet?{' '}
            <Link to="/register" style={{ color: 'var(--orange-light)', fontWeight: 600, textDecoration: 'none' }}>
              Register here
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none',
            transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'var(--orange)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
          >← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
