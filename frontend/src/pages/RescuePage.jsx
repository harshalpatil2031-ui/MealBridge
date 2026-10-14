import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/* ─── Mock Data ──────────────────────────────────────────────── */
const mockDonation = {
  id: 'D001', food: 'Cooked Meals', type: '🍛', qty: 80,
  donor: 'Sunrise Hostel', location: 'Kothrud, Pune',
  deadline: Date.now() + 47 * 60 * 1000,
  originalRecipient: 'City Shelter NGO',
  failedAt: '6:45 PM',
  failReason: 'Recipient declined — vehicle unavailable',
}

const recoverySteps = [
  { id: 1, time: '6:00 PM', label: 'Donation Logged',      detail: 'Sunrise Hostel logged 80 meals',                  status: 'done',    icon: '🍱' },
  { id: 2, time: '6:02 PM', label: 'Match Found',           detail: 'Matched with City Shelter NGO · Score: 91',       status: 'done',    icon: '🎯' },
  { id: 3, time: '6:45 PM', label: 'Pickup Failed',         detail: 'City Shelter declined — vehicle unavailable',     status: 'failed',  icon: '❌' },
  { id: 4, time: '6:46 PM', label: 'Rescue Triggered',      detail: 'Engine scanning 23 nearby recipients…',           status: 'active',  icon: '⚡' },
  { id: 5, time: '6:48 PM', label: 'Split Donation Found',  detail: 'Asha Trust (50) + Hope Kitchen (30)',              status: 'pending', icon: '✂️' },
  { id: 6, time: '7:15 PM', label: 'Handover Confirmed',    detail: 'Both pickups confirmed. 80 meals rescued.',        status: 'pending', icon: '✅' },
]

const splitRecipients = [
  {
    id: 'R001', name: 'Asha Trust', emoji: '🏠', portion: 50, total: 80,
    distance: '1.2 km', contact: '+91 98765 43210', color: '#10b981',
    status: 'ACCEPTED', score: 94, address: 'Karve Nagar, Pune'
  },
  {
    id: 'R002', name: 'Hope Kitchen', emoji: '🍲', portion: 30, total: 80,
    distance: '2.1 km', contact: '+91 87654 32109', color: '#3b82f6',
    status: 'ACCEPTED', score: 81, address: 'Shivajinagar, Pune'
  },
]

/* ─── Countdown ──────────────────────────────────────────────── */
function Countdown({ deadline }) {
  const [left, setLeft] = useState(Math.max(0, deadline - Date.now()))
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, deadline - Date.now())), 1000)
    return () => clearInterval(t)
  }, [deadline])
  const m = Math.floor(left / 60000)
  const s = Math.floor((left % 60000) / 1000)
  const pct = Math.max(0, Math.min(100, (left / (90 * 60 * 1000)) * 100))
  const urgent = m < 20
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>⏱ Time to deadline</span>
        <span style={{
          fontWeight: 800, fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums',
          color: urgent ? '#ef4444' : '#f97316',
          fontFamily: 'Space Grotesk, sans-serif'
        }}>{m}m {s.toString().padStart(2, '0')}s</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 6,
          background: urgent
            ? 'linear-gradient(90deg, #ef4444, #f87171)'
            : 'linear-gradient(90deg, #f97316, #fbbf24)',
          transition: 'width 1s linear, background 1s'
        }} />
      </div>
    </div>
  )
}

/* ─── Timeline Step ──────────────────────────────────────────── */
function TimelineStep({ step, isLast, animate }) {
  const colors = {
    done:    { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)',  dot: '#10b981', text: '#34d399' },
    failed:  { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)',   dot: '#ef4444', text: '#f87171' },
    active:  { bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.35)',  dot: '#f97316', text: '#fb923c' },
    pending: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', dot: '#334155', text: '#475569' },
  }
  const c = colors[step.status]

  return (
    <div style={{ display: 'flex', gap: 16, opacity: animate ? 1 : 0.35, transition: 'opacity 0.5s' }}>
      {/* Dot + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: c.bg, border: `2px solid ${c.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', flexShrink: 0,
          boxShadow: step.status === 'active' ? `0 0 16px ${c.dot}60` : 'none',
          animation: step.status === 'active' ? 'pulse-glow 2s infinite' : 'none'
        }}>{step.icon}</div>
        {!isLast && (
          <div style={{
            width: 2, flex: 1, minHeight: 32, marginTop: 4,
            background: step.status === 'done'
              ? 'linear-gradient(180deg, #10b981, rgba(16,185,129,0.2))'
              : 'rgba(255,255,255,0.06)'
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ paddingBottom: isLast ? 0 : 28, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{step.label}</span>
          <span style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 999,
            background: c.bg, color: c.text, border: `1px solid ${c.border}`
          }}>
            {step.status === 'done' ? '✓ Complete' : step.status === 'failed' ? '✕ Failed' : step.status === 'active' ? '● Live' : '○ Pending'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{step.time}</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step.detail}</p>
      </div>
    </div>
  )
}

/* ─── Split Recipient Card ───────────────────────────────────── */
function SplitCard({ r, onConfirm, confirmed }) {
  const pct = Math.round((r.portion / r.total) * 100)
  return (
    <div style={{
      background: confirmed ? 'rgba(16,185,129,0.07)' : 'rgba(17,24,39,0.8)',
      border: `1.5px solid ${confirmed ? 'rgba(16,185,129,0.4)' : r.color + '35'}`,
      borderRadius: 'var(--radius-lg)', padding: '22px',
      transition: 'all 0.4s ease',
      boxShadow: confirmed ? '0 8px 30px rgba(16,185,129,0.12)' : 'none'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: `${r.color}18`, border: `1.5px solid ${r.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
        }}>{r.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 3 }}>{r.name}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            📍 {r.address} · {r.distance}
          </div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700,
          background: 'rgba(16,185,129,0.12)', color: '#34d399',
          border: '1px solid rgba(16,185,129,0.3)'
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          {r.status}
        </div>
      </div>

      {/* Portion bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assigned portion</span>
          <span style={{ fontWeight: 800, color: r.color, fontSize: '1rem', fontFamily: 'Space Grotesk,sans-serif' }}>
            {r.portion} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/ {r.total} meals</span>
          </span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 6,
            background: `linear-gradient(90deg, ${r.color}, ${r.color}bb)`,
            transition: 'width 1s ease'
          }} />
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 5 }}>
          {pct}% of total donation · Match score: {r.score}/100
        </div>
      </div>

      {/* Contact */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16,
        fontSize: '0.82rem', color: 'var(--text-secondary)',
        display: 'flex', gap: 16
      }}>
        <span>📞 {r.contact}</span>
      </div>

      {/* Confirm button */}
      {confirmed ? (
        <div style={{
          textAlign: 'center', padding: '12px', borderRadius: 'var(--radius-md)',
          background: 'rgba(16,185,129,0.15)', color: '#34d399',
          fontWeight: 700, fontSize: '0.9rem', border: '1px solid rgba(16,185,129,0.3)'
        }}>✅ Handover Confirmed</div>
      ) : (
        <button id={`confirm-${r.id}`} onClick={() => onConfirm(r.id)}
          className="btn-green" style={{ width: '100%', justifyContent: 'center' }}>
          Confirm Handover with {r.name}
        </button>
      )}
    </div>
  )
}

/* ─── Engine Stats Bar ───────────────────────────────────────── */
function EngineStats() {
  const stats = [
    { label: 'Recipients Scanned', value: '23', icon: '🔍' },
    { label: 'Engine Runtime',     value: '1.8s', icon: '⚡' },
    { label: 'Algorithm',          value: 'Split+Match', icon: '🧮' },
    { label: 'Recovery Type',      value: 'Split (2-way)', icon: '✂️' },
  ]
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28
    }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)',
          borderRadius: 'var(--radius-md)', padding: '14px 16px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.2rem', marginBottom: 6 }}>{s.icon}</div>
          <div style={{
            fontWeight: 800, fontSize: '0.95rem', color: '#fb923c',
            fontFamily: 'Space Grotesk,sans-serif', marginBottom: 4
          }}>{s.value}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function RescuePage() {
  const [activeStep, setActiveStep] = useState(4) // 1-indexed, currently at "Rescue Triggered"
  const [confirmed, setConfirmed] = useState({})
  const [fullyRescued, setFullyRescued] = useState(false)

  const handleConfirm = (id) => {
    const updated = { ...confirmed, [id]: true }
    setConfirmed(updated)
    if (Object.keys(updated).length === splitRecipients.length) {
      setActiveStep(6)
      setTimeout(() => setFullyRescued(true), 600)
    }
  }

  // Simulate engine progress
  useEffect(() => {
    if (activeStep < 5) {
      const t = setTimeout(() => setActiveStep(5), 2000)
      return () => clearTimeout(t)
    }
  }, [activeStep])

  const allConfirmed = splitRecipients.every(r => confirmed[r.id])

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>

      {/* Topbar */}
      <div style={{
        padding: '16px 28px', borderBottom: '1px solid var(--border)',
        background: 'rgba(13,21,40,0.95)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', gap: 14,
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <Link to="/donor" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem',
          transition: 'color 0.2s'
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--orange)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >← Dashboard</Link>
        <span style={{ color: 'var(--border)' }}>|</span>

        {/* Rescue badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: fullyRescued ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${fullyRescued ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
          borderRadius: 999, padding: '5px 14px'
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
            background: fullyRescued ? '#10b981' : '#ef4444',
            boxShadow: `0 0 8px ${fullyRescued ? '#10b981' : '#ef4444'}`,
            animation: fullyRescued ? 'none' : 'pulse-glow 1.5s infinite'
          }} />
          <span style={{
            fontSize: '0.82rem', fontWeight: 700,
            color: fullyRescued ? '#34d399' : '#f87171'
          }}>
            {fullyRescued ? '🟢 RESCUED' : '🔴 RESCUE IN PROGRESS'}
          </span>
        </div>

        <div style={{ marginLeft: 'auto', minWidth: 220 }}>
          <Countdown deadline={mockDonation.deadline} />
        </div>
      </div>

      {/* Fully rescued banner */}
      {fullyRescued && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
          border: '1px solid rgba(16,185,129,0.35)',
          borderRadius: 0, padding: '18px 32px',
          display: 'flex', alignItems: 'center', gap: 16
        }}>
          <span style={{ fontSize: '2rem' }}>🎉</span>
          <div>
            <div style={{ fontWeight: 800, color: '#34d399', fontSize: '1.1rem', fontFamily: 'Space Grotesk,sans-serif' }}>
              80 meals successfully rescued!
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Split between Asha Trust (50) and Hope Kitchen (30). Handovers confirmed by both parties.
            </div>
          </div>
          <Link to="/donor" className="btn-green" style={{ marginLeft: 'auto', padding: '10px 20px', fontSize: '0.88rem' }}>
            Back to Dashboard
          </Link>
        </div>
      )}

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 999, padding: '5px 14px'
            }}>
              <span style={{ fontSize: '0.8rem' }}>⚠️</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171' }}>
                Original pickup failed — {mockDonation.failedAt}
              </span>
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {mockDonation.failReason}
            </span>
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 900, marginBottom: 6 }}>
            ⚡ Rescue Recovery Engine
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Donation <span style={{ fontFamily: 'monospace', color: '#fb923c' }}>{mockDonation.id}</span> · {mockDonation.food} · {mockDonation.qty} portions · {mockDonation.donor}
          </p>
        </div>

        {/* Engine Stats */}
        <EngineStats />

        {/* Two-col layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 28, alignItems: 'start' }}>

          {/* Left — Timeline */}
          <div style={{
            background: 'rgba(17,24,39,0.7)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '24px', position: 'sticky', top: 90
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
              📋 Rescue Timeline
            </div>
            {recoverySteps.map((step, i) => (
              <TimelineStep
                key={step.id}
                step={step}
                isLast={i === recoverySteps.length - 1}
                animate={step.id <= activeStep}
              />
            ))}
          </div>

          {/* Right — Split + Actions */}
          <div>
            {/* Failure card */}
            <div style={{
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 24
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                }}>🏚️</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.9rem' }}>
                    {mockDonation.originalRecipient} — Cancelled
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {mockDonation.failReason} · {mockDonation.failedAt}
                  </div>
                </div>
                <div style={{
                  marginLeft: 'auto', padding: '4px 12px', borderRadius: 999,
                  background: 'rgba(239,68,68,0.15)', color: '#f87171',
                  fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(239,68,68,0.3)'
                }}>FAILED</div>
              </div>
            </div>

            {/* Recovery solution header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
                borderRadius: 999, padding: '6px 16px'
              }}>
                <span style={{ fontSize: '0.9rem' }}>✂️</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fb923c' }}>
                  Recovery: Split Donation (2-way)
                </span>
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                No single recipient had capacity for all 80 meals
              </span>
            </div>

            {/* Portion visualization */}
            <div style={{
              background: 'rgba(17,24,39,0.8)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 20
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 600 }}>
                Total: <strong style={{ color: 'var(--text-primary)' }}>80 meals</strong> split across 2 recipients
              </div>
              <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 28 }}>
                <div style={{
                  width: `${(50/80)*100}%`, background: 'linear-gradient(90deg,#10b981,#34d399)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: '#fff'
                }}>Asha Trust · 50</div>
                <div style={{
                  width: `${(30/80)*100}%`, background: 'linear-gradient(90deg,#3b82f6,#60a5fa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: '#fff'
                }}>Hope Kitchen · 30</div>
              </div>
            </div>

            {/* Split cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {splitRecipients.map(r => (
                <SplitCard key={r.id} r={r} onConfirm={handleConfirm} confirmed={!!confirmed[r.id]} />
              ))}
            </div>

            {/* All confirmed message */}
            {allConfirmed && !fullyRescued && (
              <div style={{
                marginTop: 20, padding: '16px 20px', textAlign: 'center',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🎉</div>
                <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>
                  All handovers confirmed! Marking as RESCUED…
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
