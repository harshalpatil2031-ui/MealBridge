import { useCallback, useEffect, useMemo, useState } from 'react'
import DashboardLayout, { SectionHeading } from '../components/DashboardLayout'
import ChatWidget from '../components/ChatWidget'
import { getDonations } from '../api/donations.js'

const COLORS = { rescued: '#10b981', active: '#f97316', failed: '#ef4444' }
const MEAL_UNITS = new Set(['meal', 'meals', 'portion', 'portions'])
const ACTIVE_STATUSES = new Set(['PENDING', 'MATCHED', 'ACCEPTED', 'RESCUE_TRIGGERED'])

function utcDateKey(date) {
  return date.toISOString().slice(0, 10)
}

function buildAnalytics(donations) {
  const today = new Date()
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const weekStart = new Date(todayUtc)
  weekStart.setUTCDate(weekStart.getUTCDate() - 6)

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setUTCDate(date.getUTCDate() + index)
    return {
      key: utcDateKey(date),
      day: new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' }).format(date),
      donations: 0,
      rescued: 0,
    }
  })
  const dayByKey = new Map(days.map(day => [day.key, day]))
  const donorTotals = new Map()
  const outcomes = [
    { name: 'Rescued', value: 0, color: COLORS.rescued },
    { name: 'In progress', value: 0, color: COLORS.active },
    { name: 'Failed', value: 0, color: COLORS.failed },
  ]

  for (const donation of donations) {
    const created = new Date(donation.created_at)
    if (Number.isNaN(created.getTime())) continue
    const createdKey = utcDateKey(created)
    const status = String(donation.status || '').toUpperCase()
    const quantity = Number(donation.quantity) || 0
    const unit = String(donation.unit || '').toLowerCase().trim()

    const day = dayByKey.get(createdKey)
    if (day) {
      day.donations += 1
      if (status === 'RESCUED') day.rescued += 1
    }

    const outcome = outcomes.find(item => item.name === 'Rescued' && status === 'RESCUED')
      || outcomes.find(item => item.name === 'Failed' && status === 'FAILED')
      || outcomes.find(item => item.name === 'In progress' && ACTIVE_STATUSES.has(status))
    if (outcome) outcome.value += 1

    const daysAgo = Math.floor((todayUtc.getTime() - Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), created.getUTCDate())) / 86400000)
    if (daysAgo >= 0 && daysAgo < 30 && quantity > 0 && MEAL_UNITS.has(unit)) {
      const donor = donation.donor_name || 'Unknown donor'
      donorTotals.set(donor, (donorTotals.get(donor) || 0) + quantity)
    }
  }

  const weekDonations = days.reduce((sum, day) => sum + day.donations, 0)
  const weekRescued = days.reduce((sum, day) => sum + day.rescued, 0)
  const weekFailed = donations.filter(donation => {
    const date = new Date(donation.created_at)
    return !Number.isNaN(date.getTime()) && dayByKey.has(utcDateKey(date)) && String(donation.status).toUpperCase() === 'FAILED'
  }).length
  const resolvedThisWeek = weekRescued + weekFailed

  return {
    weekly: days,
    topDonors: [...donorTotals.entries()]
      .map(([name, meals]) => ({ name, meals }))
      .sort((a, b) => b.meals - a.meals)
      .slice(0, 5),
    outcomes,
    totals: {
      donations: weekDonations,
      rescued: weekRescued,
      rescueRate: resolvedThisWeek ? Math.round(weekRescued / resolvedThisWeek * 100) : null,
    },
  }
}

function LineChart({ data }) {
  const width = 720, height = 270, left = 38, right = 20, top = 20, bottom = 38
  const peak = Math.max(0, ...data.flatMap(item => [item.donations, item.rescued]))
  const step = Math.max(1, Math.ceil(peak / 4))
  const max = step * 4
  const x = index => left + index * (width - left - right) / Math.max(1, data.length - 1)
  const y = value => top + (max - value) * (height - top - bottom) / max
  const points = key => data.map((item, index) => `${x(index)},${y(item[key])}`).join(' ')
  return <div className="chart-frame"><svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Line chart of live donations and rescued donations over the last seven days">
    {Array.from({ length: 5 }, (_, index) => index * step).map(tick => <g key={tick}><line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} className="chart-gridline" /><text x={left - 10} y={y(tick) + 4} textAnchor="end" className="chart-axis-label">{tick}</text></g>)}
    <polyline points={points('donations')} className="chart-line donations-line" /><polyline points={points('rescued')} className="chart-line rescued-line" />
    {data.map((item, index) => <g key={item.key}><circle cx={x(index)} cy={y(item.donations)} r="3.5" className="chart-dot donations-dot" /><circle cx={x(index)} cy={y(item.rescued)} r="3.5" className="chart-dot rescued-dot" /><text x={x(index)} y={height - 10} textAnchor="middle" className="chart-axis-label">{item.day}</text></g>)}
  </svg></div>
}

function DonorBars({ data }) {
  if (!data.length) return <p className="data-note">No meal or portion donations have been recorded in the last 30 days.</p>
  const max = Math.max(...data.map(item => item.meals), 1)
  return <div className="donor-bars">{data.map(item => <div className="donor-bar-row" key={item.name}><span>{item.name}</span><div className="donor-bar-track"><i style={{ width: `${item.meals / max * 100}%` }} /></div><strong>{item.meals}</strong></div>)}</div>
}

function OutcomeDonut({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (!total) return <p className="data-note">Outcome chart will appear after donations are recorded.</p>
  const slices = data.reduce((result, item) => {
    const start = result.at(-1)?.end ?? 0
    return [...result, { ...item, start, end: start + item.value / total * 100 }]
  }, [])
  const gradient = slices.filter(slice => slice.value > 0).map(slice => `${slice.color} ${slice.start}% ${slice.end}%`).join(', ')
  return <div className="outcomes-layout"><div className="outcome-donut" style={{ background: `conic-gradient(${gradient})` }}><div><strong>{total}</strong><span>donations</span></div></div><div className="outcome-legend">{data.map(item => <div key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><strong>{item.value} · {Math.round(item.value / total * 100)}%</strong></div>)}</div></div>
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function downloadAnalyticsReport(analytics) {
  const rows = [
    ['MealBridge Analytics Report'],
    ['Generated at', new Date().toISOString()],
    ['Source', 'Live donation records from MealBridge backend'],
    [],
    ['Summary · last 7 days'],
    ['Metric', 'Value'],
    ['Donations logged', analytics.totals.donations],
    ['Currently rescued donations', analytics.totals.rescued],
    ['Resolved donation rescue rate', analytics.totals.rescueRate === null ? 'Not available' : `${analytics.totals.rescueRate}%`],
    [],
    ['Weekly activity'],
    ['Day', 'Donations logged', 'Currently rescued'],
    ...analytics.weekly.map(day => [day.key, day.donations, day.rescued]),
    [],
    ['Top meal donors · last 30 days'],
    ['Donor', 'Meals or portions contributed'],
    ...analytics.topDonors.map(donor => [donor.name, donor.meals]),
    [],
    ['Current donation outcomes'],
    ['Outcome', 'Donations'],
    ...analytics.outcomes.map(outcome => [outcome.name, outcome.value]),
  ]
  const csv = `\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `mealbridge-analytics-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function AnalyticsPage() {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const analytics = useMemo(() => buildAnalytics(donations), [donations])

  const loadDonations = useCallback(async signal => {
    try {
      const result = await getDonations({ signal })
      setDonations(result.items || [])
      setError('')
    } catch (loadError) {
      if (loadError.name !== 'AbortError') setError(loadError.message || 'Could not load live analytics.')
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadDonations(controller.signal)
    return () => controller.abort()
  }, [loadDonations])

  const refresh = async () => {
    setRefreshing(true)
    await loadDonations()
  }

  return <>
    <DashboardLayout title="Analytics & reports" subtitle="Live donation activity, partner contributions, and current recovery outcomes.">
      <section className="stat-grid analytics-summary">
        <article className="glass-card stat-card"><div className="stat-top"><span>📦</span><span className="stat-note">Last 7 days</span></div><strong className="stat-value orange">{loading ? '…' : analytics.totals.donations}</strong><span className="stat-label">Donations logged</span></article>
        <article className="glass-card stat-card"><div className="stat-top"><span>🟢</span><span className="stat-note">Current status</span></div><strong className="stat-value green">{loading ? '…' : analytics.totals.rescued}</strong><span className="stat-label">Donations rescued</span></article>
        <article className="glass-card stat-card"><div className="stat-top"><span>🎯</span><span className="stat-note">Resolved this week</span></div><strong className="stat-value blue">{loading ? '…' : analytics.totals.rescueRate === null ? '—' : `${analytics.totals.rescueRate}%`}</strong><span className="stat-label">Rescue success rate</span></article>
      </section>

      {error && <div role="alert" className="glass-card" style={{ padding: 14, marginTop: 18, color: '#fca5a5', borderColor: 'rgba(239,68,68,.4)' }}>Could not load live analytics: {error}</div>}

      <section className="dashboard-section"><SectionHeading eyebrow="WEEKLY ACTIVITY" title="Daily donations" detail="Donation creation date compared with current rescued status."
        action={<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button type="button" className="btn-secondary compact-btn" onClick={refresh} disabled={refreshing || loading}>{refreshing ? 'Refreshing…' : '↻ Refresh data'}</button><button type="button" className="btn-secondary compact-btn" onClick={() => downloadAnalyticsReport(analytics)} disabled={loading || Boolean(error)} aria-label="Download analytics report as CSV">⬇ Download CSV report</button></div>} />
        <article className="glass-card chart-card"><div className="chart-legend"><span><i className="legend-orange" /> Donations</span><span><i className="legend-green" /> Rescued</span></div>{loading ? <p className="data-note">Loading donation records…</p> : error ? <p className="data-note">Chart unavailable until the backend connection is restored.</p> : <LineChart data={analytics.weekly} />}</article>
      </section>

      <section className="analytics-grid dashboard-section">
        <article className="glass-card chart-card"><SectionHeading eyebrow="COMMUNITY IMPACT" title="Top 5 donors" detail="Meal and portion quantities logged in the last 30 days." />{loading ? <p className="data-note">Loading partner totals…</p> : <DonorBars data={analytics.topDonors} />}</article>
        <article className="glass-card chart-card"><SectionHeading eyebrow="RECOVERY OUTCOMES" title="Donation status breakdown" detail="Current saved status across all recorded donations." />{loading ? <p className="data-note">Loading outcome totals…</p> : <OutcomeDonut data={analytics.outcomes} />}</article>
      </section>
      <p className="data-note">Live data from the MealBridge database. Weekly rescued counts group donations by creation date and current status; rescue rate counts currently rescued donations among rescued or failed donations created during the last 7 days.</p>
    </DashboardLayout>
    <ChatWidget />
  </>
}
