import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import ChatWidget from '../components/ChatWidget'
import { getDonations, createDonation, matchDonation } from '../api/donations.js'

/* ─── Current User ───────────────────────────────────────────── */
const currentUser = { id: 'U-D01', name: 'Harshal Patil', org: 'Sunrise Hostel', role: 'donor' }

const EMOJI_MAP = {
  'Cooked Meals': '🍛',
  'Rice & Dal': '🍚',
  'Baked Goods': '🥖',
  'Packaged Food': '📦',
  'Raw Produce': '🥬',
  'Beverages': '🥤',
  'Mixed / Other': '🍱'
}

/* ─── Countdown Timer ────────────────────────────────────────── */
function Countdown({ deadline }) {
  const [left, setLeft] = useState(() => Math.max(0, deadline - Date.now()))

  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, deadline - Date.now())), 1000)
    return () => clearInterval(t)
  }, [deadline])

  if (!deadline || isNaN(deadline)) {
    return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No deadline</span>
  }

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
    MATCHED:          { label: 'Matched',          color: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  dot: '#60a5fa' },
    ACCEPTED:         { label: 'Accepted',         color: '#a78bfa', bg: 'rgba(139,92,246,0.12)', dot: '#a78bfa' },
    RESCUE_TRIGGERED: { label: 'Rescue Active',    color: '#f87171', bg: 'rgba(239,68,68,0.12)',  dot: '#ef4444' },
    RESCUED:          { label: 'Rescued ✓',        color: '#34d399', bg: 'rgba(16,185,129,0.12)', dot: '#10b981' },
    FAILED:           { label: 'Failed',           color: '#94a3b8', bg: 'rgba(100,116,139,0.12)', dot: '#475569' },
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
function NewDonationModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    food_name: '',
    quantity: '',
    unit: 'portions',
    deadline: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [validationError, setValidationError] = useState(null)
  const [apiError, setApiError] = useState(null)
  const [outcome, setOutcome] = useState(null)

  const up = f => e => {
    setValidationError(null)
    setApiError(null)
    setForm(p => ({ ...p, [f]: e.target.value }))
  }

  const inputSt = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setValidationError(null)
    setApiError(null)

    if (!form.food_name) {
      setValidationError('Please select a food type.')
      return
    }

    const qty = parseInt(form.quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      setValidationError('Quantity must be a positive number.')
      return
    }

    if (!form.deadline) {
      setValidationError('Please specify a collection deadline.')
      return
    }

    const deadlineDate = new Date(form.deadline)
    if (isNaN(deadlineDate.getTime())) {
      setValidationError('Invalid collection deadline date.')
      return
    }

    if (deadlineDate.getTime() <= Date.now()) {
      setValidationError('Collection deadline must be in the future.')
      return
    }

    setSubmitting(true)

    let createdDonation = null
    try {
      const createRes = await createDonation({
        donor_id: currentUser.id,
        food_name: form.food_name,
        quantity: qty,
        unit: form.unit || 'portions',
        pickup_deadline: deadlineDate.toISOString(),
        latitude: 18.5074,
        longitude: 73.8077,
        notes: form.notes.trim() ? form.notes.trim() : null
      })
      createdDonation = createRes.donation
    } catch (err) {
      setSubmitting(false)
      setApiError(err.message || 'Failed to create donation')
      return
    }

    try {
      const matchRes = await matchDonation(createdDonation.id, { actor_id: currentUser.id })
      setOutcome({
        donation: matchRes.donation || createdDonation,
        recipient: matchRes.selected_recipient,
        noMatchReason: matchRes.no_match_reason,
        partialError: null
      })
    } catch (err) {
      setOutcome({
        donation: createdDonation,
        recipient: null,
        noMatchReason: null,
        partialError: err.message || 'Automatic matching could not be completed.'
      })
    } finally {
      setSubmitting(false)
      if (onSuccess) onSuccess()
    }
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
        {outcome ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>
              {outcome.partialError ? '⚠️' : outcome.recipient ? '✅' : '⏳'}
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: '1.4rem', marginBottom: 8 }}>
              {outcome.partialError
                ? 'Donation Logged (Matching Pending)'
                : outcome.recipient
                  ? 'Donation Logged & Matched!'
                  : 'Donation Logged!'}
            </h3>

            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '14px', margin: '16px 0',
              textAlign: 'left', fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Donation ID:</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--orange-light)', fontWeight: 700 }}>
                  {outcome.donation.id}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <StatusBadge status={outcome.donation.status} />
              </div>

              {outcome.recipient && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Matched Recipient:</span>
                  <span style={{ fontWeight: 600, color: '#60a5fa' }}>{outcome.recipient.name}</span>
                </div>
              )}

              {outcome.noMatchReason && (
                <div style={{ marginTop: 8, color: '#fbbf24', fontSize: '0.8rem' }}>
                  Notice: {outcome.noMatchReason}
                </div>
              )}

              {outcome.partialError && (
                <div style={{ marginTop: 8, color: '#f87171', fontSize: '0.8rem' }}>
                  Matching error: {outcome.partialError}
                </div>
              )}
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.85rem' }}>
              {outcome.recipient
                ? 'Rule-based matching complete. The recipient has been assigned.'
                : outcome.noMatchReason
                  ? 'Your donation is pending until an eligible recipient has available capacity.'
                  : 'Your donation has been registered and is stored in the database.'}
            </p>

            <button className="btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: '1.3rem', marginBottom: 4 }}>
                  Log New Donation
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Rule-based matching will find an eligible recipient
                </p>
              </div>
              <button onClick={onClose} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1
              }}>✕</button>
            </div>

            {validationError && (
              <div style={{
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16,
                color: '#f87171', fontSize: '0.85rem'
              }}>
                {validationError}
              </div>
            )}

            {apiError && (
              <div style={{
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16,
                color: '#f87171', fontSize: '0.85rem'
              }}>
                Server error: {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600,
                  color: 'var(--text-secondary)', marginBottom: 7 }}>Food Type *</label>
                <select id="donation-food" value={form.food_name} onChange={up('food_name')} required style={inputSt}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600,
                    color: 'var(--text-secondary)', marginBottom: 7 }}>Quantity *</label>
                  <input id="donation-qty" type="number" value={form.quantity} onChange={up('quantity')}
                    placeholder="e.g. 50" required min="1" step="1" style={inputSt}
                    onFocus={e => e.target.style.borderColor = '#f97316'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600,
                    color: 'var(--text-secondary)', marginBottom: 7 }}>Unit</label>
                  <select value={form.unit} onChange={up('unit')} style={inputSt}>
                    <option value="portions">portions</option>
                    <option value="meals">meals</option>
                    <option value="kg">kg</option>
                    <option value="boxes">boxes</option>
                  </select>
                </div>
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
                  placeholder="e.g. Packed in containers, veg only, pickup via gate 2..." rows={2}
                  style={{ ...inputSt, resize: 'none', lineHeight: 1.5 }}
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>

              <button id="donation-submit" type="submit" className="btn-primary"
                style={{ justifyContent: 'center', marginTop: 4 }} disabled={submitting}>
                {submitting
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
  const emoji = EMOJI_MAP[d.food_name] || '🍱'
  const deadlineMs = d.pickup_deadline ? new Date(d.pickup_deadline).getTime() : 0

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
          }}>{emoji}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{d.food_name}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {d.quantity} {d.unit || 'portions'} · ID: <span style={{ fontFamily: 'monospace', color: 'var(--orange-light)' }}>{d.id}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <StatusBadge status={d.status} />
          {deadlineMs > 0 && <Countdown deadline={deadlineMs} />}
        </div>
      </div>

      {/* Match / Rescue info */}
      {isRescue ? (
        <div>
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 12
          }}>
            <div style={{ fontSize: '0.82rem', color: '#f87171', fontWeight: 700, marginBottom: 4 }}>
              ⚠️ {d.matched_recipient_name || 'Assigned recipient'} pickup issue reported
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Rescue Recovery protocol active. Split distribution or backup coordinator handling.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to={`/rescue?donationId=${encodeURIComponent(d.id)}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px', borderRadius: 'var(--radius-sm)', textDecoration: 'none',
              background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
              color: '#fb923c', fontWeight: 700, fontSize: '0.85rem', marginTop: 4,
              transition: 'all 0.2s'
            }}>⚡ View Full Rescue Details →</Link>
          </div>
        </div>
      ) : d.status === 'MATCHED' ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 'var(--radius-sm)', padding: '12px 14px'
        }}>
          <span style={{ fontSize: '1.1rem' }}>🎯</span>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#60a5fa' }}>
              Matched with {d.matched_recipient_name || 'Recipient'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Awaiting pickup confirmation</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
            <Link to={`/matching?donationId=${encodeURIComponent(d.id)}`} style={{
              padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
              background: 'rgba(59,130,246,0.15)', color: '#60a5fa', textDecoration: 'none',
              fontWeight: 600, border: '1px solid rgba(59,130,246,0.3)'
            }}>View Matches</Link>
            <button id={`confirm-handover-${d.id}`} onClick={() => onHandover && onHandover(d)}
              className="btn-green" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              {d.handoverProof ? 'View Handover Proof' : 'Add Photo Proof'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 'var(--radius-sm)', padding: '12px 14px'
        }}>
          <span style={{ fontSize: '1.1rem' }}>⏳</span>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fbbf24' }}>
              Pending Match
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Eligible recipient candidates are being evaluated
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <Link to={`/matching?donationId=${encodeURIComponent(d.id)}`} style={{
              padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
              background: 'rgba(251,191,36,0.15)', color: '#fbbf24', textDecoration: 'none',
              fontWeight: 600, border: '1px solid rgba(251,191,36,0.3)'
            }}>View Matching Details</Link>
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
            <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{currentUser.org}</div>
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
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // Handover Photo Proof state from main
  const [handoverDonation, setHandoverDonation] = useState(null)
  const [handoverProof, setHandoverProof] = useState(null)
  const [proofError, setProofError] = useState('')

  const abortRef = useRef(null)

  const handleHandover = (donation) => {
    setHandoverDonation(donation)
    setHandoverProof(donation.handoverProof || null)
    setProofError('')
  }

  const selectHandoverProof = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setProofError('Choose an image file to document the handover.')
      event.target.value = ''
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setProofError('The photo must be 8 MB or smaller.')
      event.target.value = ''
      return
    }
    setProofError('')
    if (handoverProof?.url && handoverProof.url !== handoverDonation?.handoverProof?.url) {
      URL.revokeObjectURL(handoverProof.url)
    }
    setHandoverProof({ name: file.name, url: URL.createObjectURL(file) })
  }

  const closeHandover = () => {
    if (handoverProof?.url && handoverProof.url !== handoverDonation?.handoverProof?.url) {
      URL.revokeObjectURL(handoverProof.url)
    }
    setHandoverDonation(null)
    setHandoverProof(null)
    setProofError('')
  }

  const saveHandoverProof = () => {
    if (!handoverProof || !handoverDonation) {
      setProofError('Add a handover photo before saving.')
      return
    }
    // Attach photo proof to the donation in local state without changing status.
    // The recipient flow records the physical handover through the API.
    setDonations(prev => prev.map(d => d.id === handoverDonation.id
      ? { ...d, handoverProof }
      : d))
    setHandoverDonation(null)
    setHandoverProof(null)
    setProofError('')
  }

  const fetchDonations = useCallback(async (isManualRefresh = false) => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    if (isManualRefresh) {
      setRefreshing(true)
    }
    setError(null)

    try {
      const data = await getDonations({
        donorId: currentUser.id,
        signal: controller.signal
      })
      setDonations(data.items || [])
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || 'Failed to fetch donations.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()
    abortRef.current = controller

    getDonations({
      donorId: currentUser.id,
      signal: controller.signal
    })
      .then(data => {
        if (!ignore) {
          setDonations(data.items || [])
          setLoading(false)
        }
      })
      .catch(err => {
        if (!ignore && err.name !== 'AbortError') {
          setError(err.message || 'Failed to fetch donations.')
          setLoading(false)
        }
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [])

  // Split donations into Active vs Completed/History
  const activeDonations = donations.filter(d =>
    d.status === 'PENDING' || d.status === 'MATCHED' || d.status === 'RESCUE_TRIGGERED'
  )

  const historyDonations = donations.filter(d =>
    d.status === 'RESCUED' || d.status === 'FAILED' || d.status === 'ACCEPTED'
  )

  // Impact metrics
  const totalDonations = donations.length
  const rescuedDonations = donations.filter(d => d.status === 'RESCUED')

  // Unit-aware: Count only meal-based quantities (meals, portions)
  const MEAL_UNITS = new Set(['meals', 'portions', 'meal', 'portion'])
  const rescuedMeals = rescuedDonations
    .filter(d => !d.unit || MEAL_UNITS.has(String(d.unit).toLowerCase().trim()))
    .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0)

  // Non-meal rescued items breakdown (kg, boxes, etc.)
  const nonMealRescued = rescuedDonations
    .filter(d => d.unit && !MEAL_UNITS.has(String(d.unit).toLowerCase().trim()))
  const nonMealSummary = nonMealRescued.length > 0
    ? Object.entries(
        nonMealRescued.reduce((acc, d) => {
          const u = String(d.unit).toLowerCase().trim()
          acc[u] = (acc[u] || 0) + (Number(d.quantity) || 0)
          return acc
        }, {})
      ).map(([u, q]) => `+ ${q} ${u}`).join(', ')
    : null

  const rescuedCount = rescuedDonations.length
  const rescueRate = totalDonations > 0 ? Math.round((rescuedCount / totalDonations) * 100) : 0

  const uniqueRecipients = new Set(
    donations
      .map(d => d.matched_recipient_id)
      .filter(Boolean)
  ).size

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
              Good evening, {currentUser.name.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {activeDonations.some(d => d.status === 'RESCUE_TRIGGERED')
                ? '⚠️ You have active rescues in progress'
                : '✅ All donations are monitored'}
            </p>
          </div>
          <button id="new-donation-btn" className="btn-primary" onClick={() => setShowModal(true)}>
            + New Donation
          </button>
        </div>

        <div style={{ padding: '28px 32px' }}>

          {/* Impact Stats */}
          <div id="impact" style={{ marginBottom: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {[
                { icon: '🍱', value: totalDonations,  label: 'Total Donations',   color: '#f97316', suffix: '' },
                {
                  icon: '✅',
                  value: rescuedMeals,
                  label: 'Meals Rescued',
                  color: '#10b981',
                  suffix: '',
                  subtext: nonMealSummary ? `(${nonMealSummary})` : 'meals & portions'
                },
                { icon: '🎯', value: rescueRate,      label: 'Rescue Rate',       color: '#60a5fa', suffix: '%' },
                { icon: '🏠', value: uniqueRecipients, label: 'NGOs Helped',      color: '#a78bfa', suffix: '' },
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
                  {s.subtext && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      {s.subtext}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'right' }}>
              (computed from demo & live records)
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ color: '#f87171', fontSize: '0.9rem' }}>
                ⚠️ {error}
              </div>
              <button onClick={() => { setLoading(true); fetchDonations(false) }} style={{
                background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
                color: '#fca5a5', padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'
              }}>
                Retry
              </button>
            </div>
          )}

          {/* Active Donations */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: '1.1rem', fontWeight: 700 }}>
                🟢 Active Donations
                <span style={{
                  marginLeft: 10, background: 'rgba(249,115,22,0.15)', color: 'var(--orange-light)',
                  padding: '2px 10px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700
                }}>{activeDonations.length}</span>
              </h2>
              <button id="refresh-btn" onClick={() => fetchDonations(true)} disabled={refreshing || loading} style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)', padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem',
                display: 'inline-flex', alignItems: 'center', gap: 6
              }}>
                <span style={{
                  display: 'inline-block',
                  animation: refreshing ? 'spin-slow 0.8s linear infinite' : 'none'
                }}>↻</span>
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            {loading ? (
              <div style={{
                textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)',
                background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)'
              }}>
                <div style={{
                  width: 28, height: 28, border: '3px solid rgba(249,115,22,0.2)',
                  borderTopColor: 'var(--orange-primary)', borderRadius: '50%',
                  animation: 'spin-slow 0.8s linear infinite', margin: '0 auto 12px'
                }} />
                Loading donations…
              </div>
            ) : activeDonations.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)',
                background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>🍲</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  No active donations
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  Log your surplus food to start matching with community recipients.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activeDonations.map(d => (
                  <ActiveDonationCard key={d.id} d={d} onHandover={handleHandover} />
                ))}
              </div>
            )}
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
                display: 'grid', gridTemplateColumns: '120px 1fr 100px 1.2fr 110px 110px',
                padding: '12px 20px', borderBottom: '1px solid var(--border)',
                fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.06em'
              }}>
                <span>ID</span><span>Food</span><span>Qty</span><span>Recipient</span><span>Date</span><span>Status</span>
              </div>

              {historyDonations.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No completed donations in history yet.
                </div>
              ) : (
                historyDonations.map((h, i) => {
                  const dateStr = h.created_at
                    ? new Date(h.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    : '—'
                  return (
                    <div key={h.id} style={{
                      display: 'grid', gridTemplateColumns: '120px 1fr 100px 1.2fr 110px 110px',
                      padding: '14px 20px', borderBottom: i < historyDonations.length - 1 ? '1px solid var(--border)' : 'none',
                      fontSize: '0.875rem', alignItems: 'center',
                      transition: 'background 0.2s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--orange-light)' }}>{h.id}</span>
                      <span>{EMOJI_MAP[h.food_name] || '🍱'} {h.food_name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{h.quantity} {h.unit || ''}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{h.matched_recipient_name || '—'}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{dateStr}</span>
                      <div>
                        <StatusBadge status={h.status} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <NewDonationModal
          onClose={() => setShowModal(false)}
          onSuccess={() => fetchDonations(false)}
        />
      )}

      {/* Global Prototype Chat Widget from main */}
      <ChatWidget />

      {/* Handover Photo Proof Dialog from main */}
      {handoverDonation && (
        <div role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) closeHandover() }}
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', padding: 20,
            background: 'rgba(2,6,23,0.78)', backdropFilter: 'blur(8px)' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="handover-title"
            style={{ width: 'min(520px, 100%)', maxHeight: '90vh', overflow: 'auto', padding: 26,
              background: '#111827', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.45)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
              <div>
                <h2 id="handover-title" style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: '1.2rem', marginBottom: 6 }}>
                  📸 Handover photo proof
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {handoverDonation.id} · {handoverDonation.food_name} · {handoverDonation.quantity} {handoverDonation.unit || 'portions'}
                </p>
              </div>
              <button type="button" onClick={closeHandover} aria-label="Close photo proof dialog"
                style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-secondary)',
                  padding: '5px 10px', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ margin: '18px 0 12px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Attach a photo of the food handover. Physical handover confirmation will be recorded by the recipient via the API.
            </p>

            {handoverProof ? (
              <>
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 14 }}>
                  <img src={handoverProof.url} alt={`Handover proof for donation ${handoverDonation.id}`}
                    style={{ display: 'block', width: '100%', maxHeight: 260, objectFit: 'contain', background: '#080d18' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{handoverProof.name}</span>
                    <span style={{ color: '#34d399', fontWeight: 700, flexShrink: 0 }}>✓ Photo attached</span>
                  </div>
                </div>
                {!handoverDonation.handoverProof && (
                  <label htmlFor="handover-proof-file" style={{ display: 'inline-block', marginBottom: 14,
                    color: 'var(--orange-light)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                    Replace photo
                  </label>
                )}
              </>
            ) : (
              <label htmlFor="handover-proof-file" style={{ display: 'grid', placeItems: 'center', minHeight: 132, padding: 18,
                border: '1px dashed rgba(249,115,22,0.55)', borderRadius: 'var(--radius-md)', background: 'rgba(249,115,22,0.05)',
                color: 'var(--text-secondary)', textAlign: 'center', cursor: 'pointer', marginBottom: 14 }}>
                <span><strong style={{ color: 'var(--orange-light)' }}>Choose a photo</strong><br />JPG, PNG, or another image · up to 8 MB</span>
              </label>
            )}
            <input id="handover-proof-file" type="file" accept="image/*" onChange={selectHandoverProof}
              aria-describedby={proofError ? 'handover-proof-error' : undefined}
              style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }} />
            {proofError && <p id="handover-proof-error" role="alert" style={{ color: '#f87171', fontSize: '0.82rem', margin: '0 0 14px' }}>{proofError}</p>}

            {handoverDonation.handoverProof && !proofError && handoverProof?.url === handoverDonation.handoverProof.url ? (
              <button type="button" onClick={closeHandover} className="btn-green" style={{ width: '100%', justifyContent: 'center' }}>
                Done
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={closeHandover}
                  style={{ flex: 1, padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', font: 'inherit' }}>Cancel</button>
                <button type="button" onClick={saveHandoverProof} className="btn-green"
                  style={{ flex: 1, justifyContent: 'center' }}>Save Photo Proof</button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
