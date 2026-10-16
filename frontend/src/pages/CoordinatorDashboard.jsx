import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout, { SectionHeading, StatusBadge, Toast } from '../components/DashboardLayout'
import ChatWidget from '../components/ChatWidget'
import { getDonations, getDonation } from '../api/donations.js'

const EMOJI_MAP = {
  'Cooked Meals': '🍛',
  'Rice & Dal': '🍚',
  'Baked Goods': '🥖',
  'Packaged Food': '📦',
  'Raw Produce': '🥬',
  'Beverages': '🥤',
  'Mixed / Other': '🍱',
}

function Countdown({ deadline }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!deadline) {
    return <span style={{ color: 'var(--text-muted)' }}>No deadline</span>
  }

  const target = new Date(deadline).getTime()
  if (isNaN(target)) {
    return <span style={{ color: 'var(--text-muted)' }}>Invalid date</span>
  }

  const diff = target - now
  if (diff <= 0) {
    return <span style={{ color: '#ef4444', fontWeight: 700 }}>⚠️ Expired</span>
  }

  const m = Math.floor(diff / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  const urgent = m < 30

  return (
    <span style={{ color: urgent ? '#ef4444' : '#f97316', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
      ⏱ {m}m {s.toString().padStart(2, '0')}s
    </span>
  )
}

export default function CoordinatorDashboard() {
  const [donations, setDonations] = useState([])
  const [rescueDetails, setRescueDetails] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [filter, setFilter] = useState('ALL')

  // Fetch all donations and details for rescue alerts
  const fetchAllData = async signal => {
    const res = await getDonations({ signal })
    const items = res.items || []

    // Fetch details for rescue triggered donations to get original recipient and reason
    const rescueItems = items.filter(d => d.status === 'RESCUE_TRIGGERED' || d.status === 'FAILED')
    const detailsMap = {}

    await Promise.all(
      rescueItems.map(async d => {
        try {
          const detail = await getDonation(d.id)
          if (detail?.rescue) {
            detailsMap[d.id] = detail.rescue
          }
        } catch {
          // Keep best-effort summary
        }
      })
    )

    return { items, detailsMap }
  }

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    fetchAllData(controller.signal)
      .then(data => {
        if (!ignore) {
          setDonations(data.items)
          setRescueDetails(data.detailsMap)
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

  const reload = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const data = await fetchAllData()
      setDonations(data.items)
      setRescueDetails(data.detailsMap)
      setToast({ type: 'success', text: 'Coordinator data refreshed from database.' })
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to refresh donations.')
      }
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [])

  // Derived real metrics from live records
  const totalDonations = donations.length
  const activeRescues = donations.filter(d => d.status === 'RESCUE_TRIGGERED')
  const failedDonations = donations.filter(d => d.status === 'FAILED')
  const completedDonations = donations.filter(d => d.status === 'RESCUED')
  const pendingMatching = donations.filter(d => d.status === 'PENDING')
  const matchedDonations = donations.filter(d => d.status === 'MATCHED')

  // Unit-aware rescued meals count
  const MEAL_UNITS = new Set(['meals', 'portions', 'meal', 'portion'])
  const rescuedMealsTotal = completedDonations
    .filter(d => !d.unit || MEAL_UNITS.has(String(d.unit).toLowerCase().trim()))
    .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0)

  // Filter donations for table
  const filteredDonations = donations.filter(d => {
    if (filter === 'NEEDS_ATTENTION') {
      return d.status === 'RESCUE_TRIGGERED' || d.status === 'FAILED' || d.status === 'PENDING'
    }
    if (filter === 'ACTIVE') {
      return d.status === 'MATCHED' || d.status === 'RESCUE_TRIGGERED'
    }
    if (filter === 'COMPLETED') {
      return d.status === 'RESCUED'
    }
    return true
  })

  // Alerts list combines RESCUE_TRIGGERED and FAILED
  const alertItems = [...activeRescues, ...failedDonations]

  return (
    <>
      <DashboardLayout
        title="Coordinator overview"
        subtitle="Live network monitoring, active rescue dispatch, and handover audit across MealBridge."
      >
        {/* Header Actions & Context */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                background: 'rgba(255,255,255,0.05)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              Demo Identity: <strong>U-C01 (Platform Coordinator)</strong>
            </span>
          </div>

          <button
            onClick={reload}
            disabled={refreshing || loading}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              padding: '7px 14px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                animation: refreshing ? 'spin-slow 0.8s linear infinite' : 'none',
              }}
            >
              ↻
            </span>
            {refreshing ? 'Refreshing…' : 'Refresh Operations'}
          </button>
        </div>

        {/* Live Derived Statistics */}
        <section className="stat-grid coordinator-stats">
          {[
            {
              icon: '🍱',
              label: 'Total donations',
              value: String(totalDonations),
              note: `${pendingMatching.length} pending match`,
              color: 'orange',
            },
            {
              icon: '⚡',
              label: 'Active rescues',
              value: String(activeRescues.length),
              note: activeRescues.length > 0 ? 'Recovery in progress' : 'No active rescues',
              color: activeRescues.length > 0 ? 'red' : 'green',
            },
            {
              icon: '🤝',
              label: 'In transit / matched',
              value: String(matchedDonations.length),
              note: 'Assigned to recipient',
              color: 'blue',
            },
            {
              icon: '🌟',
              label: 'Meals rescued',
              value: String(rescuedMealsTotal),
              note: `${completedDonations.length} completed rescues`,
              color: 'green',
            },
          ].map(stat => (
            <article className="glass-card stat-card" key={stat.label}>
              <div className="stat-top">
                <span>{stat.icon}</span>
                <span className="stat-note">{stat.note}</span>
              </div>
              <strong className={`stat-value ${stat.color}`}>{stat.value}</strong>
              <span className="stat-label">{stat.label}</span>
            </article>
          ))}
        </section>

        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8, marginBottom: 28 }}>
          ℹ️ Real metrics derived from live SQLite database. Seeded records are illustrative demo fixtures.
        </p>

        {/* Error State */}
        {error && (
          <div
            className="glass-card"
            style={{
              padding: '14px 18px',
              marginBottom: 24,
              borderColor: 'rgba(239,68,68,0.4)',
              background: 'rgba(239,68,68,0.08)',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>⚠️ {error}</span>
            <button
              onClick={reload}
              style={{
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.4)',
                color: '#fee2e2',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Section 1: Rescue Alerts (Needs Attention) */}
        <section className="dashboard-section">
          <SectionHeading
            eyebrow="NEEDS ATTENTION"
            title="Rescue & Failure Alerts"
            detail={
              alertItems.length > 0
                ? `${alertItems.length} donation${alertItems.length === 1 ? '' : 's'} require active monitoring or split recovery.`
                : 'All donations proceeding without critical interruption.'
            }
          />

          {loading ? (
            <div className="glass-card skeleton-card" style={{ height: 120 }}>
              <span />
              <span />
              <span />
            </div>
          ) : alertItems.length > 0 ? (
            <div className="rescue-grid">
              {alertItems.map(item => {
                const isRescue = item.status === 'RESCUE_TRIGGERED'
                const rescue = rescueDetails[item.id]
                const originalOrg = rescue?.original_recipient_name || item.matched_recipient_name || 'Assigned recipient'
                const reason = rescue?.reason || 'Original pickup declined'

                return (
                  <article
                    className="glass-card rescue-card"
                    key={item.id}
                    style={{
                      borderColor: isRescue ? 'rgba(239,68,68,0.35)' : 'rgba(100,116,139,0.35)',
                    }}
                  >
                    <div className="rescue-alert-title">
                      <span>{isRescue ? '⚠️' : '❌'}</span>
                      <strong>
                        {isRescue ? 'Pickup Failed — Rescue Triggered' : 'Donation Recovery Infeasible / Failed'}
                      </strong>
                      {isRescue && <span className="rescue-pulse" />}
                    </div>

                    <div className="rescue-details">
                      <div>
                        <span>DONATION</span>
                        <strong>{item.donor_name || 'Donor'}</strong>
                        <small>
                          {EMOJI_MAP[item.food_name] || '🍱'} {item.food_name} · {item.quantity} {item.unit || 'portions'}
                        </small>
                      </div>

                      <div>
                        <span>DEADLINE</span>
                        <Countdown deadline={item.pickup_deadline} />
                      </div>
                    </div>

                    <div className="rescue-meta">
                      <span>Original recipient</span>
                      <strong>{originalOrg}</strong>
                    </div>

                    <div className="rescue-meta" style={{ borderTop: 'none', paddingTop: 0 }}>
                      <span>Reported reason</span>
                      <small style={{ color: 'var(--text-secondary)' }}>{reason}</small>
                    </div>

                    <div className="rescue-footer">
                      <span className="engine-status">
                        <i /> Status: <strong>{item.status.replaceAll('_', ' ')}</strong>
                      </span>
                      <Link
                        to={`/rescue?donationId=${encodeURIComponent(item.id)}`}
                        className="btn-primary compact-btn"
                        style={{ textDecoration: 'none' }}
                      >
                        Open Rescue Screen →
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="glass-card empty-state" style={{ padding: '24px' }}>
              <span>✅</span>
              <h3>No Active Rescue Alerts</h3>
              <p>When a recipient declines a pickup, recovery alerts will appear here immediately.</p>
            </div>
          )}
        </section>

        {/* Section 2: All Operations Table */}
        <section className="dashboard-section" style={{ marginBottom: 40 }}>
          <SectionHeading
            eyebrow="LIVE OPERATIONS"
            title="All Network Donations"
            detail="Auditable status, matched partners, and direct dispatch links."
            action={
              <Link to="/analytics" className="btn-secondary compact-btn">
                View analytics →
              </Link>
            }
          />

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `All (${donations.length})` },
              { id: 'NEEDS_ATTENTION', label: `Needs Attention (${alertItems.length + pendingMatching.length})` },
              { id: 'ACTIVE', label: `Active (${matchedDonations.length + activeRescues.length})` },
              { id: 'COMPLETED', label: `Rescued (${completedDonations.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  background: filter === tab.id ? 'var(--orange-glow)' : 'rgba(255,255,255,0.03)',
                  color: filter === tab.id ? 'var(--orange-light)' : 'var(--text-secondary)',
                  border: filter === tab.id ? '1px solid rgba(249,115,22,0.3)' : '1px solid var(--border)',
                  borderRadius: 999,
                  padding: '5px 12px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="table-scroll glass-card">
            <table className="operations-table">
              <thead>
                <tr>
                  <th>DONOR & ID</th>
                  <th>FOOD TYPE</th>
                  <th>QTY</th>
                  <th>STATUS</th>
                  <th>MATCHED RECIPIENT</th>
                  <th>DEADLINE</th>
                  <th>DISPATCH ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      Loading donation records from database…
                    </td>
                  </tr>
                ) : filteredDonations.length > 0 ? (
                  filteredDonations.map(row => {
                    const isRescue = row.status === 'RESCUE_TRIGGERED'
                    const isPending = row.status === 'PENDING'

                    return (
                      <tr
                        key={row.id}
                        style={{
                          background: isRescue
                            ? 'rgba(239,68,68,0.04)'
                            : row.status === 'FAILED'
                              ? 'rgba(100,116,139,0.04)'
                              : 'transparent',
                        }}
                      >
                        <td>
                          <strong>{row.donor_name || 'Donor'}</strong>
                          <small>{row.id}</small>
                        </td>

                        <td>
                          <span>
                            {EMOJI_MAP[row.food_name] || '🍱'} {row.food_name}
                          </span>
                        </td>

                        <td>
                          <strong>{row.quantity}</strong> {row.unit || 'portions'}
                        </td>

                        <td>
                          <StatusBadge status={row.status} />
                        </td>

                        <td>
                          {row.matched_recipient_name ? (
                            <span>{row.matched_recipient_name}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Awaiting assignment
                            </span>
                          )}
                        </td>

                        <td>
                          <Countdown deadline={row.pickup_deadline} />
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {isPending && (
                              <Link
                                to={`/matching?donationId=${encodeURIComponent(row.id)}`}
                                className="table-action"
                                style={{ fontWeight: 700 }}
                              >
                                Match ↗
                              </Link>
                            )}

                            {isRescue && (
                              <Link
                                to={`/rescue?donationId=${encodeURIComponent(row.id)}`}
                                className="table-action"
                                style={{ color: '#f87171', fontWeight: 700 }}
                              >
                                Rescue ↗
                              </Link>
                            )}

                            {row.status === 'MATCHED' && (
                              <Link
                                to={`/matching?donationId=${encodeURIComponent(row.id)}`}
                                className="table-action"
                              >
                                Match ↗
                              </Link>
                            )}

                            <Link to={`/donation/${row.id}`} className="table-action">
                              Details ↗
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No donations match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <Toast message={toast} onClose={() => setToast(null)} />
      </DashboardLayout>
      <ChatWidget />
    </>
  )
}
