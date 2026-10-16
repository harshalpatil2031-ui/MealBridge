import { useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout, { SectionHeading, StatusBadge, Toast } from '../components/DashboardLayout'
import ChatWidget from '../components/ChatWidget'

const initialRescues = [
  { id: 'D-001', donor: 'Sunrise Hostel', food: 'Cooked Meals', qty: 80, timeLeft: '47 mins', failed: 'City Shelter NGO', status: 'Rescue found' },
  { id: 'D-008', donor: 'Metro Canteen', food: 'Rice & Sabzi', qty: 45, timeLeft: '22 mins', failed: 'Green Hope NGO', status: 'Searching...' },
]

const donations = [
  { id: 'D-003', donor: 'Greenleaf Café', food: 'Rice & Dal', qty: 55, status: 'PENDING', recipient: 'Finding a match' },
  { id: 'D-002', donor: 'Sunrise Hostel', food: 'Baked Goods', qty: 40, status: 'MATCHED', recipient: 'Green Hope NGO' },
  { id: 'D-001', donor: 'Sunrise Hostel', food: 'Cooked Meals', qty: 80, status: 'RESCUE_TRIGGERED', recipient: 'Asha Trust + Hope Kitchen' },
  { id: 'D-098', donor: 'Metro Canteen', food: 'Rice & Dal', qty: 60, status: 'RESCUED', recipient: 'Asha Trust' },
  { id: 'D-096', donor: 'Greenleaf Café', food: 'Mixed Curry', qty: 90, status: 'FAILED', recipient: '—' },
]

export default function CoordinatorDashboard() {
  const [rescues, setRescues] = useState(initialRescues)
  const [toast, setToast] = useState(null)

  const override = rescue => {
    if (rescue.status === 'Searching...') {
      setRescues(items => items.map(item => item.id === rescue.id ? { ...item, status: 'Rescue found' } : item))
      setToast({ type: 'success', text: `Manual rescue search started for ${rescue.id}.` })
    } else {
      setToast({ type: 'error', text: `A recovery plan already exists for ${rescue.id}.` })
    }
    window.setTimeout(() => setToast(null), 3200)
  }

  return <>
    <DashboardLayout title="Coordinator overview" subtitle="Monitor donations, recovery alerts, and handovers across MealBridge.">
      <section className="stat-grid coordinator-stats">
        {[
          { icon: '🍱', label: 'Donations today', value: '24', note: '+4 from yesterday', color: 'orange' },
          { icon: '⚡', label: 'Active rescues', value: String(rescues.length), note: 'Recovery in progress', color: 'red' },
          { icon: '🎯', label: 'Rescue rate', value: '94%', note: 'This week', color: 'blue' },
          { icon: '🌟', label: 'Meals saved this week', value: '1,240', note: 'Across all donors', color: 'green' },
        ].map(stat => <article className="glass-card stat-card" key={stat.label}><div className="stat-top"><span>{stat.icon}</span><span className="stat-note">{stat.note}</span></div><strong className={`stat-value ${stat.color}`}>{stat.value}</strong><span className="stat-label">{stat.label}</span></article>)}
      </section>

      <section className="dashboard-section">
        <SectionHeading eyebrow="NEEDS ATTENTION" title="Rescue alerts" detail="Failed pickups that need a timely recovery plan." />
        <div className="rescue-grid">{rescues.map(rescue => <article className="glass-card rescue-card" key={rescue.id}>
          <div className="rescue-alert-title"><span>⚠️</span><strong>Pickup Failed — Rescue Triggered</strong><span className="rescue-pulse" /></div>
          <div className="rescue-details"><div><span>DONATION</span><strong>{rescue.donor}</strong><small>{rescue.food} · {rescue.qty} portions</small></div><div><span>TIME REMAINING</span><strong className="time-remaining">⏱ {rescue.timeLeft}</strong></div></div>
          <div className="rescue-meta"><span>Failed recipient</span><strong>{rescue.failed}</strong></div>
          <div className="rescue-footer"><span className={`engine-status ${rescue.status === 'Searching...' ? 'searching' : ''}`}><i /> Engine: {rescue.status}</span><button className="btn-primary compact-btn" onClick={() => override(rescue)}>Override Manually</button></div>
        </article>)}</div>
      </section>

      <section className="dashboard-section">
        <SectionHeading eyebrow="LIVE OPERATIONS" title="All donations" detail="Current status and assigned recipients." action={<Link to="/analytics" className="btn-secondary compact-btn">View analytics →</Link>} />
        <div className="table-scroll glass-card"><table className="operations-table"><thead><tr><th>DONOR</th><th>FOOD TYPE</th><th>QTY</th><th>STATUS</th><th>MATCHED RECIPIENT</th><th>ACTION</th></tr></thead><tbody>
          {donations.map(row => <tr key={row.id}><td><strong>{row.donor}</strong><small>{row.id}</small></td><td>{row.food}</td><td>{row.qty} portions</td><td><StatusBadge status={row.status} /></td><td>{row.recipient}</td><td><Link to={`/donation/${row.id}`} className="table-action">Details ↗</Link></td></tr>)}
        </tbody></table></div>
      </section>
      <Toast message={toast} onClose={() => setToast(null)} />
    </DashboardLayout>
    <ChatWidget />
  </>
}
