import { useState } from 'react'
import { Link } from 'react-router-dom'

/* ─── Mock Data ──────────────────────────────────────────────── */
const mockDonation = {
  id: 'D003', food: 'Cooked Meals', type: '🍛', qty: 80,
  donor: 'Sunrise Hostel', deadline: '7:30 PM today', location: 'Kothrud, Pune'
}

const mockMatches = [
  {
    rank: 1, id: 'R001', name: 'Asha Trust', type: 'NGO',
    distance: 1.2, capacity: 100, available: true,
    successRate: 98, emoji: '🏠',
    score: 94,
    factors: {
      capacity:    { score: 100, label: 'Full capacity' },
      distance:    { score: 92,  label: '1.2 km away' },
      availability:{ score: 100, label: 'Available now' },
      deadline:    { score: 88,  label: '45 min buffer' },
      pastSuccess: { score: 98,  label: '98% success rate' },
    },
    contact: '+91 98765 43210',
    address: 'Karve Nagar, Pune',
    color: '#10b981',
  },
  {
    rank: 2, id: 'R002', name: 'Hope Kitchen', type: 'Community Kitchen',
    distance: 2.1, capacity: 80, available: true,
    successRate: 94, emoji: '🍲',
    score: 81,
    factors: {
      capacity:    { score: 88,  label: 'Exact capacity' },
      distance:    { score: 78,  label: '2.1 km away' },
      availability:{ score: 100, label: 'Available now' },
      deadline:    { score: 72,  label: '30 min buffer' },
      pastSuccess: { score: 94,  label: '94% success rate' },
    },
    contact: '+91 87654 32109',
    address: 'Shivajinagar, Pune',
    color: '#3b82f6',
  },
  {
    rank: 3, id: 'R003', name: 'Green Hope NGO', type: 'NGO',
    distance: 3.4, capacity: 60, available: true,
    successRate: 89, emoji: '🌱',
    score: 67,
    factors: {
      capacity:    { score: 70,  label: 'Partial capacity (60/80)' },
      distance:    { score: 54,  label: '3.4 km away' },
      availability:{ score: 100, label: 'Available now' },
      deadline:    { score: 62,  label: '18 min buffer' },
      pastSuccess: { score: 89,  label: '89% success rate' },
    },
    contact: '+91 76543 21098',
    address: 'Bavdhan, Pune',
    color: '#a78bfa',
  },
]

const factorWeights = [
  { key: 'capacity',     label: 'Capacity',       weight: '30%', icon: '📦' },
  { key: 'distance',     label: 'Distance',        weight: '25%', icon: '📍' },
  { key: 'availability', label: 'Availability',    weight: '20%', icon: '🕐' },
  { key: 'deadline',     label: 'Deadline Fit',    weight: '15%', icon: '⏱️' },
  { key: 'pastSuccess',  label: 'Past Success',    weight: '10%', icon: '⭐' },
]

/* ─── Score Ring ─────────────────────────────────────────────── */
function ScoreRing({ score, color, size = 72 }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size === 72 ? 16 : 13} fontWeight={800}
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px`, fontFamily: 'Space Grotesk,sans-serif' }}>
        {score}
      </text>
    </svg>
  )
}

/* ─── Factor Bar ─────────────────────────────────────────────── */
function FactorBar({ label, icon, score, weight }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
          <span>{icon}</span> {label}
          <span style={{
            fontSize: '0.68rem', background: 'rgba(255,255,255,0.07)',
            padding: '1px 7px', borderRadius: 999, color: 'var(--text-muted)'
          }}>{weight}</span>
        </div>
        <span style={{ fontSize: '0.83rem', fontWeight: 700, color: score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171' }}>
          {score}/100
        </span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{
          width: `${score}%`, height: '100%', borderRadius: 4,
          background: score >= 80
            ? 'linear-gradient(90deg,#10b981,#34d399)'
            : score >= 60
              ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
              : 'linear-gradient(90deg,#ef4444,#f87171)',
          transition: 'width 1s ease'
        }} />
      </div>
    </div>
  )
}

/* ─── Match Card ─────────────────────────────────────────────── */
function MatchCard({ match, onAssign, assigned }) {
  const [expanded, setExpanded] = useState(match.rank === 1)
  const isTop = match.rank === 1

  const rankColors = { 1: '#f97316', 2: '#60a5fa', 3: '#a78bfa' }
  const rankLabels = { 1: '🥇 Best Match', 2: '🥈 2nd Match', 3: '🥉 3rd Match' }

  return (
    <div style={{
      background: isTop ? 'rgba(17,24,39,0.9)' : 'rgba(17,24,39,0.6)',
      border: `1.5px solid ${isTop ? match.color + '60' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      transition: 'all 0.3s ease',
      boxShadow: isTop ? `0 8px 32px ${match.color}18` : 'none',
      opacity: assigned && assigned !== match.id ? 0.5 : 1
    }}>
      {/* Top accent line for rank 1 */}
      {isTop && (
        <div style={{ height: 3, background: `linear-gradient(90deg, ${match.color}, #fbbf24)` }} />
      )}

      {/* Card header — always visible */}
      <div style={{ padding: '20px 22px', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>

          {/* Rank badge */}
          <div style={{
            minWidth: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: `${rankColors[match.rank]}18`,
            border: `1.5px solid ${rankColors[match.rank]}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.9rem', color: rankColors[match.rank],
            fontFamily: 'Space Grotesk,sans-serif'
          }}>#{match.rank}</div>

          {/* Org avatar */}
          <div style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            background: `${match.color}18`, border: `1.5px solid ${match.color}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem'
          }}>{match.emoji}</div>

          {/* Name + type */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{match.name}</span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 600, padding: '2px 9px', borderRadius: 999,
                background: `${match.color}15`, color: match.color, border: `1px solid ${match.color}30`
              }}>{match.type}</span>
              {isTop && (
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '2px 9px', borderRadius: 999,
                  background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)'
                }}>🏆 Recommended</span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 3 }}>
              📍 {match.address} · {match.distance} km · Cap: {match.capacity} meals
            </div>
          </div>

          {/* Score ring */}
          <ScoreRing score={match.score} color={match.color} />

          {/* Expand chevron */}
          <div style={{
            color: 'var(--text-muted)', fontSize: '1rem',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}>▼</div>
        </div>
      </div>

      {/* Expandable details */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '20px 22px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Factor breakdown */}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                📊 Why this match?
              </div>
              {factorWeights.map(f => (
                <FactorBar key={f.key} icon={f.icon} label={f.factors ? f.factors : f.label}
                  score={match.factors[f.key].score}
                  weight={f.weight}
                  label={f.label} />
              ))}
            </div>

            {/* Contact + Actions */}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                📞 Contact & Details
              </div>

              {[
                { icon: '📍', label: 'Address',      value: match.address },
                { icon: '📞', label: 'Contact',      value: match.contact },
                { icon: '📦', label: 'Capacity',     value: `${match.capacity} meals/day` },
                { icon: '⭐', label: 'Success Rate', value: `${match.successRate}%` },
              ].map(d => (
                <div key={d.label} style={{
                  display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start'
                }}>
                  <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{d.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 1 }}>{d.label}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{d.value}</div>
                  </div>
                </div>
              ))}

              {/* Factor label pills */}
              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.values(match.factors).map((f, i) => (
                  <span key={i} style={{
                    fontSize: '0.72rem', padding: '3px 10px', borderRadius: 999,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)'
                  }}>{f.label}</span>
                ))}
              </div>

              {/* Assign button */}
              <button
                id={`assign-${match.id}`}
                onClick={() => onAssign(match.id)}
                disabled={!!assigned}
                style={{
                  marginTop: 18, width: '100%',
                  padding: '12px', borderRadius: 'var(--radius-md)',
                  border: 'none', cursor: assigned ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit',
                  background: assigned === match.id
                    ? 'rgba(16,185,129,0.15)' : assigned
                      ? 'rgba(255,255,255,0.04)'
                      : `linear-gradient(135deg, ${match.color}, ${match.color}cc)`,
                  color: assigned === match.id ? '#34d399' : assigned ? 'var(--text-muted)' : '#fff',
                  border: assigned === match.id ? '1px solid rgba(16,185,129,0.4)' : 'none',
                  transition: 'all 0.2s'
                }}>
                {assigned === match.id ? '✅ Assigned — Awaiting Confirmation' : assigned ? 'Another match assigned' : `Assign ${match.name} →`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Mini Map Placeholder ───────────────────────────────────── */
function MapPlaceholder({ matches }) {
  return (
    <div style={{
      background: 'rgba(13,21,40,0.8)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative', height: 200
    }}>
      {/* Grid pattern = fake map */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(249,115,22,0.06) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(249,115,22,0.06) 1px, transparent 1px)`,
        backgroundSize: '30px 30px'
      }} />

      {/* Donor pin */}
      <div style={{ position: 'absolute', top: '40%', left: '35%', transform: 'translate(-50%,-50%)', zIndex: 2 }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,#f97316,#ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', boxShadow: '0 0 20px rgba(249,115,22,0.5)',
            border: '2px solid rgba(249,115,22,0.8)'
          }}>🏪</div>
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(249,115,22,0.9)', color: '#fff', fontSize: '0.6rem',
            fontWeight: 700, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', marginTop: 4
          }}>Sunrise Hostel</div>
        </div>
      </div>

      {/* Connection lines + recipient pins */}
      {[
        { top: '25%', left: '58%', color: '#10b981', name: 'Asha Trust', dist: '1.2km' },
        { top: '55%', left: '65%', color: '#3b82f6', name: 'Hope Kitchen', dist: '2.1km' },
        { top: '70%', left: '72%', color: '#a78bfa', name: 'Green Hope', dist: '3.4km' },
      ].map((p, i) => (
        <div key={i} style={{ position: 'absolute', top: p.top, left: p.left, transform: 'translate(-50%,-50%)', zIndex: 2 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: `${p.color}25`, border: `2px solid ${p.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', boxShadow: `0 0 12px ${p.color}40`
          }}>🏠</div>
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            background: `${p.color}cc`, color: '#fff', fontSize: '0.55rem',
            fontWeight: 700, padding: '2px 5px', borderRadius: 3, whiteSpace: 'nowrap', marginTop: 3
          }}>{p.name} · {p.dist}</div>
        </div>
      ))}

      {/* Label */}
      <div style={{
        position: 'absolute', bottom: 10, left: 12, fontSize: '0.72rem',
        color: 'var(--text-muted)', background: 'rgba(8,13,26,0.8)',
        padding: '4px 10px', borderRadius: 6
      }}>📍 Pune, Maharashtra · Leaflet map coming soon</div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function MatchingPage() {
  const [assigned, setAssigned] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  const handleAssign = (id) => {
    setAssigned(id)
  }

  const handleConfirm = () => {
    setConfirmed(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Topbar */}
      <div style={{
        padding: '16px 28px', borderBottom: '1px solid var(--border)',
        background: 'rgba(13,21,40,0.9)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 50
      }}>
        <Link to="/donor" style={{
          color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', gap: 6
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--orange)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >← Dashboard</Link>
        <span style={{ color: 'var(--border)' }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--orange-light)' }}>{mockDonation.id}</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Matching Results</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981',
            display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Engine active</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* Donation summary bar */}
        <div style={{
          background: 'rgba(17,24,39,0.8)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap'
        }}>
          <div style={{ fontSize: '2rem' }}>{mockDonation.type}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 3 }}>
              {mockDonation.food} · {mockDonation.qty} portions
            </div>
            <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
              From {mockDonation.donor} · {mockDonation.location} · Deadline: {mockDonation.deadline}
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 999, padding: '6px 16px'
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 600 }}>
              {mockMatches.length} recipients found
            </span>
          </div>
        </div>

        {/* Two-col layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

          {/* Left — match cards */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>
                  🎯 Top Recipient Matches
                </h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Ranked by AI scoring across 5 factors · Click to expand details
                </p>
              </div>
            </div>

            {/* Confirmed state */}
            {confirmed ? (
              <div style={{
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 'var(--radius-lg)', padding: '32px', textAlign: 'center', marginBottom: 24
              }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
                <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: '1.3rem', color: '#34d399', marginBottom: 8 }}>
                  Match Confirmed!
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
                  {mockMatches.find(m => m.id === assigned)?.name} has been notified and will confirm pickup shortly.
                </p>
                <Link to="/donor" className="btn-green" style={{ display: 'inline-flex' }}>
                  ← Back to Dashboard
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {mockMatches.map(m => (
                  <MatchCard key={m.id} match={m} onAssign={handleAssign} assigned={assigned} />
                ))}
              </div>
            )}

            {/* Confirm button */}
            {assigned && !confirmed && (
              <button id="confirm-match-btn" onClick={handleConfirm} className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: '1rem', marginTop: 20 }}>
                ✅ Confirm Assignment & Notify Recipient
              </button>
            )}
          </div>

          {/* Right — sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Map */}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>📍 Location Map</div>
              <MapPlaceholder matches={mockMatches} />
            </div>

            {/* Scoring legend */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '18px'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                🧮 Scoring Weights
              </div>
              {factorWeights.map(f => (
                <div key={f.key} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', gap: 8, fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                    <span>{f.icon}</span>{f.label}
                  </div>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, color: 'var(--orange-light)',
                    background: 'var(--orange-glow)', padding: '2px 8px', borderRadius: 999
                  }}>{f.weight}</span>
                </div>
              ))}
            </div>

            {/* Quick stats */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '18px'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                ⚡ Engine Stats
              </div>
              {[
                { label: 'Recipients scanned', value: '23', color: 'var(--text-primary)' },
                { label: 'Match time',          value: '1.4s', color: '#10b981' },
                { label: 'Eligible matches',    value: '3',    color: '#f97316' },
                { label: 'Algorithm',           value: 'Weighted Score', color: 'var(--text-secondary)' },
              ].map(s => (
                <div key={s.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '7px 0', borderBottom: '1px solid var(--border)',
                  fontSize: '0.83rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span style={{ fontWeight: 700, color: s.color, fontFamily: s.value.match(/\d/) ? 'monospace' : 'inherit' }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
