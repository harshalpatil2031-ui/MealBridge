import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout, { SectionHeading, StatusBadge, Toast } from '../components/DashboardLayout'
import ChatWidget from '../components/ChatWidget'

const startingAvailable = [
  { id: 'D-001', donor: 'Sunrise Hostel', org: 'Hostel kitchen', food: 'Cooked Meals', qty: 60, distance: '1.4 km', deadline: '38 mins', type: '🍛' },
  { id: 'D-004', donor: 'Greenleaf Café', org: 'Café', food: 'Baked Goods', qty: 30, distance: '2.1 km', deadline: '1 hr 10 mins', type: '🥖' },
  { id: 'D-005', donor: 'City Canteen', org: 'Community canteen', food: 'Rice & Dal', qty: 80, distance: '3.0 km', deadline: '2 hrs', type: '🍚' },
]

const initialPickups = [
  { id: 'D-006', donor: 'Metro Canteen', food: 'Rice & Sabzi', qty: 45, status: 'ACCEPTED' },
  { id: 'D-007', donor: 'Campus Dining', food: 'Lunch Boxes', qty: 24, status: 'COLLECTED' },
]

function SkeletonCard() {
  return <div className="glass-card skeleton-card" aria-label="Loading available donations"><span /><span /><span /></div>
}

export default function RecipientDashboard() {
  const [available, setAvailable] = useState(startingAvailable)
  const [pickups, setPickups] = useState(initialPickups)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450)
    return () => window.clearTimeout(timer)
  }, [])
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const accept = donation => {
    if (pickups.some(pickup => pickup.id === donation.id)) {
      setToast({ type: 'error', text: 'This donation is already in your pickups.' })
      return
    }
    setAvailable(items => items.filter(item => item.id !== donation.id))
    setPickups(items => [{ ...donation, status: 'ACCEPTED' }, ...items])
    setToast({ type: 'success', text: 'Donation Accepted ✅ Pickup added to your list.' })
  }

  const collect = id => {
    setPickups(items => items.map(item => item.id === id ? { ...item, status: 'COLLECTED' } : item))
    setToast({ type: 'success', text: 'Pickup marked as collected.' })
  }

  return <>
    <DashboardLayout title="Recipient dashboard" subtitle="Find nearby surplus and manage your pickups.">
      <section className="stat-grid recipient-stats">
        {[
          { icon: '🍱', label: 'Meals collected', value: '342', note: 'This month', color: 'orange' },
          { icon: '✅', label: 'Pickups confirmed', value: '28', note: 'Across 32 requests', color: 'green' },
          { icon: '⭐', label: 'Success rate', value: '96%', note: 'Confirmed handovers', color: 'blue' },
        ].map(stat => <article className="glass-card stat-card" key={stat.label}><div className="stat-top"><span>{stat.icon}</span><span className="stat-note">{stat.note}</span></div><strong className={`stat-value ${stat.color}`}>{stat.value}</strong><span className="stat-label">{stat.label}</span></article>)}
      </section>

      <section className="dashboard-section">
        <SectionHeading eyebrow="NEAR YOUR LOCATION" title="Available donations" detail={`${available.length} nearby opportunities · sorted by distance`} />
        <div className="donation-feed">
          {loading ? [1, 2, 3].map(item => <SkeletonCard key={item} />) : available.length ? available.map(item => <article className="glass-card donation-card" key={item.id}>
            <div className="donation-icon">{item.type}</div>
            <div className="donation-main"><div className="donation-title-row"><h3>{item.food}</h3><span className="donation-id">{item.id}</span></div><p className="donor-line">{item.donor} <span>· {item.org}</span></p>
              <div className="donation-facts"><span>🍽️ <b>{item.qty} portions</b></span><span>📍 {item.distance} away</span><span>⏱️ Expires in {item.deadline}</span></div>
            </div>
            <div className="donation-actions"><button className="btn-green" onClick={() => accept(item)}>Accept Donation</button><Link className="btn-secondary" to={`/donation/${item.id}`}>View Details</Link></div>
          </article>) : <div className="empty-state glass-card"><span>🌿</span><h3>You’re all caught up</h3><p>New nearby donations will appear here.</p></div>}
        </div>
      </section>

      <section className="dashboard-section">
        <SectionHeading eyebrow="YOUR COLLECTIONS" title="My accepted pickups" detail="Confirm each pickup after the food has been collected." />
        <div className="pickup-list glass-card">
          <div className="pickup-row pickup-header"><span>DONOR & FOOD</span><span>QUANTITY</span><span>STATUS</span><span>ACTION</span></div>
          {pickups.map(pickup => <div className="pickup-row" key={pickup.id}><div><strong>{pickup.donor}</strong><small>{pickup.food}</small></div><span>{pickup.qty} portions</span><StatusBadge status={pickup.status} />{pickup.status === 'ACCEPTED' ? <button className="btn-green compact-btn" onClick={() => collect(pickup.id)}>Mark as Collected</button> : <span className="collected-label">Handover complete</span>}</div>)}
        </div>
      </section>
      <Toast message={toast} onClose={() => setToast(null)} />
    </DashboardLayout>
    <ChatWidget />
  </>
}
