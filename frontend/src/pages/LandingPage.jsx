import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

/* ─── Navbar ─────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg,#f97316,#ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', boxShadow: '0 4px 15px rgba(249,115,22,0.4)'
          }}>🍱</div>
          <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: '1.2rem' }}>
            Meal<span className="gradient-text-orange">Bridge</span>
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="nav-links">
          {['How it Works', 'Innovation', 'Team', 'Hackathon'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`}
              style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem',
                fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--orange)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
            >{l}</a>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="/login" className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>Log In</a>
          <a href="/register" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>Get Started</a>
        </div>
      </div>
    </nav>
  )
}

/* ─── Animated Counter ───────────────────────────────────────── */
function Counter({ end, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const duration = 2000
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start = Math.min(start + step, end)
      setCount(Math.floor(start))
      if (start >= end) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [end])
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>
}

/* ─── Step Card ──────────────────────────────────────────────── */
function StepCard({ number, icon, title, desc, color, delay }) {
  return (
    <div className="glass-card animate-fadeInUp" style={{
      padding: '32px 28px', animationDelay: delay,
      opacity: 0, position: 'relative', overflow: 'hidden'
    }}>
      {/* Background number */}
      <div style={{
        position: 'absolute', top: -10, right: 16,
        fontSize: '5rem', fontWeight: 900, opacity: 0.04,
        fontFamily: 'Space Grotesk,sans-serif', color: color, lineHeight: 1
      }}>{number}</div>

      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: `${color}18`, border: `1.5px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem', marginBottom: 20
      }}>{icon}</div>

      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: `${color}12`, border: `1px solid ${color}30`,
        borderRadius: 999, padding: '3px 12px',
        fontSize: '0.7rem', fontWeight: 700, color: color,
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14
      }}>Step {number}</div>

      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</p>
    </div>
  )
}

/* ─── Feature Row ────────────────────────────────────────────── */
function FeatureRow({ icon, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '20px 0',
      borderBottom: '1px solid var(--border)' }}>
      <div style={{
        width: 42, height: 42, borderRadius: 11, flexShrink: 0,
        background: 'var(--orange-glow)', border: '1px solid rgba(249,115,22,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
      }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.95rem' }}>{title}</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  )
}

/* ─── Stat Card ──────────────────────────────────────────────── */
function StatCard({ value, label, icon, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '28px 24px', textAlign: 'center',
      transition: 'all 0.3s ease', cursor: 'default'
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-4px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: '2.2rem', fontWeight: 800, color, fontFamily: 'Space Grotesk,sans-serif', lineHeight: 1 }}>
        <Counter end={parseInt(value)} suffix={value.replace(/[0-9]/g, '')} />
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  )
}

/* ─── Team Member Card ───────────────────────────────────────── */
function TeamCard({ name, role, emoji, color }) {
  return (
    <div className="glass-card" style={{ padding: '28px 24px', textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
        background: `${color}18`, border: `2px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.8rem'
      }}>{emoji}</div>
      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: '0.82rem', color: color, fontWeight: 600 }}>{role}</div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function LandingPage() {

  return (
    <>
      <Navbar />

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden', paddingTop: 90 }}>

        {/* Glow orbs */}
        <div className="orb orb-orange animate-float" style={{ width: 500, height: 500, top: -100, left: -150, animationDuration: '8s' }} />
        <div className="orb orb-green animate-float" style={{ width: 400, height: 400, top: 100, right: -120, animationDuration: '10s', animationDelay: '2s' }} />
        <div className="orb orb-blue animate-float" style={{ width: 300, height: 300, bottom: 0, left: '40%', animationDuration: '12s', animationDelay: '4s' }} />

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `linear-gradient(rgba(245,158,11,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(245,158,11,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>

          {/* Hackathon badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div className="badge-orange animate-fadeInUp">
              <span>⚡</span> PRISM 26 Socithon · Team NovaNexus
            </div>
          </div>

          {/* Headline */}
          <h1 className="animate-fadeInUp delay-100" style={{
            fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 900, marginBottom: 24,
            lineHeight: 1.1, opacity: 0
          }}>
            Don't let food<br />
            <span className="gradient-text">go to waste.</span>
          </h1>

          <p className="animate-fadeInUp delay-200" style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'var(--text-secondary)',
            maxWidth: 620, margin: '0 auto 40px', lineHeight: 1.7, opacity: 0
          }}>
            MealBridge is an <strong style={{ color: 'var(--orange-light)' }}>AI-powered platform</strong> that predicts
            surplus food, matches donors to recipients, and rescues donations — even when the original plan fails.
          </p>

          {/* CTA buttons */}
          <div className="animate-fadeInUp delay-300" style={{
            display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 60, opacity: 0
          }}>
            <a href="/register?role=donor" className="btn-primary" id="cta-donor">
              🍽️ I'm a Donor
            </a>
            <a href="/register?role=recipient" className="btn-green" id="cta-ngo">
              🏠 I'm an NGO
            </a>
            <a href="/register?role=coordinator" className="btn-secondary" id="cta-coordinator">
              🧑‍💼 Coordinator
            </a>
          </div>

          {/* Live demo ticker */}
          <div className="animate-fadeInUp delay-400" style={{
            display: 'flex', justifyContent: 'center', opacity: 0
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 999, padding: '10px 20px', fontSize: '0.85rem'
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981',
                boxShadow: '0 0 10px #10b981', display: 'inline-block', animation: 'pulse-glow 2s infinite' }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                Live · <span style={{ color: 'var(--green-light)', fontWeight: 600 }}>12 active donations</span> being matched right now
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }} id="stats">
        <div className="container">
          <div className="grid-4">
            <StatCard value="8400+" label="Meals Rescued" icon="🍱" color="#f97316" />
            <StatCard value="94%" label="Rescue Success Rate" icon="🎯" color="#10b981" />
            <StatCard value="120+" label="Active Donor Partners" icon="🏪" color="#3b82f6" />
            <StatCard value="58+" label="NGO Partners" icon="🤝" color="#a78bfa" />
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-label">
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              How It Works
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: 16, maxWidth: 560 }}>
            Four steps from <span className="gradient-text">surplus to saved</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 540, marginBottom: 52, fontSize: '1rem', lineHeight: 1.7 }}>
            Our end-to-end pipeline ensures every donation reaches someone in need — with AI at every step.
          </p>

          <div className="grid-4">
            <StepCard number={1} icon="🔮" title="PREDICT" color="#f97316" delay="0s"
              desc="AI estimates potential surplus using historical meal patterns, attendance data, and day-of-week trends before food is even prepared." />
            <StepCard number={2} icon="🎯" title="MATCH" color="#3b82f6" delay="0.1s"
              desc="Confirms available quantity and ranks eligible recipients by capacity, distance, availability, and safe collection deadline." />
            <StepCard number={3} icon="⚡" title="RECOVER" color="#ef4444" delay="0.2s"
              desc="If a pickup fails, the Rescue Recovery Engine finds alternative recipients or splits the donation across multiple NGOs — automatically." />
            <StepCard number={4} icon="📊" title="TRACK & LEARN" color="#10b981" delay="0.3s"
              desc="Confirms handovers, logs outcomes, and feeds data back into the prediction model to improve future matches and rescues." />
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* ── RESCUE RECOVERY ENGINE ─────────────────────────────── */}
      <section className="section" id="innovation">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

            {/* Left: text */}
            <div>
              <div className="badge-orange" style={{ marginBottom: 20 }}>🔑 Core Innovation</div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800, marginBottom: 20 }}>
                The <span className="gradient-text">Rescue Recovery</span> Engine
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 28, fontSize: '0.98rem' }}>
                Every other platform finds a recipient. <strong style={{ color: 'var(--text-primary)' }}>MealBridge rescues the donation</strong> when
                that recipient cancels — automatically, before the food deadline.
              </p>

              <FeatureRow icon="🔄" title="Auto Fallback"
                desc="When a recipient declines or goes silent, the engine immediately searches for the next best match." />
              <FeatureRow icon="✂️" title="Split Donations"
                desc="If no single recipient has capacity, the batch is split across 2–3 NGOs — each getting their portion." />
              <FeatureRow icon="⏱️" title="Real-Time Countdown"
                desc="Every decision is time-aware. The engine works against the food safety deadline, not just convenience." />
              <FeatureRow icon="✅" title="Verified Handovers"
                desc="A donation is only counted as rescued after both donor and recipient confirm the physical handover." />
            </div>

            {/* Right: live rescue card mockup */}
            <div style={{ position: 'relative' }}>
              <div className="orb orb-orange" style={{ width: 300, height: 300, top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)', filter: 'blur(60px)' }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Rescue alert card */}
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    <div>
                      <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.9rem' }}>Pickup Failed — Rescue Triggered</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>City Shelter NGO declined · 47 mins to deadline</div>
                    </div>
                    <div style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.15)', borderRadius: 999,
                      padding: '4px 12px', fontSize: '0.75rem', color: '#f87171', fontWeight: 700 }}>LIVE</div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, marginBottom: 16 }}>
                    <div style={{ width: '65%', height: '100%', background: 'linear-gradient(90deg,#ef4444,#f97316)',
                      borderRadius: 4, transition: 'width 1s ease' }} />
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Engine scanning 23 nearby recipients...</div>
                </div>

                {/* Recovery options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { org: 'Asha Trust', meals: '50 meals', dist: '1.2 km', status: 'Accepted ✓', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)' },
                    { org: 'Hope Kitchen', meals: '30 meals', dist: '2.1 km', status: 'Accepted ✓', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)' },
                  ].map(r => (
                    <div key={r.org} style={{
                      background: r.bg, border: `1px solid ${r.border}`,
                      borderRadius: 'var(--radius-md)', padding: '16px 18px',
                      display: 'flex', alignItems: 'center', gap: 12
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${r.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🏠</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{r.org}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.meals} · {r.dist}</div>
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: r.color }}>{r.status}</div>
                    </div>
                  ))}
                </div>

                {/* Rescued badge */}
                <div style={{
                  marginTop: 16, textAlign: 'center',
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 'var(--radius-md)', padding: '14px',
                  color: '#34d399', fontWeight: 700, fontSize: '0.9rem'
                }}>
                  🟢 80 meals rescued · Split donation confirmed
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* ── AI FEATURES ────────────────────────────────────────── */}
      <section className="section" id="features">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="badge-green" style={{ marginBottom: 16, display: 'inline-flex' }}>🤖 AI-Powered</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, marginBottom: 16 }}>
              Intelligence at <span className="gradient-text">every step</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', fontSize: '0.98rem', lineHeight: 1.7 }}>
              Four AI modules working together to ensure zero food goes to waste.
            </p>
          </div>

          <div className="grid-2">
            {[
              {
                icon: '🔮', title: 'AI Surplus Prediction',
                desc: 'Estimates leftover food using historical meal patterns, attendance, day-of-week trends, and special event flags — before the food is even cooked.',
                tag: 'scikit-learn · Random Forest', color: '#f97316'
              },
              {
                icon: '🎯', title: 'Intelligent Matching',
                desc: 'Ranks recipients using a weighted scoring algorithm across 5 factors: capacity, distance, availability, deadline fit, and past pickup success rate.',
                tag: 'Weighted Scoring · Haversine', color: '#3b82f6'
              },
              {
                icon: '⚡', title: 'Rescue Recovery Engine',
                desc: 'When the original plan fails, automatically finds alternatives or splits donations across multiple recipients — all before the food safety deadline.',
                tag: 'Custom Optimization Logic', color: '#ef4444'
              },
              {
                icon: '💬', title: 'Conversational AI Assistant',
                desc: 'Donors and coordinators can ask natural language questions about donation status, recovery options, and next steps via the integrated chat.',
                tag: 'IBM watsonx.ai', color: '#10b981'
              }
            ].map(f => (
              <div key={f.title} className="glass-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    background: `${f.color}15`, border: `1.5px solid ${f.color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem'
                  }}>{f.icon}</div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 14 }}>{f.desc}</p>
                    <span style={{
                      background: `${f.color}12`, border: `1px solid ${f.color}25`,
                      color: f.color, padding: '3px 12px', borderRadius: 999,
                      fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace'
                    }}>{f.tag}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* ── PROBLEM ────────────────────────────────────────────── */}
      <section className="section" style={{ background: '#1a1108' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div>
              <div className="badge-orange" style={{ marginBottom: 20 }}>📊 The Problem</div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, marginBottom: 20 }}>
                Food waste isn't a<br /><span className="gradient-text-orange">supply problem.</span><br />It's a coordination problem.
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '0.98rem' }}>
                Restaurants, hostels, and canteens often have extra food they're happy to donate. But it still
                goes to waste because existing systems find a recipient — but nobody helps when that plan fails.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: '❓', text: 'Nobody knows how much food will be left over', color: '#f97316' },
                { icon: '📦', text: "Recipients can't always take the full quantity", color: '#ef4444' },
                { icon: '🚫', text: 'Pickups get cancelled at the last minute', color: '#f97316' },
                { icon: '📞', text: 'Everything runs on manual calls — no backup plan', color: '#ef4444' },
              ].map((p, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, alignItems: 'center',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderLeft: `3px solid ${p.color}`,
                  borderRadius: 'var(--radius-sm)', padding: '16px 18px'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* ── TEAM ───────────────────────────────────────────────── */}
      <section className="section" id="team">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="badge-green" style={{ marginBottom: 16, display: 'inline-flex' }}>👥 Team NovaNexus</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800 }}>
              Built by <span className="gradient-text">NovaNexus</span>
            </h2>
          </div>
          <div className="grid-4">
            <TeamCard name="Harshal Patil" role="Team Lead · Full Stack" emoji="👨‍💻" color="#f97316" />
            <TeamCard name="Team Member" role="Backend · AI/ML" emoji="🤖" color="#3b82f6" />
            <TeamCard name="Team Member" role="Frontend · UI/UX" emoji="🎨" color="#10b981" />
            <TeamCard name="Team Member" role="ML · Data Science" emoji="📊" color="#a78bfa" />
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* ── CTA FOOTER ─────────────────────────────────────────── */}
      <section className="section" id="hackathon" style={{ textAlign: 'center' }}>
        <div className="orb orb-orange" style={{ width: 400, height: 400, top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', filter: 'blur(80px)' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="badge-orange" style={{ marginBottom: 24, display: 'inline-flex' }}>🏆 PRISM 26 Socithon</div>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, marginBottom: 20 }}>
            Ready to <span className="gradient-text">rescue food?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 40px', fontSize: '1rem', lineHeight: 1.7 }}>
            Join MealBridge and turn surplus into impact. Every meal rescued is a life touched.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/register?role=donor" className="btn-primary">🍽️ Register as Donor</a>
            <a href="/register?role=recipient" className="btn-green">🏠 Register as NGO</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', padding: '32px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.2rem' }}>🍱</span>
            <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700 }}>
              Meal<span className="gradient-text-orange">Bridge</span>
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Built with ❤️ by Team NovaNexus · PRISM 26 Socithon · {new Date().getFullYear()}
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {['GitHub', 'Docs', 'Contact'].map(l => (
              <a key={l} href="#" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none',
                transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--orange)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </>
  )
}
