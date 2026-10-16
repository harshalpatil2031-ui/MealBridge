import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { acceptDonation, cancelDonation, confirmHandover, getDonation } from '../api/donations.js'

function formatDate(value) {
  if (!value) return 'Time unavailable'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function remaining(deadline, now) {
  const ms = new Date(deadline).getTime() - now
  if (!Number.isFinite(ms)) return 'Deadline unavailable'
  if (ms <= 0) return 'Deadline passed'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s remaining`
}

export default function RescuePage() {
  const [params] = useSearchParams()
  const donationId = params.get('donationId')
  const [record, setRecord] = useState(null)
  const [loadedFor, setLoadedFor] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('Vehicle unavailable')
  const [failedRecipientId, setFailedRecipientId] = useState('')
  const [now, setNow] = useState(Date.now())

  const refresh = useCallback(async () => {
    if (!donationId) return
    setLoadedFor('')
    setRecord(null)
    setFailedRecipientId('')
    setLoading(true)
    setError('')
    try {
      const data = await getDonation(donationId)
      setRecord(data)
      setLoadedFor(donationId)
      setFailedRecipientId(current => current || data.donation.matched_recipient_id || '')
    } catch (err) {
      setError(err.message || 'Could not load donation recovery details.')
    } finally {
      setLoading(false)
    }
  }, [donationId])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  async function runAction(action) {
    setBusy(true)
    setError('')
    try {
      await action()
      await refresh()
    } catch (err) {
      setError(err.message || 'The action could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  const currentRecord = loadedFor === donationId ? record : null
  const donation = currentRecord?.donation
  const rescue = currentRecord?.rescue
  const splits = currentRecord?.splits || []
  const events = currentRecord?.events || []
  const deadlineMs = donation?.pickup_deadline ? new Date(donation.pickup_deadline).getTime() : NaN
  const handoverExpired = !Number.isFinite(deadlineMs) || deadlineMs <= now
  const maySimulate = donation?.status === 'MATCHED' && donation.matched_recipient_id && new Date(donation.pickup_deadline).getTime() > now

  return <main style={{ minHeight: '100vh', padding: '24px clamp(16px,4vw,48px)', color: 'var(--text-primary)' }}>
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <Link to="/coordinator" className="back-link">← Back to coordinator</Link>
      <header style={{ margin: '16px 0 24px' }}>
        <p className="dashboard-eyebrow">PERSISTED RECOVERY</p><h1>Rescue and handover</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Recovery actions and timeline are loaded from the saved donation.</p>
      </header>

      {!donationId ? <section className="glass-card empty-state"><h2>Select a donation first</h2><p>Open rescue from a donation’s matching result so the same donation ID is carried through.</p><Link className="btn-primary" to="/coordinator">Go to coordinator</Link></section> : null}
      {loading && !record && <div className="glass-card skeleton-card" role="status" aria-label="Loading rescue details"><span /><span /><span /></div>}
      {error && <div className="app-toast error" role="alert" style={{ position: 'static', marginBottom: 16 }}><span>⚠</span><span>{error}</span><button onClick={refresh} aria-label="Retry loading donation">↻</button></div>}

      {donation && <>
        <section className="glass-card detail-summary">
          <div className="detail-icon">🍱</div>
          <div className="detail-summary-copy"><p className="dashboard-eyebrow">DONATION {donation.id}</p><h2>{donation.food_name} · {donation.quantity} {donation.unit}</h2><p>From {donation.donor_name}</p></div>
          <span className={`status-badge status-${donation.status.toLowerCase()}`}>{donation.status.replaceAll('_', ' ')}</span>
          <div className="detail-times"><span>Pickup deadline<strong>{formatDate(donation.pickup_deadline)}</strong></span><span>Time remaining<strong>{remaining(donation.pickup_deadline, now)}</strong></span></div>
        </section>

        {maySimulate && <section className="glass-card" style={{ padding: 20, marginTop: 20 }}>
          <p className="dashboard-eyebrow">PRESENTATION CONTROL</p><h2 style={{ fontSize: '1.05rem', margin: '5px 0 12px' }}>Simulate recipient cancellation</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '.82rem', marginBottom: 12 }}>This records a cancellation against the saved donation and asks the API for a feasible recovery plan.</p>
          <label style={{ display: 'grid', gap: 6, maxWidth: 480, color: 'var(--text-secondary)', fontSize: '.8rem' }}>Failed matched recipient
            <select value={failedRecipientId} onChange={event => setFailedRecipientId(event.target.value)} required style={{ padding: 10, borderRadius: 8, color: 'var(--text-primary)', background: '#111827', border: '1px solid var(--border)' }}><option value="">Select matched recipient…</option><option value={donation.matched_recipient_id}>{donation.matched_recipient_name || donation.matched_recipient_id}</option></select>
          </label>
          <label style={{ display: 'grid', gap: 6, maxWidth: 480, marginTop: 12, color: 'var(--text-secondary)', fontSize: '.8rem' }}>Cancellation reason
            <input value={reason} onChange={event => setReason(event.target.value)} maxLength={240} required style={{ padding: 10, borderRadius: 8, color: 'var(--text-primary)', background: '#111827', border: '1px solid var(--border)' }} />
          </label>
          <button className="btn-primary" disabled={busy || !reason.trim() || !failedRecipientId || failedRecipientId !== donation.matched_recipient_id} onClick={() => runAction(() => cancelDonation(donation.id, { recipient_id: failedRecipientId, reason: reason.trim() }))} style={{ marginTop: 14 }}>
            {busy ? 'Recording cancellation…' : 'Simulate cancellation and find recovery'}
          </button>
        </section>}

        {rescue && <section className="glass-card" style={{ padding: 20, marginTop: 20 }}>
          <p className="dashboard-eyebrow">RECOVERY PLAN · {rescue.status.replaceAll('_', ' ')}</p>
          <h2 style={{ fontSize: '1.1rem', margin: '5px 0' }}>Original recipient: {rescue.original_recipient_name || rescue.original_recipient_id}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Reason: {rescue.reason}</p>
          {rescue.status === 'FAILED' && <div className="empty-state" role="status"><strong>Recovery is infeasible.</strong><p>{rescue.reason || 'The API could not produce a complete feasible recovery plan.'}</p></div>}
          {splits.length > 0 ? <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            {splits.map(split => <article className="glass-card" key={split.id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                <div><strong>{split.recipient_name || split.recipient_id}</strong><p style={{ color: 'var(--text-secondary)' }}>{split.quantity} {donation.unit} · {split.status.replaceAll('_', ' ')}</p></div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {split.status === 'PROPOSED' && <button className="btn-green compact-btn" disabled={busy} onClick={() => runAction(() => acceptDonation(donation.id, { recipient_id: split.recipient_id, split_id: split.id }))}>Accept split</button>}
                  {split.status === 'ACCEPTED' && <button className="btn-green compact-btn" disabled={busy || handoverExpired} onClick={() => runAction(() => confirmHandover(donation.id, { recipient_id: split.recipient_id, split_id: split.id, confirmed_quantity: split.quantity }))}>{handoverExpired ? 'Pickup expired' : 'Confirm handover'}</button>}
                  {split.status === 'HANDED_OVER' && <span className="status-badge status-rescued">Handover recorded</span>}
                </div>
              </div>
              {split.accepted_at && <small style={{ color: 'var(--text-muted)' }}>Accepted {formatDate(split.accepted_at)}</small>}
              {split.handover_at && <small style={{ color: 'var(--text-muted)', marginLeft: 10 }}>Handed over {formatDate(split.handover_at)}</small>}
              {split.status === 'ACCEPTED' && handoverExpired && <small role="status" style={{ display: 'block', color: '#ef4444', marginTop: 6 }}>Deadline passed — pickup expired. Handover cannot be confirmed.</small>}
            </article>)}
          </div> : rescue.status !== 'FAILED' ? <p style={{ marginTop: 12 }}>No rescue splits are recorded yet.</p> : null}
        </section>}

        <section className="dashboard-section">
          <div className="section-heading"><div><p className="dashboard-eyebrow">DATABASE EVENTS</p><h2>Donation timeline</h2><p>Events are shown in the order returned by the API.</p></div></div>
          {events.length ? <div className="glass-card timeline-card"><ol className="timeline-list">
            {events.map(event => <li className="timeline-item" key={event.id}><span className="timeline-marker">{event.event_type.includes('FAILED') || event.event_type.includes('DECLINED') ? '⚠️' : event.event_type.includes('HANDOVER') ? '✅' : '•'}</span><div className="timeline-copy"><div className="timeline-title-row"><strong>{event.event_type.replaceAll('_', ' ')}</strong><span>{formatDate(event.occurred_at)}</span></div><p>{event.description}</p></div></li>)}
          </ol></div> : <div className="empty-state glass-card"><p>No timeline events are recorded for this donation.</p></div>}
        </section>
      </>}
    </div>
  </main>
}
