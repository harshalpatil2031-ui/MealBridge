import DashboardLayout, { SectionHeading } from '../components/DashboardLayout'
import ChatWidget from '../components/ChatWidget'
import { analytics } from '../data/seed'

function LineChart({ data }) {
  const width = 720, height = 270, left = 38, right = 20, top = 20, bottom = 38
  const max = 35
  const x = index => left + index * (width - left - right) / (data.length - 1)
  const y = value => top + (max - value) * (height - top - bottom) / max
  const points = key => data.map((item, index) => `${x(index)},${y(item[key])}`).join(' ')
  return <div className="chart-frame"><svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Line chart of donations and rescued meals this week">
    {[0, 10, 20, 30].map(tick => <g key={tick}><line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} className="chart-gridline" /><text x={left - 10} y={y(tick) + 4} textAnchor="end" className="chart-axis-label">{tick}</text></g>)}
    <polyline points={points('donations')} className="chart-line donations-line" /><polyline points={points('rescued')} className="chart-line rescued-line" />
    {data.map((item, index) => <g key={item.day}><circle cx={x(index)} cy={y(item.donations)} r="3.5" className="chart-dot donations-dot" /><circle cx={x(index)} cy={y(item.rescued)} r="3.5" className="chart-dot rescued-dot" /><text x={x(index)} y={height - 10} textAnchor="middle" className="chart-axis-label">{item.day}</text></g>)}
  </svg></div>
}

function DonorBars({ data }) {
  const max = Math.max(...data.map(item => item.meals))
  return <div className="donor-bars">{data.map(item => <div className="donor-bar-row" key={item.name}><span>{item.name}</span><div className="donor-bar-track"><i style={{ width: `${item.meals / max * 100}%` }} /></div><strong>{item.meals}</strong></div>)}</div>
}

function OutcomeDonut({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const slices = data.reduce((result, item) => {
    const start = result.at(-1)?.end ?? 0
    return [...result, { color: item.color, start, end: start + item.value / total * 100 }]
  }, [])
  const gradient = slices.map(slice => `${slice.color} ${slice.start}% ${slice.end}%`).join(', ')
  return <div className="outcomes-layout"><div className="outcome-donut" style={{ background: `conic-gradient(${gradient})` }}><div><strong>100%</strong><span>outcomes</span></div></div><div className="outcome-legend">{data.map(item => <div key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><strong>{item.value}%</strong></div>)}</div></div>
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function downloadAnalyticsReport(totals) {
  const rows = [
    ['MealBridge Analytics Report'],
    ['Generated at', new Date().toISOString()],
    [],
    ['Summary'],
    ['Metric', 'Value'],
    ['Donations logged this week', totals.donations],
    ['Rescued donations this week', totals.rescued],
    ['Rescue success rate', `${totals.rescueRate}%`],
    [],
    ['Weekly activity'],
    ['Day', 'Donations logged', 'Donations rescued'],
    ...analytics.weekly.map(day => [day.day, day.donations, day.rescued]),
    [],
    ['Top donors'],
    ['Donor', 'Meals contributed'],
    ...analytics.topDonors.map(donor => [donor.name, donor.meals]),
    [],
    ['Top recipients'],
    ['Recipient', 'Meals received'],
    ...analytics.topRecipients.map(recipient => [recipient.name, recipient.meals]),
    [],
    ['Rescue outcomes'],
    ['Outcome', 'Share of tracked outcomes (%)'],
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
  const totals = analytics.weekly.reduce((result, day) => ({
    donations: result.donations + day.donations,
    rescued: result.rescued + day.rescued,
  }), { donations: 0, rescued: 0 })
  totals.rescueRate = totals.donations ? Math.round(totals.rescued / totals.donations * 100) : 0

  return <>
    <DashboardLayout title="Analytics & reports" subtitle="A weekly view of donations, partner impact, and rescue outcomes.">
      <section className="stat-grid analytics-summary">
        <article className="glass-card stat-card"><div className="stat-top"><span>📦</span><span className="stat-note">This week</span></div><strong className="stat-value orange">{totals.donations}</strong><span className="stat-label">Donations logged</span></article>
        <article className="glass-card stat-card"><div className="stat-top"><span>🟢</span><span className="stat-note">Confirmed handovers</span></div><strong className="stat-value green">{totals.rescued}</strong><span className="stat-label">Donations rescued</span></article>
        <article className="glass-card stat-card"><div className="stat-top"><span>🎯</span><span className="stat-note">At-risk recoveries</span></div><strong className="stat-value blue">{totals.rescueRate}%</strong><span className="stat-label">Rescue success rate</span></article>
      </section>

      <section className="dashboard-section"><SectionHeading eyebrow="WEEKLY ACTIVITY" title="Daily donations" detail="Donations logged compared with confirmed rescues."
        action={<button type="button" className="btn-secondary compact-btn" onClick={() => downloadAnalyticsReport(totals)} aria-label="Download analytics report as CSV">⬇ Download CSV report</button>} />
        <article className="glass-card chart-card"><div className="chart-legend"><span><i className="legend-orange" /> Donations</span><span><i className="legend-green" /> Rescued</span></div><LineChart data={analytics.weekly} /></article>
      </section>

      <section className="analytics-grid dashboard-section">
        <article className="glass-card chart-card"><SectionHeading eyebrow="COMMUNITY IMPACT" title="Top 5 donors" detail="Meals contributed this month." /><DonorBars data={analytics.topDonors} /></article>
        <article className="glass-card chart-card"><SectionHeading eyebrow="RECOVERY OUTCOMES" title="Rescue outcomes" detail="Share of tracked donation outcomes." /><OutcomeDonut data={analytics.outcomes} /></article>
      </section>
      <p className="data-note">Demo analytics · Values use the project’s sample dataset.</p>
    </DashboardLayout>
    <ChatWidget />
  </>
}
