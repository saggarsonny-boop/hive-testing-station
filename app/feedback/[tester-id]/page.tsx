'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ENGINES } from '@/lib/engines'

interface ChecklistResponse {
  item: number
  question: string
  result: 'pass' | 'fail' | 'partial' | ''
  severity: 'minor' | 'major' | 'blocker' | ''
  comment: string
}

interface Tester {
  tester_id: string
  name: string
  engine_slug: string
  engine_name: string
  email_verified: boolean
}

function computeRating(responses: ChecklistResponse[]): number {
  const passCount = responses.filter(r => r.result === 'pass').length
  if (passCount >= 10) return 5
  if (passCount >= 8) return 4
  if (passCount >= 6) return 3
  if (passCount >= 4) return 2
  return 1
}

export default function FeedbackTesterPage({ params }: { params: { 'tester-id': string } }) {
  const router = useRouter()
  const testerId = params['tester-id']

  const [tester, setTester] = useState<Tester | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  const [responses, setResponses] = useState<ChecklistResponse[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!testerId) {
      router.push('/feedback')
      return
    }
    fetch(`/api/tester?id=${encodeURIComponent(testerId)}`)
      .then(r => r.json())
      .then(d => {
        if (!d.tester) {
          setLoadError('Tester not found. Check your tester ID.')
          return
        }
        const t = d.tester as Tester
        if (!t.email_verified) {
          setLoadError('Email not verified. Please check your inbox.')
          return
        }
        setTester(t)
        const engine = ENGINES.find(e => e.slug === t.engine_slug)
        if (engine) {
          setResponses(
            engine.checklist.map((question, i) => ({
              item: i + 1,
              question,
              result: '',
              severity: '',
              comment: '',
            }))
          )
        } else {
          setLoadError('Engine not found for this tester.')
        }
      })
      .catch(() => setLoadError('Network error — please try again.'))
      .finally(() => setLoading(false))
  }, [testerId, router])

  function updateResponse(index: number, update: Partial<ChecklistResponse>) {
    setResponses(prev => prev.map((r, i) => i === index ? { ...r, ...update } : r))
  }

  const completedCount = responses.filter(r => r.result !== '').length
  const allComplete = responses.length > 0 && completedCount === responses.length

  async function handleSubmit() {
    if (!tester || !allComplete) return
    setSubmitError('')
    setSubmitting(true)
    try {
      const overallRating = computeRating(responses)
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testerId: tester.tester_id,
          engineSlug: tester.engine_slug,
          overallRating,
          checklistResponses: responses,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error || 'Submission failed.')
        return
      }
      setSuccess(true)
    } catch {
      setSubmitError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
  }

  const innerStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 1,
    maxWidth: 680,
    margin: '0 auto',
    padding: '40px 20px 80px',
  }

  const cardStyle: React.CSSProperties = {
    background: '#1e2d3d',
    border: '1px solid #2d4a63',
    borderRadius: 12,
    padding: '20px 22px',
    marginBottom: 14,
  }

  const questionStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#f1f5f9',
    fontWeight: 600,
    lineHeight: 1.55,
    marginBottom: 14,
  }

  const itemNumStyle: React.CSSProperties = {
    color: '#EF9F27',
    fontFamily: 'monospace',
    fontWeight: 700,
    marginRight: 8,
    flexShrink: 0,
  }

  const toggleRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 10,
  }

  function resultBtn(
    label: string,
    value: 'pass' | 'fail' | 'partial',
    current: 'pass' | 'fail' | 'partial' | '',
    onClick: () => void
  ) {
    const activeColors: Record<string, { bg: string; color: string; border: string }> = {
      pass:    { bg: 'rgba(34,197,94,0.18)',  color: '#4ade80', border: 'rgba(34,197,94,0.5)' },
      partial: { bg: 'rgba(239,159,39,0.18)', color: '#EF9F27', border: 'rgba(239,159,39,0.5)' },
      fail:    { bg: 'rgba(239,68,68,0.18)',  color: '#f87171', border: 'rgba(239,68,68,0.5)' },
    }
    const isActive = current === value
    const active = activeColors[value]
    return (
      <button
        key={value}
        type="button"
        onClick={onClick}
        style={{
          padding: '7px 16px',
          borderRadius: 7,
          border: isActive ? `1px solid ${active.border}` : '1px solid #2d4a63',
          background: isActive ? active.bg : '#0d1b2a',
          color: isActive ? active.color : '#64748b',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.12s',
        }}
      >
        {label}
      </button>
    )
  }

  function severityBtn(
    label: string,
    value: 'minor' | 'major' | 'blocker',
    current: 'minor' | 'major' | 'blocker' | '',
    onClick: () => void
  ) {
    const severityColors: Record<string, { bg: string; color: string; border: string }> = {
      minor:   { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24', border: 'rgba(251,191,36,0.45)' },
      major:   { bg: 'rgba(249,115,22,0.15)',  color: '#fb923c', border: 'rgba(249,115,22,0.45)' },
      blocker: { bg: 'rgba(239,68,68,0.18)',   color: '#f87171', border: 'rgba(239,68,68,0.5)' },
    }
    const isActive = current === value
    const s = severityColors[value]
    return (
      <button
        key={value}
        type="button"
        onClick={onClick}
        style={{
          padding: '5px 13px',
          borderRadius: 6,
          border: isActive ? `1px solid ${s.border}` : '1px solid #2d4a63',
          background: isActive ? s.bg : '#0d1b2a',
          color: isActive ? s.color : '#64748b',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.12s',
        }}
      >
        {label}
      </button>
    )
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#64748b', fontSize: 14 }}>Loading…</div>
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────────────────────

  if (loadError || !tester) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <p style={{ color: '#94a3b8', marginBottom: 20, fontSize: 15, lineHeight: 1.6 }}>
            {loadError || 'Something went wrong.'}
          </p>
          <a href="/feedback" style={{ color: '#EF9F27', textDecoration: 'none', fontSize: 14 }}>
            ← Back to feedback
          </a>
        </div>
      </div>
    )
  }

  // ── Success ─────────────────────────────────────────────────────────────────

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #EF9F27, #d4850f)',
            color: '#1e2d3d',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '5px 16px',
            borderRadius: 24,
            marginBottom: 24,
          }}>
            Feedback received
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>
            Thank you, {tester.name.split(' ')[0]}.
          </h1>
          <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: 28 }}>
            Your checklist responses for <strong style={{ color: '#EF9F27' }}>{tester.engine_name}</strong> have been recorded.
            Every item you tested helps us ship a better product.
          </p>
          <a
            href="/leaderboard"
            style={{
              display: 'inline-block',
              background: '#EF9F27',
              color: '#1e2d3d',
              fontWeight: 700,
              fontSize: 14,
              padding: '10px 24px',
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            View leaderboard →
          </a>
        </div>
      </div>
    )
  }

  // ── Main form ───────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* Ambient rings */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {[500, 800, 1100].map((size, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: '1px solid rgba(239,159,39,0.04)',
            }}
          />
        ))}
      </div>

      <div style={innerStyle}>
        {/* Back link */}
        <a
          href="/feedback"
          style={{ color: '#64748b', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}
        >
          ← Back
        </a>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: '#f1f5f9', margin: 0, marginBottom: 6 }}>
              Feedback: {tester.engine_name}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
              Work through each checklist item. All items required before submitting.
            </p>
          </div>
          <div style={{
            background: '#1e2d3d',
            border: '1px solid #2d4a63',
            borderRadius: 8,
            padding: '7px 14px',
            fontSize: 13,
            fontFamily: 'monospace',
            color: '#EF9F27',
            fontWeight: 700,
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}>
            {tester.tester_id}
          </div>
        </div>

        {/* Progress counter */}
        <div style={{
          background: '#1e2d3d',
          border: `1px solid ${allComplete ? 'rgba(34,197,94,0.4)' : '#2d4a63'}`,
          borderRadius: 10,
          padding: '12px 18px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>
            Progress
          </span>
          <span style={{
            fontSize: 15,
            fontWeight: 700,
            color: allComplete ? '#4ade80' : '#EF9F27',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {completedCount} / {responses.length} completed
          </span>
        </div>

        {/* Checklist items */}
        {responses.map((resp, i) => (
          <div key={resp.item} style={{
            ...cardStyle,
            borderColor: resp.result === 'pass'
              ? 'rgba(34,197,94,0.3)'
              : resp.result === 'fail'
              ? 'rgba(239,68,68,0.3)'
              : resp.result === 'partial'
              ? 'rgba(239,159,39,0.3)'
              : '#2d4a63',
          }}>
            {/* Question */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 14 }}>
              <span style={itemNumStyle}>{resp.item}.</span>
              <span style={questionStyle}>{resp.question}</span>
            </div>

            {/* Result toggles */}
            <div style={toggleRowStyle}>
              {resultBtn('PASS', 'pass', resp.result, () =>
                updateResponse(i, { result: 'pass', severity: '' })
              )}
              {resultBtn('PARTIAL', 'partial', resp.result, () =>
                updateResponse(i, { result: 'partial' })
              )}
              {resultBtn('FAIL', 'fail', resp.result, () =>
                updateResponse(i, { result: 'fail' })
              )}
            </div>

            {/* Severity (only when fail) */}
            {resp.result === 'fail' && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7 }}>
                  Severity
                </div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {severityBtn('MINOR', 'minor', resp.severity, () =>
                    updateResponse(i, { severity: 'minor' })
                  )}
                  {severityBtn('MAJOR', 'major', resp.severity, () =>
                    updateResponse(i, { severity: 'major' })
                  )}
                  {severityBtn('BLOCKER', 'blocker', resp.severity, () =>
                    updateResponse(i, { severity: 'blocker' })
                  )}
                </div>
              </div>
            )}

            {/* Comment */}
            <input
              type="text"
              value={resp.comment}
              onChange={e => updateResponse(i, { comment: e.target.value.slice(0, 100) })}
              maxLength={100}
              placeholder="Optional note…"
              style={{
                width: '100%',
                background: '#0d1b2a',
                border: '1px solid #2d4a63',
                borderRadius: 7,
                padding: '8px 12px',
                color: '#e2e8f0',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            {resp.comment.length >= 90 && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, textAlign: 'right' }}>
                {resp.comment.length}/100
              </div>
            )}
          </div>
        ))}

        {/* Submit error */}
        {submitError && (
          <div style={{
            background: '#2d1515',
            border: '1px solid #7f1d1d',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: 14,
            color: '#fca5a5',
            marginBottom: 16,
          }}>
            {submitError}
          </div>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allComplete || submitting}
          style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: 9,
            border: 'none',
            background: allComplete && !submitting ? '#EF9F27' : '#2d4a63',
            color: allComplete && !submitting ? '#1e2d3d' : '#4b6278',
            fontWeight: 700,
            fontSize: 15,
            cursor: allComplete && !submitting ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
            marginTop: 8,
          }}
        >
          {submitting ? 'Submitting…' : allComplete ? 'Submit feedback →' : `Complete all ${responses.length} items to submit`}
        </button>

        <div style={{ textAlign: 'center', marginTop: 40, color: '#4b6278', fontSize: 13 }}>
          No ads. No investors. No agenda. —{' '}
          <a href="https://hive.baby" style={{ color: '#EF9F27', textDecoration: 'none' }}>Hive</a>
        </div>
      </div>
    </div>
  )
}
