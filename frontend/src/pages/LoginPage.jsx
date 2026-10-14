import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function LoginPage() {
  const [role, setRole] = useState('donor')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const roles = [
    { id: 'donor',       label: 'Donor',       icon: '🍽️', desc: 'Restaurant / Canteen / Hostel' },
    { id: 'recipient',   label: 'NGO',          icon: '🏠', desc: 'NGO / Shelter / Kitchen' },
    { id: 'coordinator', label: 'Coordinator',  icon: '🧑‍💼', desc: 'Platform Admin' },
  ]

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    // Simulate API call — replace with real API later
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    // Store mock auth
    localStorage.setItem('mb_user', JSON.stringify({ email, role, name: email.split('@')[0] }))
    if (role === 'donor')       navigate('/donor')
    if (role === 'recipient')   navigate('/recipient')
    if (role === 'coordinator') navigate('/coordinator')
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

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg,#f97316,#ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', boxShadow: '0 4px 20px rgba(249,115,22,0.4)'
            }}>🍱</div>
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
          borderRadius: 'var(--radius-xl)', padding: '36px 32px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)'
        }}>

          {/* Role selector */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              I am a...
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {roles.map(r => (
                <button key={r.id} id={`role-${r.id}`} onClick={() => setRole(r.id)} style={{
                  padding: '12px 8px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: `1.5px solid ${role === r.id ? '#f97316' : 'var(--border)'}`,
                  background: role === r.id ? 'var(--orange-glow)' : 'rgba(255,255,255,0.02)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all 0.2s ease'
                }}>
                  <span style={{ fontSize: '1.4rem' }}>{r.icon}</span>
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 700,
                    color: role === r.id ? 'var(--orange-light)' : 'var(--text-secondary)'
                  }}>{r.label}</span>
                </button>
              ))}
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
              }}>⚠️ {error}</div>
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
                : '→ Sign In'}
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
