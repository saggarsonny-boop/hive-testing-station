'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ENGINES } from '@/lib/engines'

const COUNTRIES = [
  'United Kingdom', 'United States', 'Canada', 'Australia', 'India', 'Germany',
  'France', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Spain',
  'Italy', 'Poland', 'Portugal', 'Brazil', 'Mexico', 'South Africa', 'Nigeria',
  'Kenya', 'Ghana', 'Singapore', 'Malaysia', 'Philippines', 'Japan', 'South Korea',
  'New Zealand', 'Ireland', 'Switzerland', 'Austria', 'Belgium', 'Other',
]

export default function EngineTestPage({ params }: { params: Promise<{ engine: string }> }) {
  const { engine: engineSlug } = use(params)
  const router = useRouter()

  const engine = ENGINES.find(e => e.slug === engineSlug)
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null)

  const [form, setForm] = useState({
    name: '', email: '', phone: '', country: '', device: '', browser: '', honeypot: '',
  })
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!engine) return
    fetch('/api/engines')
      .then(r => r.json())
      .then(d => {
        const found = d.engines?.find((e: { slug: string; spotsRemaining: number }) => e.slug === engineSlug)
        if (found) setSpotsRemaining(found.spotsRemaining)
      })
      .catch(() => {})
  }, [engineSlug, engine])

  if (!engine) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', marginBottom: 16 }}>Engine not found.</p>
          <a href="/" style={{ color: '#EF9F27' }}>← Back to all engines</a>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!agreed) { setError('You must agree to provide feedback within 7 days.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, engineSlug: engine!.slug, agreedFeedback: agreed }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Signup failed — please try again.'); return }
      setSuccess(true)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0d1b2a', border: '1px solid #2d4a63', borderRadius: 8,
    padding: '11px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none',
  }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>Check your email</h1>
          <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>
            We&apos;ve sent a verification link to <strong style={{ color: '#e2e8f0' }}>{form.email}</strong>.
            Click it to confirm your spot and get access.
          </p>
          <a href="/" style={{ color: '#EF9F27', fontSize: 14, textDecoration: 'none' }}>← View all engines</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Orbital bg */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {[400, 700, 1000].map((size, i) => (
          <div key={i} style={{ position: 'absolute', width: size, height: size, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', borderRadius: '50%', border: '1px solid rgba(239,159,39,0.05)' }} />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px' }}>
        <a href="/" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>← All engines</a>

        {/* Engine header */}
        <div style={{ background: '#1e2d3d', border: '1px solid #2d4a63', borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#f1f5f9' }}>{engine.name}</h1>
            <span style={{ background: '#EF9F27', color: '#1e2d3d', fontWeight: 700, fontSize: 10, padding: '3px 8px', borderRadius: 4, fontFamily: 'monospace', flexShrink: 0, marginLeft: 12, alignSelf: 'flex-start', marginTop: 4 }}>
              {engine.code}
            </span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>{engine.description}</p>

          {spotsRemaining !== null && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: spotsRemaining <= 10 ? '#ef4444' : '#22c55e', fontWeight: 600, marginBottom: 4 }}>
                {spotsRemaining} spots remaining
              </div>
              <div style={{ background: '#0d1b2a', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{ width: `${((100 - spotsRemaining) / 100) * 100}%`, height: '100%', background: spotsRemaining <= 10 ? '#ef4444' : '#22c55e', borderRadius: 4 }} />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              ['∞', 'Free lifetime access'],
              ['$100', 'Pro credit'],
              ['★', 'Founding Tester status'],
              ['⚡', 'Early access always'],
            ].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 13 }}>
                <span style={{ color: '#EF9F27' }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div style={{ background: '#1e2d3d', border: '1px solid #2d4a63', borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Your testing checklist</h2>
          <ol style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {engine.checklist.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: '#cbd5e1', lineHeight: 1.5 }}>
                <span style={{ color: '#EF9F27', fontWeight: 700, minWidth: 20, flexShrink: 0, fontFamily: 'monospace' }}>{i + 1}.</span>
                {item}
              </li>
            ))}
          </ol>
        </div>

        {/* Form */}
        <div style={{ background: '#1e2d3d', border: '1px solid #2d4a63', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>Apply to be a Founding Tester</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Honeypot */}
            <input
              type="text"
              name="website"
              value={form.honeypot}
              onChange={e => setForm(f => ({ ...f, honeypot: e.target.value }))}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <label style={labelStyle}>Full name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <label style={labelStyle}>Phone (optional)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+44 7700 900000"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Country *</label>
                <select
                  required
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <label style={labelStyle}>Device *</label>
                <select
                  required
                  value={form.device}
                  onChange={e => setForm(f => ({ ...f, device: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Select device</option>
                  <option value="Mobile">Mobile</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Browser *</label>
                <select
                  required
                  value={form.browser}
                  onChange={e => setForm(f => ({ ...f, browser: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Select browser</option>
                  <option value="Chrome">Chrome</option>
                  <option value="Safari">Safari</option>
                  <option value="Firefox">Firefox</option>
                  <option value="Edge">Edge</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', color: '#cbd5e1', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              I agree to provide honest, specific feedback within 7 days.
            </label>

            {error && (
              <div style={{ background: '#2d1515', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#fca5a5' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: submitting ? '#b37819' : '#EF9F27',
                color: '#1e2d3d',
                fontWeight: 700,
                fontSize: 15,
                padding: '13px 24px',
                borderRadius: 8,
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {submitting ? 'Applying…' : 'Apply to be a Founding Tester →'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40, color: '#4b6278', fontSize: 13 }}>
          No ads. No investors. No agenda. — <a href="https://hive.baby" style={{ color: '#EF9F27', textDecoration: 'none' }}>Hive</a>
        </div>
      </div>
    </div>
  )
}
