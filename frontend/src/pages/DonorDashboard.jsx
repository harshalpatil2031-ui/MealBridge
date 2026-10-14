import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

/* ─── Mock Data ──────────────────────────────────────────────── */
const mockUser = { name: 'Harshal Patil', org: 'Sunrise Hostel', role: 'donor' }

const mockActiveDonations = [
  {
    id: 'D001', food: 'Cooked Meals', type: '🍛', qty: 80, aiEstimate: 75,
    status: 'RESCUE_TRIGGERED', deadline: Date.now() + 47 * 60 * 1000,
    matched: 'City Shelter NGO', matchedFailed: true,
    rescue: { type: 'split', recipients: ['Asha Trust (50)', 'Hope Kitchen (30)'] },
    confidence: 'High'
  },
  {
    id: 'D002', food: 'Baked Goods', type: '🥖', qty: 40, aiEstimate: 35,
    status: 'MATCHED', deadline: Date.now() + 110 * 60 * 1000,
    matched: 'Green Hope NGO', matchedFailed: false,
    rescue: null, confidence: 'Medium'
  },
]

const mockHistory = [
  { id: 'D-098', food: '🍛 Rice & Dal',      qty: 60,  status: 'RESCUED', recipient: 'Asha Trust',     date: 'Oct 13' },
  { id: 'D-097', food: '🥖 Bread & Snacks',  qty: 25,  status: 'RESCUED', recipient: 'Hope Kitchen',   date: 'Oct 12' },
  { id: 'D-096', food: '🍲 Mixed Curry',     qty: 90,  status: 'FAILED',  recipient: '—',              date: 'Oct 11' },
  { id: 'D-095', food: '🍱 Lunch Boxes',     qty: 50,  status: 'RESCUED', recipient: 'City Shelter',   date: 'Oct 10' },
  { id: 'D-094', food: '🥗 Salad & Sides',   qty: 20,  status: 'RESCUED', recipient: 'Green Hope NGO', date: 'Oct 09' },
]

/* ─── Countdown Timer ────────────────────────────────────────── */
function Countdown({ deadline }) {
  const [left, setLeft] = useState(Math.max(0, deadline - Date.now()))
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, deadline - Date.now())), 1000)
    return () => clearInterval(t)
  }, [deadline])
  const m = Math.floor(left / 60000)
  const s = Math.floor((left % 60000) / 1000)
  const urgent = m < 30
  return (
    <span style={{ color: urgent ? '#ef4444' : '#f97316', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
      ⏱ {m}m {s.toString().padStart(2, '0')}s
    </span>
  )
}

/* ─── Status Badge ───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    PENDING:          { label: 'Pending',          color: '#fbbf24', bg: 'rgba(234,179,8,0.12)',   dot: '#fbbf24' },
    MATCHED:          { label: 'Matched',           color: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  dot: '#60a5fa' },
    ACCEPTED:         { label: 'Accepted',          color: '#a78bfa', bg: 'rgba(139,92,246,0.12)', dot: '#a78bfa' },
    RESCUE_TRIGGERED: { label: 'Rescue Active',     color: '#f87171', bg: 'rgba(239,68,68,0.12)',  dot: '#ef4444' },
    RESCUED:          { label: 'Rescued ✓',         color: '#34d399', bg: 'rgba(16,185,129,0.12)', dot: '#10b981' },
    FAILED:           { label: 'Failed',            color: '#94a3b8', bg: 'rgba(100,116,139,0.12)', dot: '#475569' },
  }
  const s = map[status] || map.PENDING
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 999,
      background: s.bg, color: s.color,
      fontSize: '0.75rem', fontWeight: 700
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </span>
  )
}

/* ─── New Donation Modal ─────────────────────────────────────── */
function NewDonationModal({ onClose }) {
  const [form, setForm] = useState({ food: '', qty: '', deadline: '', notes: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const up = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const inputSt = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#111827', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: '36px 32px',
        width: '100%', maxWidth: 480, boxShadow: '0 30px 70px rgba(0,0,0,0.6)'
      }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
            <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: '1.4rem', marginBottom: 10 }}>
              Donation Logged!
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
              Our AI is matching your donation with the best recipient. You'll be notified within 2 minutes.
            </p>
            <button className="btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div>
                <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: '1.3rem', marginBottom: 4 }}>
                  Log New Donation
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  AI will match you with the best recipient instantly
                </p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            {/* AI Prediction Banner */}
            <div style={{
              background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)',
              borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 22,
              display: 'flex', alignItems: 'center', gap: 12
            }}>
              <span style={{ fontSize: '1.4rem' }}>🤖</span>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--orange-light)' }}>
                  AI Surplus Estimate
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Based on your history: <strong style={{ color: 'var(--text-primary)' }}>~75 portions</strong> expected surplus today
                </div>
              </div>
              <div style={{
                marginLeft: 'auto', background: 'rgba(16,185,129,0.15)', color: '#34d399',
                padding: '3px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap'
              }}>High Confidence</div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600,
                  color: 'var(--text-secondary)', marginBottom: 7 }}>Food Type *</label>
                <select id="donation-food" value={form.food} onChange={up('food')} required style={inputSt}>
                  <option value="">Select food type...</option>
                  <option>Cooked Meals</option>
                  <option>Rice & Dal</option>
                  <option>Baked Goods</option>
                  <option>Packaged Food</option>
                  <option>Raw Produce</option>
                  <option>Beverages</option>
                  <option>Mixed / Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600,
                  color: 'var(--text-secondary)', marginBottom: 7 }}>Estimated Quantity (portions) *</label>
                <input id="donation-qty" type="number" value={form.qty} onChange={up('qty')}
                  placeholder="e.g. 80" required min="1" style={inputSt}
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600,
                  color: 'var(--text-secondary)', marginBottom: 7 }}>Collection Deadline *</label>
                <input id="donation-deadline" type="datetime-local" value={form.deadline} onChange={up('deadline')}
                  required style={inputSt}
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600,
                  color: 'var(--text-secondary)', marginBottom: 7 }}>Notes (optional)</label>
                <textarea id="donation-notes" value={form.notes} onChange={up('notes')}
                  placeholder="e.g. Packed in containers, veg only, stairs access..." rows={2}
                  style={{ ...inputSt, resize: 'none', lineHeight: 1.5 }}
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>

              <button id="donation-submit" type="submit" className="btn-primary"
                style={{ justifyContent: 'center', marginTop: 4 }} disabled={loading}>
                {loading
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                      <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-slow 0.7s linear infinite',
                        display: 'inline-block' }} />
                      Logging & Matching...
                    </span>
                  : '🍱 Log Donation & Find Match'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Active Donation Card ───────────────────────────────────── */
function ActiveDonationCard({ d, onHandover }) {
  const isRescue = d.status === 'RESCUE_TRIGGERED'
  return (
    <div style={{
      background: isRescue ? 'rgba(239,68,68,0.05)' : 'rgba(17,24,39,0.8)',
      border: `1px solid ${isRescue ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)', padding: '24px',
      transition: 'all 0.3s', position: 'relative', overflow: 'hidden'
    }}>
      {/* Rescue alert stripe */}
      {isRescue && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #ef4444, #f97316)'
        }} />
      )}

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14,
            background: isRescue ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem'
          }}>{d.type}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{d.food}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {d.qty} portions · ID: <span style={{ fontFamily: 'monospace', color: 'var(--orange-light)' }}>{d.id}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <StatusBadge status={d.status} />
          <Countdown deadline={d.deadline} />
        </div>
      </div>

      {/* AI Estimate bar */}
      <div style={{
        background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.15)',
        borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <span>🤖</span>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          AI Estimate: <strong style={{ color: 'var(--orange-light)' }}>~{d.aiEstimate} portions</strong>
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700,
          color: d.confidence === 'High' ? '#34d399' : '#fbbf24',
          background: d.confidence === 'High' ? 'rgba(16,185,129,0.12)' : 'rgba(234,179,8,0.12)',
          padding: '2px 10px', borderRadius: 999
        }}>{d.confidence} Confidence</span>
      </div>

      {/* Match / Rescue info */}
      {isRescue ? (
        <div>
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 12
          }}>
            <div style={{ fontSize: '0.82rem', color: '#f87171', fontWeight: 700, marginBottom: 4 }}>
              ⚠️ {d.matched} cancelled pickup
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Rescue Recovery Engine found a split donation solution
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.rescue.recipients.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 'var(--radius-sm)', padding: '10px 14px'
              }}>
                <span>🏠</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{r}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>Accepted ✓</span>
              </div>
            ))}
            <Link to="/rescue" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px', borderRadius: 'var(--radius-sm)', textDecoration: 'none',
              background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
              color: '#fb923c', fontWeight: 700, fontSize: '0.85rem', marginTop: 4,
              transition: 'all 0.2s'
            }}>⚡ View Full Rescue Details →</Link>
          </div>
        </div>
      ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 'var(--radius-sm)', padding: '12px 14px'
          }}>
            <span style={{ fontSize: '1.1rem' }}>🎯</span>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#60a5fa' }}>Matched with {d.matched}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Awaiting pickup confirmation</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <Link to="/matching" style={{
                padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
                background: 'rgba(59,130,246,0.15)', color: '#60a5fa', textDecoration: 'none',
                fontWeight: 600, border: '1px solid rgba(59,130,246,0.3)'
              }}>View Matches</Link>
              <button id={`confirm-handover-${d.id}`} onClick={() => onHandover(d.id)}
                className="btn-green" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                Confirm Handover
              </button>
            </div>
          </div>

      )}
    </div>
  )
}

/* ─── Sidebar ────────────────────────────────────────────────── */
function Sidebar({ active }) {
  const nav = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard',    href: '/donor' },
    { id: 'donate',    icon: '🍱', label: 'New Donation',  href: '#new' },
    { id: 'history',   icon: '📋', label: 'History',       href: '#history' },
    { id: 'analytics', icon: '📈', label: 'My Impact',     href: '#impact' },
  ]

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'rgba(13,21,40,0.95)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      position: 'sticky', top: 0
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#f97316,#ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
          }}>🍱</div>
          <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Meal<span className="gradient-text-orange">Bridge</span>
          </span>
        </Link>
      </div>

      {/* Role chip */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--orange-glow)', border: '1px solid rgba(249,115,22,0.2)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px'
        }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(249,115,22,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🍽️</div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{mockUser.org}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--orange-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Donor</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {nav.map(n => (
          <a key={n.id} href={n.href} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
            borderRadius: 'var(--radius-sm)', marginBottom: 4, textDecoration: 'none',
            background: active === n.id ? 'var(--orange-glow)' : 'transparent',
            color: active === n.id ? 'var(--orange-light)' : 'var(--text-secondary)',
            fontWeight: active === n.id ? 600 : 400, fontSize: '0.9rem',
            transition: 'all 0.2s', border: active === n.id ? '1px solid rgba(249,115,22,0.2)' : '1px solid transparent'
          }}
            onMouseEnter={e => { if (active !== n.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-primary)' }}}
            onMouseLeave={e => { if (active !== n.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}}
          >
            <span style={{ fontSize: '1.1rem' }}>{n.icon}</span>
            {n.label}
          </a>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <Link to="/login" style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
          borderRadius: 'var(--radius-sm)', textDecoration: 'none',
          color: 'var(--text-muted)', fontSize: '0.9rem', transition: 'all 0.2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
          onClick={() => localStorage.removeItem('mb_user')}
        >
          <span>🚪</span> Log Out
        </Link>
      </div>
    </aside>
  )
}

/* ─── Main Dashboard Page ────────────────────────────────────── */
export default function DonorDashboard() {
  const [showModal, setShowModal] = useState(false)
  const [donations, setDonations] = useState(mockActiveDonations)

  const handleHandover = (id) => {
    setDonations(prev => prev.map(d => d.id === id ? { ...d, status: 'RESCUED' } : d))
  }

  const totalMeals   = mockHistory.filter(h => h.status === 'RESCUED').reduce((a, h) => a + h.qty, 0)
  const rescueRate   = Math.round(mockHistory.filter(h => h.status === 'RESCUED').length / mockHistory.length * 100)
  const totalDonations = mockHistory.length + donations.length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      <Sidebar active="dashboard" />

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto' }}>

        {/* Top bar */}
        <div style={{
          padding: '20px 32px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(13,21,40,0.7)', backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: '1.3rem', fontWeight: 700, marginBottom: 2 }}>
              Good evening, {mockUser.name.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {donations.filter(d => d.status === 'RESCUE_TRIGGERED').length > 0
                ? '⚠️ You have active rescues in progress'
                : '✅ All donations are on track'}
            </p>
          </div>
          <button id="new-donation-btn" className="btn-primary" onClick={() => setShowModal(true)}>
            + New Donation
          </button>
        </div>

        <div style={{ padding: '28px 32px' }}>

          {/* Impact Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { icon: '🍱', value: totalDonations, label: 'Total Donations',   color: '#f97316', suffix: '' },
              { icon: '✅', value: totalMeals,     label: 'Meals Rescued',     color: '#10b981', suffix: '' },
              { icon: '🎯', value: rescueRate,     label: 'Rescue Rate',       color: '#60a5fa', suffix: '%' },
              { icon: '🏠', value: 4,              label: 'NGOs Helped',       color: '#a78bfa', suffix: '' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '20px',
                transition: 'all 0.25s ease'
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk,sans-serif', lineHeight: 1 }}>
                  {s.value}{s.suffix}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Active Donations */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: '1.1rem', fontWeight: 700 }}>
                🟢 Active Donations
                <span style={{
                  marginLeft: 10, background: 'rgba(249,115,22,0.15)', color: 'var(--orange-light)',
                  padding: '2px 10px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700
                }}>{donations.length}</span>
              </h2>
              <button id="refresh-btn" onClick={() => {}} style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)', padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem'
              }}>↻ Refresh</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {donations.map(d => (
                <ActiveDonationCard key={d.id} d={d} onHandover={handleHandover} />
              ))}
            </div>
          </div>

          {/* History Table */}
          <div id="history">
            <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: '1.1rem', fontWeight: 700, marginBottom: 18 }}>
              📋 Donation History
            </h2>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', overflow: 'hidden'
            }}>
              {/* Table head */}
              <div style={{
                display: 'grid', gridTemplateColumns: '80px 1fr 80px 1fr 110px 90px',
                padding: '12px 20px', borderBottom: '1px solid var(--border)',
                fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.06em'
              }}>
                <span>ID</span><span>Food</span><span>Qty</span><span>Recipient</span><span>Date</span><span>Status</span>
              </div>
              {mockHistory.map((h, i) => (
                <div key={h.id} style={{
                  display: 'grid', gridTemplateColumns: '80px 1fr 80px 1fr 110px 90px',
                  padding: '14px 20px', borderBottom: i < mockHistory.length - 1 ? '1px solid var(--border)' : 'none',
                  fontSize: '0.875rem', alignItems: 'center',
                  transition: 'background 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--orange-light)' }}>{h.id}</span>
                  <span>{h.food}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{h.qty}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{h.recipient}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{h.date}</span>
                  <StatusBadge status={h.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && <NewDonationModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
