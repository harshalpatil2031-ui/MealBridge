import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout, { SectionHeading, StatusBadge, Toast } from '../components/DashboardLayout'
import ChatWidget from '../components/ChatWidget'
import {
  getDonations,
  getDonation,
  acceptDonation,
  confirmHandover,
} from '../api/donations.js'
import { getCurrentUser } from '../api/session.js'

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

function SkeletonCard() {
  return (
    <div className="glass-card skeleton-card" aria-label="Loading available donations">
      <span />
      <span />
      <span />
    </div>
  )
}

export default function RecipientDashboard() {
  const currentUser = getCurrentUser()
  const selectedRecipientId = currentUser?.id
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [actionInProgress, setActionInProgress] = useState(null)

  // Categorized items
  const [offeredItems, setOfferedItems] = useState([])
  const [acceptedItems, setAcceptedItems] = useState([])
  const [completedItems, setCompletedItems] = useState([])

  const currentRecipient = currentUser || { name: 'Recipient', organization: 'Your organization', organization_type: 'NGO', location: 'Location not set', capacity: 0 }

  // Fetch and categorize donations for a given recipient
  const fetchRecipientData = async (recipientId, signal) => {
    const res = await getDonations({ signal })
    const allDonations = res.items || []

    const activeOrRecent = allDonations.filter(d =>
      d.status === 'MATCHED' || d.status === 'RESCUE_TRIGGERED' || d.status === 'RESCUED'
    )

    const detailsList = await Promise.all(
      activeOrRecent.map(async d => {
        try {
          return await getDonation(d.id, { signal })
        } catch {
          return null
        }
      })
    )

    const offered = []
    const accepted = []
    const completed = []

    detailsList.filter(Boolean).forEach(({ donation, events, splits }) => {
      const donationDeadline = donation.pickup_deadline
      const isPastDeadline = donationDeadline ? new Date(donationDeadline).getTime() <= Date.now() : false
      const hasAnyAcceptance = donation.recipient_accepted || (events || []).some(e => e.event_type === 'RECIPIENT_ACCEPTED')
      const eligibleOpenOffer = donation.status === 'MATCHED'
        && !hasAnyAcceptance
        && Number(currentRecipient.capacity) >= Number(donation.quantity)

      // 1. Direct standard match
      if (donation.matched_recipient_id === recipientId) {
        const hasAcceptedEvent = (events || []).some(
          e => e.event_type === 'RECIPIENT_ACCEPTED' && e.metadata?.recipient_id === recipientId
        )
        const hasHandoverEvent = (events || []).some(
          e => e.event_type === 'HANDOVER_CONFIRMED' && e.metadata?.recipient_id === recipientId
        )

        if (donation.status === 'RESCUED' || hasHandoverEvent) {
          completed.push({
            key: `${donation.id}-direct`,
            donation,
            split: null,
            assignedQuantity: donation.quantity,
            unit: donation.unit,
            isSplit: false,
            deadline: donationDeadline,
            isPastDeadline,
          })
        } else if (donation.status === 'MATCHED') {
          if (hasAcceptedEvent) {
            accepted.push({
              key: `${donation.id}-direct`,
              donation,
              split: null,
              assignedQuantity: donation.quantity,
              unit: donation.unit,
              isSplit: false,
              deadline: donationDeadline,
              isPastDeadline,
            })
          } else {
            offered.push({
              key: `${donation.id}-direct`,
              donation,
              split: null,
              assignedQuantity: donation.quantity,
              unit: donation.unit,
              isSplit: false,
              deadline: donationDeadline,
              isPastDeadline,
            })
          }
        }
      } else if (eligibleOpenOffer) {
        offered.push({
          key: `${donation.id}-open-offer`,
          donation,
          split: null,
          assignedQuantity: donation.quantity,
          unit: donation.unit,
          isSplit: false,
          deadline: donationDeadline,
          isPastDeadline,
        })
      }

      // 2. Rescue splits assigned to this recipient
      if (Array.isArray(splits) && splits.length > 0) {
        splits
          .filter(s => s.recipient_id === recipientId)
          .forEach(split => {
            const item = {
              key: `${donation.id}-${split.id}`,
              donation,
              split,
              assignedQuantity: split.quantity,
              unit: donation.unit,
              isSplit: true,
              deadline: donationDeadline,
              isPastDeadline,
            }

            if (split.status === 'HANDED_OVER' || donation.status === 'RESCUED') {
              completed.push(item)
            } else if (split.status === 'ACCEPTED') {
              accepted.push(item)
            } else if (split.status === 'PROPOSED') {
              offered.push(item)
            }
          })
      }
    })

    return { offered, accepted, completed }
  }

  // Load the signed-in recipient's assigned donations.
  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    fetchRecipientData(selectedRecipientId, controller.signal)
      .then(data => {
        if (!ignore) {
          setOfferedItems(data.offered)
          setAcceptedItems(data.accepted)
          setCompletedItems(data.completed)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!ignore && err.name !== 'AbortError') {
          setError(err.message || 'Failed to load recipient donations.')
          setLoading(false)
        }
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [selectedRecipientId])

  const reloadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true)
    setError(null)
    try {
      const data = await fetchRecipientData(selectedRecipientId)
      setOfferedItems(data.offered)
      setAcceptedItems(data.accepted)
      setCompletedItems(data.completed)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load recipient donations.')
      }
    } finally {
      if (!silent) setRefreshing(false)
      setLoading(false)
    }
  }, [selectedRecipientId])

  // Keep an open recipient dashboard current when a donor's match is assigned.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void reloadData({ silent: true })
      }
    }, 10_000)
    return () => window.clearInterval(timer)
  }, [reloadData])

  // Accept match or split
  const handleAccept = async item => {
    const { donation, split } = item
    const actionKey = `accept-${item.key}`
    setActionInProgress(actionKey)
    setError(null)

    try {
      const payload = {
        recipient_id: selectedRecipientId,
        actor_id: selectedRecipientId,
      }
      if (split?.id) {
        payload.split_id = split.id
      }

      await acceptDonation(donation.id, payload)
      setToast({
        type: 'success',
        text: `Accepted! Pickup added for ${item.assignedQuantity} ${item.unit || 'portions'} of ${donation.food_name}.`,
      })
      await reloadData()
    } catch (err) {
      setToast({
        type: 'error',
        text: err.message || 'Failed to accept donation.',
      })
    } finally {
      setActionInProgress(null)
    }
  }

  // Confirm physical handover
  const handleConfirmHandover = async item => {
    const { donation, split, assignedQuantity } = item
    const actionKey = `handover-${item.key}`
    setActionInProgress(actionKey)
    setError(null)

    try {
      const payload = {
        recipient_id: selectedRecipientId,
        confirmed_quantity: assignedQuantity,
        actor_id: selectedRecipientId,
      }
      if (split?.id) {
        payload.split_id = split.id
      }

      const res = await confirmHandover(donation.id, payload)
      setToast({
        type: 'success',
        text: res.rescued
          ? `Physical handover confirmed! Full donation (${res.required_total} ${donation.unit}) rescued.`
          : `Portion handover confirmed (${res.confirmed_total}/${res.required_total} ${donation.unit}).`,
      })
      await reloadData()
    } catch (err) {
      setToast({
        type: 'error',
        text: err.message || 'Failed to confirm handover.',
      })
    } finally {
      setActionInProgress(null)
    }
  }

  // Unit-aware calculations for impact
  const MEAL_UNITS = new Set(['meals', 'portions', 'meal', 'portion'])
  const rescuedMealsTotal = completedItems
    .filter(item => !item.unit || MEAL_UNITS.has(String(item.unit).toLowerCase().trim()))
    .reduce((sum, item) => sum + (Number(item.assignedQuantity) || 0), 0)

  return (
    <>
      <DashboardLayout
        title="Recipient dashboard"
        subtitle={`Review assignments, accept matches, and confirm physical collections for ${currentRecipient.organization}.`}
      >
        {/* Signed-in recipient profile */}
        <section
          className="glass-card"
          style={{
            marginBottom: 24,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            borderColor: 'rgba(16,185,129,0.3)',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(17,24,39,0.6))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.6rem' }}>🏠</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {currentRecipient.organization}
                </strong>
                <span
                  style={{
                    fontSize: '0.72rem',
                    background: 'rgba(16,185,129,0.15)',
                    color: 'var(--green-light)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontWeight: 700,
                  }}
                >
                  Capacity: {currentRecipient.capacity || 100} meals
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Contact: {currentRecipient.name} · {currentRecipient.location} · {currentRecipient.organization_type}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={reloadData}
              disabled={refreshing || loading}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="Refresh from server"
            >
              <span
                style={{
                  display: 'inline-block',
                  animation: refreshing ? 'spin-slow 0.8s linear infinite' : 'none',
                }}
              >
                ↻
              </span>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </section>

        {/* Live Derived Statistics */}
        <section className="stat-grid recipient-stats">
          {[
            {
              icon: '🍱',
              label: 'Offered matches',
              value: String(offeredItems.length),
              note: 'Awaiting your acceptance',
              color: 'orange',
            },
            {
              icon: '🚚',
              label: 'Active pickups',
              value: String(acceptedItems.length),
              note: 'Accepted, ready to collect',
              color: 'blue',
            },
            {
              icon: '✅',
              label: 'Completed handovers',
              value: String(completedItems.length),
              note: 'Physically confirmed',
              color: 'green',
            },
            {
              icon: '🌟',
              label: 'Meals rescued',
              value: String(rescuedMealsTotal),
              note: 'Collected by this recipient',
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
          ℹ️ Counts reflect the latest fetched database records visible to your signed-in account.
        </p>

        {/* Error notification if any */}
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
              onClick={reloadData}
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

        {/* Section 1: Available & Offered Pickups */}
        <section className="dashboard-section">
          <SectionHeading
            eyebrow="ACTION REQUIRED"
            title="Available & Offered Pickups"
            detail={`${offeredItems.length} open offer${offeredItems.length === 1 ? '' : 's'} your organization has capacity to accept.`}
          />

          <div className="donation-feed">
            {loading ? (
              [1, 2].map(item => <SkeletonCard key={item} />)
            ) : offeredItems.length > 0 ? (
              offeredItems.map(item => {
                const { donation, isSplit, assignedQuantity, unit, deadline, isPastDeadline } = item
                const isAccepting = actionInProgress === `accept-${item.key}`
                const emoji = EMOJI_MAP[donation.food_name] || '🍱'

                return (
                  <article className="glass-card donation-card" key={item.key}>
                    <div className="donation-icon">{emoji}</div>
                    <div className="donation-main">
                      <div className="donation-title-row">
                        <h3>{donation.food_name}</h3>
                        <span className="donation-id">{donation.id}</span>
                        {isSplit && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: 'rgba(239,68,68,0.15)',
                              color: '#fca5a5',
                              border: '1px solid rgba(239,68,68,0.3)',
                              fontWeight: 700,
                            }}
                          >
                            ⚡ Split Recovery Plan
                          </span>
                        )}
                        <StatusBadge status={donation.status} />
                      </div>

                      <p className="donor-line">
                        From <strong>{donation.donor_name || 'Donor'}</strong>
        {donation.matched_recipient_id !== selectedRecipientId && donation.matched_recipient_name
                          ? <span> · Engine recommendation: {donation.matched_recipient_name}</span>
                          : null}
                        {donation.notes ? <span> · Notes: {donation.notes}</span> : null}
                      </p>

                      <div className="donation-facts">
                        <span>
                          🍽️ Assigned:{' '}
                          <b>
                            {assignedQuantity} {unit || 'portions'}
                          </b>
                          {isSplit ? ` (of ${donation.quantity} total)` : ''}
                        </span>
                        <span>
                          📍 Approx. location:{' '}
                          <b>
                            {donation.latitude != null && donation.longitude != null
                              ? `${Number(donation.latitude).toFixed(4)}, ${Number(donation.longitude).toFixed(4)}`
                              : 'Coordinates pending'}
                          </b>
                        </span>
                        <span>
                          <Countdown deadline={deadline} />
                        </span>
                      </div>
                    </div>

                    <div className="donation-actions">
                      <button
                        className="btn-green"
                        onClick={() => handleAccept(item)}
                        disabled={isPastDeadline || isAccepting}
                        style={{
                          opacity: isPastDeadline ? 0.5 : 1,
                          cursor: isPastDeadline ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isAccepting ? 'Accepting…' : isPastDeadline ? 'Deadline Passed' : 'Accept Pickup'}
                      </button>
                      <Link className="btn-secondary" to={`/donation/${donation.id}`}>
                        View Details
                      </Link>
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="empty-state glass-card">
                <span>🌿</span>
                <h3>No pending offers</h3>
                <p>New donation matches assigned to {currentRecipient.organization} will appear here.</p>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Accepted Pickups Awaiting Physical Handover */}
        <section className="dashboard-section">
          <SectionHeading
            eyebrow="PHYSICAL COLLECTION"
            title="My Accepted Pickups"
            detail="Confirm handover in person once the food has been collected from the donor."
          />

          <div className="pickup-list glass-card">
            <div className="pickup-row pickup-header">
              <span>DONOR & FOOD</span>
              <span>QUANTITY</span>
              <span>DEADLINE / STATUS</span>
              <span>PHYSICAL HANDOVER</span>
            </div>

            {acceptedItems.length > 0 ? (
              acceptedItems.map(item => {
                const { donation, isSplit, assignedQuantity, unit, deadline } = item
                const isConfirming = actionInProgress === `handover-${item.key}`

                return (
                  <div className="pickup-row" key={item.key}>
                    <div>
                      <strong>
                        {donation.food_name}{' '}
                        {isSplit && (
                          <small style={{ color: '#fca5a5', fontWeight: 600 }}>[Split]</small>
                        )}
                      </strong>
                      <small>
                        From {donation.donor_name || 'Donor'} · ID: {donation.id}
                      </small>
                      <small style={{ color: 'var(--text-secondary)' }}>
                        📍 Approx. location:{' '}
                        {donation.latitude != null && donation.longitude != null
                          ? `${Number(donation.latitude).toFixed(4)}, ${Number(donation.longitude).toFixed(4)}`
                          : 'Coordinates pending'}
                      </small>
                    </div>

                    <span>
                      <strong>
                        {assignedQuantity} {unit || 'portions'}
                      </strong>
                      {isSplit ? <small style={{ display: 'block', color: 'var(--text-muted)' }}>split share</small> : null}
                    </span>

                    <div>
                      <Countdown deadline={deadline} />
                      <div style={{ marginTop: 4 }}>
                        <StatusBadge status={isSplit ? 'ACCEPTED' : donation.status} />
                      </div>
                    </div>

                    <div>
                      <button
                        className="btn-green compact-btn"
                        onClick={() => handleConfirmHandover(item)}
                        disabled={item.isPastDeadline || isConfirming}
                        style={{
                          width: '100%',
                          opacity: item.isPastDeadline ? 0.5 : 1,
                          cursor: item.isPastDeadline ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isConfirming ? 'Confirming…' : item.isPastDeadline ? 'Pickup Expired' : 'Confirm Handover'}
                      </button>
                      {item.isPastDeadline && (
                        <small style={{ display: 'block', color: '#ef4444', fontSize: '0.68rem', marginTop: 4, textAlign: 'center' }}>
                          Deadline passed — pickup expired
                        </small>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No active pickups currently awaiting collection.
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Completed Collections History */}
        <section className="dashboard-section" style={{ marginBottom: 40 }}>
          <SectionHeading
            eyebrow="PAST RESCUES"
            title="Collection History"
            detail="Completed handovers verified on the MealBridge network."
          />

          <div className="pickup-list glass-card">
            <div className="pickup-row pickup-header">
              <span>DONOR & FOOD</span>
              <span>QUANTITY RESCUED</span>
              <span>RESULT</span>
              <span>DETAILS</span>
            </div>

            {completedItems.length > 0 ? (
              completedItems.map(item => {
                const { donation, isSplit, assignedQuantity, unit } = item
                return (
                  <div className="pickup-row" key={item.key}>
                    <div>
                      <strong>{donation.food_name}</strong>
                      <small>
                        {donation.donor_name} · {donation.id}
                      </small>
                    </div>

                    <span>
                      {assignedQuantity} {unit || 'portions'} {isSplit ? '(split)' : ''}
                    </span>

                    <div>
                      <span className="collected-label">✓ Handover confirmed</span>
                    </div>

                    <div>
                      <Link to={`/donation/${donation.id}`} className="table-action">
                        View details →
                      </Link>
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No completed handovers for {currentRecipient.organization} yet.
              </div>
            )}
          </div>
        </section>

        <Toast message={toast} onClose={() => setToast(null)} />
      </DashboardLayout>
      <ChatWidget />
    </>
  )
}
