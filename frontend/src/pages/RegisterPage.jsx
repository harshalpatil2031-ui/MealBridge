import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function RegisterPage() {
  const [role, setRole] = useState('donor')
  const [form, setForm] = useState({ name: '', orgName: '', email: '', password: '', location: '', capacity: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const roles = [
    { id: 'donor',       label: 'Donor',      icon: '🍽️', desc: 'Restaurant, canteen, hostel, or event caterer' },
    { id: 'recipient',   label: 'NGO',         icon: '🏠', desc: 'NGO, shelter, community kitchen, or orphanage' },
    { id: 'coordinator', label: 'Coordinator', icon: '🧑‍💼', desc: 'Platform admin managing the full flow' },
  ]

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.orgName || !form.email || !form.password) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1400))
    setLoading(false)
    localStorage.setItem('mb_user', JSON.stringify({ ...form, role }))
    if (role === 'donor')       navigate('/donor')
    if (role === 'recipient')   navigate('/recipient')
    if (role === 'coordinator') navigate('/coordinator')
  }

  const inputStyle = {
    width: '100%', padding: '13px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
    fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s', fontFamily: 'inherit'
  }

  const labelStyle = {
    display: 'block', fontSize: '0.8rem', fontWeight: 600,
    color: 'var(--text-secondary)', marginBottom: 7, letterSpacing: '0.02em'
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Glow orbs */}
      <div className="orb orb-orange" style={{ width: 450, height: 450, top: -120, right: -100, filter: 'blur(100px)' }} />
      <div className="orb orb-green"  style={{ width: 350, height: 350, bottom: -80, left: -80, filter: 'blur(90px)' }} />

      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
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
          <div style={{ marginTop: 10, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Create your account and start making an impact
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(17,24,39,0.85)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '36px 32px',
          backdropFilter: 'blur(20px)', boxShadow: '0 25px 60px rgba(0,0,0,0.4)'
        }}>

          {/* Role selector */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              I am joining as...
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {roles.map(r => (
                <button key={r.id} id={`reg-role-${r.id}`} type="button" onClick={() => setRole(r.id)} style={{
                  padding: '14px 8px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: `1.5px solid ${role === r.id ? '#f97316' : 'var(--border)'}`,
                  background: role === r.id ? 'var(--orange-glow)' : 'rgba(255,255,255,0.02)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s ease', textAlign: 'center'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{r.icon}</span>
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 700,
                    color: role === r.id ? 'var(--orange-light)' : 'var(--text-secondary)'
                  }}>{r.label}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister}>
            {/* Row 1 — Name + Org */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Your Name *</label>
                <input id="reg-name" type="text" value={form.name} onChange={update('name')}
                  placeholder="Harshal Patil" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div>
                <label style={labelStyle}>Organisation Name *</label>
                <input id="reg-org" type="text" value={form.orgName} onChange={update('orgName')}
                  placeholder="Sunrise Hostel" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email Address *</label>
              <input id="reg-email" type="email" value={form.email} onChange={update('email')}
                placeholder="you@organisation.com" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#f97316'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password *</label>
              <input id="reg-password" type="password" value={form.password} onChange={update('password')}
                placeholder="Min. 8 characters" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#f97316'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            {/* Location */}
            <div style={{ marginBottom: role === 'recipient' ? 14 : 24 }}>
              <label style={labelStyle}>Location / Area</label>
              <input id="reg-location" type="text" value={form.location} onChange={update('location')}
                placeholder="e.g. Pune, Maharashtra" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#f97316'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            {/* Capacity — only for recipients */}
            {role === 'recipient' && (
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Meal Capacity (portions you can accept per day)</label>
                <input id="reg-capacity" type="number" value={form.capacity} onChange={update('capacity')}
                  placeholder="e.g. 100" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#10b981'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                color: '#f87171', fontSize: '0.85rem', marginBottom: 16
              }}>⚠️ {error}</div>
            )}

            {/* Submit */}
            <button id="reg-submit" type="submit"
              className={role === 'recipient' ? 'btn-green' : 'btn-primary'}
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
              disabled={loading}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-slow 0.7s linear infinite',
                      display: 'inline-block' }} />
                    Creating account...
                  </span>
                : `→ Create ${roles.find(r => r.id === role)?.label} Account`}
            </button>
          </form>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--orange-light)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in here
            </Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = 'var(--orange)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
          >← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
