'use client'
import { useState } from 'react'
import { ENGINES } from '@/lib/engines'

export default function FeedbackPage() {
  const [form, setForm] = useState({
    testerId: '', engineSlug: '', overallRating: 0,
    whatWorked: '', whatBroke: '', uiIssues: '',
    wouldUseRegularly: '' as '' | 'yes' | 'no',
    anythingElse: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.testerId || !form.engineSlug || !form.overallRating) {
      setError('Tester ID, engine, and rating are required.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          wouldUseRegularly: form.wouldUseRegularly === 'yes' ? true : form.wouldUseRegularly === 'no' ? false : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Submission failed.'); return }
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
  const taStyle: React.CSSProperties = { ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>Feedback received.</h1>
          <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>
            Thank you. Your feedback directly shapes what we build next.
          </p>
          <a href="/" style={{ color: '#EF9F27', textDecoration: 'none', fontSize: 14 }}>← Back to Hive Testing Station</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {[500, 800, 1100].map((size, i) => (
          <div key={i} style={{ position: 'absolute', width: size, height: size, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', borderRadius: '50%', border: '1px solid rgba(239,159,39,0.05)' }} />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px' }}>
        <a href="/" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>← Hive Testing Station</a>

        <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>Submit your feedback</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
          Your honest feedback shapes what we build next. It takes about 5 minutes.
        </p>

        <div style={{ background: '#1e2d3d', border: '1px solid #2d4a63', borderRadius: 12, padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <label style={labelStyle}>Tester ID *</label>
                <input
                  type="text"
                  required
                  value={form.testerId}
                  onChange={e => setForm(f => ({ ...f, testerId: e.target.value.toUpperCase() }))}
                  placeholder="HPHT-0001"
                  style={{ ...inputStyle, textTransform: 'uppercase', fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Engine tested *</label>
                <select
                  required
                  value={form.engineSlug}
                  onChange={e => setForm(f => ({ ...f, engineSlug: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Select engine</option>
                  {ENGINES.map(e => <option key={e.slug} value={e.slug}>{e.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Overall rating *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, overallRating: n }))}
                    style={{
                      width: 44, height: 44, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 20,
                      background: form.overallRating >= n ? '#EF9F27' : '#0d1b2a',
                      color: form.overallRating >= n ? '#1e2d3d' : '#4b6278',
                      transition: 'background 0.15s',
                    }}
                  >
                    ★
                  </button>
                ))}
                {form.overallRating > 0 && (
                  <span style={{ color: '#94a3b8', fontSize: 13, alignSelf: 'center', marginLeft: 8 }}>
                    {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][form.overallRating]}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label style={labelStyle}>What worked well?</label>
              <textarea
                value={form.whatWorked}
                onChange={e => setForm(f => ({ ...f, whatWorked: e.target.value }))}
                placeholder="What went smoothly? What did you like?"
                style={taStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>What was broken or confusing?</label>
              <textarea
                value={form.whatBroke}
                onChange={e => setForm(f => ({ ...f, whatBroke: e.target.value }))}
                placeholder="Bugs, errors, anything that didn't work as expected?"
                style={taStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>UI/UX issues</label>
              <textarea
                value={form.uiIssues}
                onChange={e => setForm(f => ({ ...f, uiIssues: e.target.value }))}
                placeholder="Layout, navigation, mobile issues, accessibility, anything visual?"
                style={taStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Would you use this regularly?</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['yes', 'no'] as const).map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, wouldUseRegularly: val }))}
                    style={{
                      padding: '9px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                      background: form.wouldUseRegularly === val ? '#EF9F27' : '#0d1b2a',
                      color: form.wouldUseRegularly === val ? '#1e2d3d' : '#94a3b8',
                      transition: 'background 0.15s',
                    }}
                  >
                    {val === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Anything else?</label>
              <textarea
                value={form.anythingElse}
                onChange={e => setForm(f => ({ ...f, anythingElse: e.target.value }))}
                placeholder="Feature requests, general impressions, anything we missed?"
                style={taStyle}
              />
            </div>

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
                color: '#1e2d3d', fontWeight: 700, fontSize: 15,
                padding: '13px 24px', borderRadius: 8, border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Submitting…' : 'Submit feedback →'}
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
