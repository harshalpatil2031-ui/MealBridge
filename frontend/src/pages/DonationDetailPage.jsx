import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DashboardLayout, { SectionHeading, StatusBadge, Toast } from '../components/DashboardLayout'
import ChatWidget from '../components/ChatWidget'

const timeline = [
  { icon: '✅', title: 'Donation logged', time: '6:00 PM', detail: 'Sunrise Hostel logged 80 cooked meals.', state: 'done' },
  { icon: '✅', title: 'Match found', time: '6:02 PM', detail: 'Matched with City Shelter NGO.', state: 'done' },
  { icon: '❌', title: 'Pickup failed', time: '6:45 PM', detail: 'City Shelter declined the pickup.', state: 'failed' },
  { icon: '⚡', title: 'Rescue triggered', time: '6:46 PM', detail: 'The engine searched for available alternatives.', state: 'done' },
  { icon: '✅', title: 'Split donation', time: '6:48 PM', detail: 'Asha Trust (50 meals) + Hope Kitchen (30 meals).', state: 'done' },
  { icon: '✅', title: 'Handover confirmed', time: '7:15 PM', detail: 'Both recipient pickups were confirmed.', state: 'done' },
  { icon: '🟢', title: 'Rescued', time: '7:15 PM', detail: '80 meals saved from going to waste.', state: 'done' },
]

export default function DonationDetailPage() {
  const { id } = useParams()
  const [confirmations, setConfirmations] = useState({ donor: false, recipient: false })
  const [toast, setToast] = useState(null)
  const donationId = id || 'D-001'
  const allConfirmed = confirmations.donor && confirmations.recipient

  const confirm = party => {
    if (confirmations[party]) {
      setToast({ type: 'error', text: `${party === 'donor' ? 'Donor' : 'Recipient'} handover is already confirmed.` })
    } else {
      setConfirmations(current => ({ ...current, [party]: true }))
      setToast({ type: 'success', text: `${party === 'donor' ? 'Donor' : 'Recipient'} handover confirmed.` })
    }
    window.setTimeout(() => setToast(null), 3000)
  }

  return <>
    <DashboardLayout title="Donation details" subtitle={`Follow ${donationId} from the first match through confirmed handover.`}>
      <Link to="/coordinator" className="back-link">← Back to coordinator overview</Link>
      <article className="glass-card detail-summary">
        <div className="donation-icon detail-icon">🍛</div><div className="detail-summary-copy"><p className="dashboard-eyebrow">DONATION {donationId}</p><h2>Cooked Meals · 80 portions</h2><p>From Sunrise Hostel · Kothrud, Pune</p></div>
        <StatusBadge status={allConfirmed ? 'RESCUED' : 'RESCUE_TRIGGERED'} />
        <div className="detail-times"><span>⏱ Deadline <strong>7:30 PM</strong></span><span>📅 Logged <strong>6:00 PM</strong></span></div>
      </article>

      <section className="dashboard-section detail-timeline-section">
        <SectionHeading eyebrow="DONATION LIFECYCLE" title="Status timeline" detail="A clear record of each match, recovery, and confirmation." />
        <div className="glass-card timeline-card"><ol className="timeline-list">
          {timeline.map((step, index) => <li className={`timeline-item ${step.state}`} key={step.title}>
            <span className="timeline-marker">{allConfirmed || index < 6 ? step.icon : '🕐'}</span><div className="timeline-copy"><div className="timeline-title-row"><strong>{step.title}</strong><span>{step.time}</span></div><p>{step.detail}</p></div>
          </li>)}
        </ol></div>
      </section>

      <section className="glass-card handover-card"><div><p className="dashboard-eyebrow">FINAL STEP</p><h2>Confirm the handover</h2><p>MealBridge counts a rescue after both parties confirm the physical collection.</p></div>
        <div className="handover-actions"><button className="btn-green" onClick={() => confirm('donor')} disabled={confirmations.donor}>{confirmations.donor ? '✓ Donor confirmed' : '✅ Confirm Handover (Donor)'}</button><button className="btn-blue" onClick={() => confirm('recipient')} disabled={confirmations.recipient}>{confirmations.recipient ? '✓ Recipient confirmed' : '✅ Confirm Handover (Recipient)'}</button></div>
        {allConfirmed && <div className="handover-success" role="status">✅ Handover confirmed by both parties. 80 meals rescued.</div>}
      </section>
      <Toast message={toast} onClose={() => setToast(null)} />
    </DashboardLayout>
    <ChatWidget />
  </>
}
