import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getDonation, matchDonation } from '../api/donations.js'

const DonationMap = lazy(() => import('../components/DonationMap'))

function formatDeadline(value) {
  if (!value) return 'No deadline recorded'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function candidateView(candidate, index) {
  const recipient = candidate.recipient || candidate
  return {
    id: recipient.id,
    name: recipient.organization || recipient.name || 'Recipient',
    type: recipient.organization_type || recipient.type || 'Organization',
    address: recipient.location || 'Location unavailable',
    lat: recipient.latitude,
    lng: recipient.longitude,
    capacity: recipient.capacity,
    distance: Number(candidate.distance_km || 0).toFixed(1),
    eligible: candidate.eligible !== false,
    rank: candidate.rank || index + 1,
    score: candidate.score,
    reasons: candidate.reasons || [],
    availabilityBasis: recipient.availability_basis,
    color: ['#f97316', '#3b82f6', '#10b981'][index % 3],
    emoji: '🏠',
  }
}

export default function MatchingPage() {
  const [searchParams] = useSearchParams()
  const donationId = searchParams.get('donationId')
  const loadRuns = useRef(new Map())
  const [detail, setDetail] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!donationId) return
    let active = true
    setLoading(true)
    setError('')

    if (!loadRuns.current.has(donationId)) {
      loadRuns.current.set(donationId, (async () => {
        const initial = await getDonation(donationId)
        if (initial.donation.status !== 'PENDING') return { detail: initial, result: null }
        const result = await matchDonation(donationId)
        return { detail: await getDonation(donationId), result }
      })())
    }

    loadRuns.current.get(donationId)
      .then(data => {
        if (active) { setDetail(data.detail); setResult(data.result) }
      })
      .catch(err => { if (active) setError(err.message || 'Could not load matching details.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [donationId])

  const donation = detail?.donation
  const candidates = (result?.candidates || []).map(candidateView)
  const selected = result?.selected_recipient
    ? candidateView({ recipient: result.selected_recipient, ...candidates.find(item => item.id === result.selected_recipient.id) }, 0)
    : null
  const activeRecipient = selected || (donation?.matched_recipient_id ? {
    id: donation.matched_recipient_id,
    name: donation.matched_recipient_name || 'Assigned recipient',
    lat: null,
    lng: null,
  } : null)
  const mapCandidates = candidates.length ? candidates : activeRecipient?.lat != null ? [activeRecipient] : []

  return <main style={{ minHeight: '100vh', padding: '24px clamp(16px,4vw,48px)', color: 'var(--text-primary)' }}>
    <div style={{ maxWidth: 1050, margin: '0 auto' }}>
      <Link to="/donor" className="back-link">← Back to donor dashboard</Link>
      <header style={{ margin: '16px 0 24px' }}>
        <p className="dashboard-eyebrow">RULE-BASED MATCHING</p>
        <h1>Match a donation</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Candidates and feasibility come from the saved donation and API response.</p>
      </header>

      {!donationId ? <section className="glass-card empty-state">
        <h2>Select a donation first</h2><p>Open matching from a saved donation to review eligible recipients.</p>
        <Link className="btn-primary" to="/donor">Go to donor dashboard</Link>
      </section> : loading && !donation ? <div className="glass-card skeleton-card" role="status" aria-label="Loading donation and matches"><span /><span /><span /></div> : null}

      {error && <div className="app-toast error" role="alert" style={{ position: 'static', marginBottom: 16 }}><span>⚠</span><span>{error}</span><button onClick={() => window.location.reload()} aria-label="Retry loading donation">↻</button></div>}

      {donation && <>
        <section className="glass-card" style={{ padding: 22, marginBottom: 22 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 230 }}>
              <p className="dashboard-eyebrow">DONATION {donation.id}</p>
              <h2>{donation.food_name} · {donation.quantity} {donation.unit}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>From {donation.donor_name} · Pickup deadline {formatDeadline(donation.pickup_deadline)}</p>
            </div>
            <span className={`status-badge status-${donation.status.toLowerCase()}`}>{donation.status.replaceAll('_', ' ')}</span>
          </div>
          <p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: '.85rem' }}>
            Ranking uses the API’s deterministic rules: eligible capacity, approximate straight-line distance, and deadline in the future. It is not an AI score or arrival-time guarantee.
          </p>
        </section>

        {result?.no_match_reason && <div className="empty-state glass-card" role="status"><h2>No eligible full-quantity match</h2><p>{result.no_match_reason}</p></div>}
        {donation.status === 'MATCHED' && <div className="glass-card" style={{ padding: 18, marginBottom: 18 }} role="status">
          <strong>Match already saved: {donation.matched_recipient_name || 'recipient assigned'}</strong>
          <p style={{ color: 'var(--text-secondary)', marginTop: 5 }}>This page did not rerun matching. Use the saved donation details to continue.</p>
        </div>}
        {donation.status !== 'PENDING' && donation.status !== 'MATCHED' && <div className="glass-card" style={{ padding: 18, marginBottom: 18 }}><strong>Matching is unavailable for status {donation.status.replaceAll('_', ' ')}.</strong></div>}

        {candidates.length > 0 && <section className="dashboard-section">
          <div className="section-heading"><div><p className="dashboard-eyebrow">ELIGIBLE RECIPIENTS</p><h2>Ranked candidates</h2><p>Approximate distances are straight-line measurements; recipient availability is a demo assumption.</p></div></div>
          <div style={{ display: 'grid', gap: 12 }}>
            {candidates.map(candidate => <article className="glass-card" key={candidate.id} style={{ padding: 18 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
                <div><strong>#{candidate.rank} · {candidate.name}</strong><p style={{ color: 'var(--text-secondary)' }}>{candidate.type} · {candidate.distance} km approx. · capacity {candidate.capacity} {donation.unit}</p></div>
                <span className="badge-green">Eligible</span>
              </div>
              <ul style={{ margin: '10px 0 0 18px', color: 'var(--text-secondary)', fontSize: '.85rem' }}>{candidate.reasons.map((reason, index) => <li key={`${candidate.id}-${index}`}>{reason}</li>)}</ul>
              {candidate.availabilityBasis === 'demo_assumption' && <small style={{ color: 'var(--text-muted)' }}>Availability assumed for demo</small>}
            </article>)}
          </div>
        </section>}

        {activeRecipient && <section className="glass-card" style={{ marginTop: 22, padding: 18 }}>
          <h2 style={{ fontSize: '1rem', marginBottom: 8 }}>Saved assignment</h2><p>{activeRecipient.name}</p>
          <Link className="btn-primary" style={{ marginTop: 12 }} to={`/rescue?donationId=${encodeURIComponent(donation.id)}`}>Continue to rescue / handover →</Link>
        </section>}

        {mapCandidates.length > 0 && donation.latitude != null && donation.longitude != null && <section style={{ marginTop: 22 }}>
          <h2 style={{ fontSize: '1rem', marginBottom: 10 }}>Donation locations</h2>
          <Suspense fallback={<div className="map-loading">Loading map…</div>}>
            <DonationMap compact donor={{ lat: donation.latitude, lng: donation.longitude, name: donation.donor_name, location: '', food: donation.food_name, qty: donation.quantity }} recipients={mapCandidates.map(candidate => ({ ...candidate, lat: candidate.lat, lng: candidate.lng, type: candidate.type, address: candidate.address, successRate: 0 }))} selectedRecipientId={activeRecipient?.id || candidates[0]?.id} />
          </Suspense>
        </section>}
      </>}
    </div>
  </main>
}
