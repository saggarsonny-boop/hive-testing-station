'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ENGINES } from '@/lib/engines'

const PLACEHOLDERS = [
  'Works perfectly',
  "Can't seem to get this to work",
  'May I suggest...',
  'Crashes when I try to...',
  'Took a while but eventually...',
  'Not sure what this is supposed to do',
  'Loved this feature',
  'This confused me',
]

type Status = 'worked' | 'partial' | 'failed' | null

interface Response {
  item: number
  question: string
  status: Status
  comment: string
}

interface Tester {
  tester_id: string
  name: string
  engine_slug: string
  engine_name: string
}

const STATUS_CFG = {
  worked:  { label: '✓ Worked',  sel: '#22c55e', bg: '#0f2a1a' },
  partial: { label: '~ Partial', sel: '#f59e0b', bg: '#2a1f0a' },
  failed:  { label: '✗ Failed',  sel: '#ef4444', bg: '#2a0f0f' },
} as const

export default function ConfirmPage() {
  const params = useParams()
  const testerId = (params['tester-id'] as string)?.toUpperCase()

  const [tester, setTester] = useState<Tester | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [responses, setResponses] = useState<Response[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [phIdx, setPhIdx] = useState(0)

  useEffect(() => {
    if (!testerId) { setError('No tester ID.'); setLoading(false); return }
    fetch(`/api/tester?id=${encodeURIComponent(testerId)}`)
      .then(r => r.json())
      .then(d => { if (d.tester) setTester(d.tester); else setError('Tester not found.') })
      .catch(() => setError('Could not load tester details.'))
      .finally(() => setLoading(false))
  }, [testerId])

  useEffect(() => {
    if (!tester) return
    const engine = ENGINES.find(e => e.slug === tester.engine_slug)
    if (!engine) return
    const saved = localStorage.getItem(`hive_feedback_${testerId}`)
    if (saved) { try { setResponses(JSON.parse(saved)); return } catch { /* ignore */ } }
    setResponses(engine.checklist.map((q, i) => ({ item: i + 1, question: q, status: null, comment: '' })))
  }, [tester, testerId])

  useEffect(() => {
    if (!testerId || !responses.length) return
    localStorage.setItem(`hive_feedback_${testerId}`, JSON.stringify(responses))
  }, [responses, testerId])

  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 3000)
    return () => clearInterval(t)
  }, [])

  const setStatus = useCallback((item: number, status: Status) => {
    setResponses(prev => prev.map(r => r.item === item ? { ...r, status } : r))
  }, [])

  const setComment = useCallback((item: number, comment: string) => {
    setResponses(prev => prev.map(r => r.item === item ? { ...r, comment: comment.slice(0, 150) } : r))
  }, [])

  const selectedCount = responses.filter(r => r.status !== null).length
  const canSubmit = selectedCount >= 5

  const handleSubmit = async () => {
    if (!canSubmit || submitting || !tester) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch(`/api/feedback/${testerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engineSlug: tester.engine_slug, responses }),
      })
      const data = await res.json()
      if (res.ok) {
        setSubmitted(true)
        localStorage.removeItem(`hive_feedback_${testerId}`)
      } else {
        setSubmitError(data.error || 'Submission failed. Please try again.')
      }
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const engine = tester ? ENGINES.find(e => e.slug === tester.engine_slug) : null
  const testerNumber = tester ? parseInt(tester.tester_id.split('-')[1] ?? '1', 10) : 0

  if (loading) return <Shell><div style={{ textAlign: 'center', padding: 64, color: '#64748b' }}>Loading…</div></Shell>

  if (error || !tester) {
    return (
      <Shell>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: '#94a3b8', marginBottom: 16 }}>{error || 'Something went wrong.'}</p>
          <a href="/" style={{ color: '#EF9F27', textDecoration: 'none', fontSize: 14 }}>← Back to engines</a>
        </div>
      </Shell>
    )
  }

  if (submitted) {
    return (
      <Shell>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#0f2a1a', border: '2px solid #22c55e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px', fontSize: 32,
          }}>✓</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>Well done.</h1>
          <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.6, marginBottom: 8 }}>
            Your feedback has been received.
          </p>
          <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.6 }}>
            Your <strong style={{ color: '#EF9F27' }}>$100 credit</strong> is being processed.
          </p>
        </div>
      </Shell>
    )
  }

  const progressPct = Math.min(100, (selectedCount / Math.max(responses.length, 1)) * 100)

  return (
    <Shell>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #EF9F27, #d4850f)',
            color: '#1e2d3d', fontWeight: 800, fontSize: 12,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '5px 16px', borderRadius: 24, marginBottom: 18,
          }}>
            Founding Tester #{testerNumber}
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: '#f1f5f9', marginBottom: 8, lineHeight: 1.2 }}>
            You&apos;re in, {tester.name.split(' ')[0]}.
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
            Testing <strong style={{ color: '#EF9F27' }}>{tester.engine_name}</strong>
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{
              background: '#1e2d3d', border: '1px solid #EF9F27', borderRadius: 10,
              padding: '8px 18px', display: 'inline-flex', gap: 10, alignItems: 'center',
            }}>
              <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ID</span>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#EF9F27', fontFamily: 'monospace' }}>{tester.tester_id}</span>
            </div>
            {engine && (
              <a href={engine.url} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center',
                background: '#EF9F27', color: '#1e2d3d', fontWeight: 700, fontSize: 13,
                padding: '8px 18px', borderRadius: 10, textDecoration: 'none',
              }}>
                Open {tester.engine_name} →
              </a>
            )}
          </div>
        </div>

        {/* Feedback table */}
        <div style={{ background: '#1e2d3d', border: '1px solid #2d4a63', borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #2d4a63',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#162233',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>Testing Checklist</span>
            <span style={{ fontSize: 11, color: '#4b6278' }}>Select a status for each item · notes optional</span>
          </div>
          {responses.map((r, idx) => (
            <Row
              key={r.item}
              response={r}
              placeholder={PLACEHOLDERS[(phIdx + idx) % PLACEHOLDERS.length]}
              isLast={idx === responses.length - 1}
              onStatus={setStatus}
              onComment={setComment}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              {selectedCount} / {responses.length} items responded
            </span>
            {!canSubmit && (
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {5 - selectedCount} more to enable submit
              </span>
            )}
          </div>
          <div style={{ background: '#162233', borderRadius: 6, height: 7, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 6,
              background: canSubmit ? '#22c55e' : '#EF9F27',
              width: `${progressPct}%`,
              transition: 'width 0.3s ease, background 0.3s ease',
            }} />
          </div>
        </div>

        {/* Submit */}
        <div style={{ textAlign: 'center' }}>
          {submitError && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{submitError}</p>}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            style={{
              display: 'block', width: '100%',
              background: canSubmit ? '#22c55e' : '#1e2d3d',
              color: canSubmit ? '#fff' : '#4b6278',
              border: `2px solid ${canSubmit ? '#22c55e' : '#2d4a63'}`,
              borderRadius: 10, fontSize: 15, fontWeight: 700,
              padding: '15px 28px',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit', marginBottom: 12,
            }}
          >
            {submitting ? 'Submitting…' : 'Submit Feedback'}
          </button>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            Your <strong style={{ color: '#EF9F27' }}>$100 credit</strong> activates when you submit
          </p>
        </div>
      </div>
    </Shell>
  )
}

function Row({ response, placeholder, isLast, onStatus, onComment }: {
  response: Response
  placeholder: string
  isLast: boolean
  onStatus: (item: number, status: Status) => void
  onComment: (item: number, comment: string) => void
}) {
  return (
    <div style={{
      display: 'flex', gap: 0, flexWrap: 'wrap',
      borderBottom: isLast ? 'none' : '1px solid #1e3347',
      padding: '14px 20px',
    }}>
      {/* Left 60% */}
      <div style={{ flex: '0 0 60%', minWidth: 240, paddingRight: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
          <span style={{ color: '#EF9F27', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', minWidth: 20, flexShrink: 0, paddingTop: 2 }}>
            {response.item}.
          </span>
          <span style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>{response.question}</span>
        </div>
        <div style={{ display: 'flex', gap: 5, paddingLeft: 28 }}>
          {(['worked', 'partial', 'failed'] as const).map(s => {
            const cfg = STATUS_CFG[s]
            const selected = response.status === s
            return (
              <button
                key={s}
                onClick={() => onStatus(response.item, selected ? null : s)}
                style={{
                  background: selected ? cfg.sel : cfg.bg,
                  color: selected ? '#fff' : cfg.sel,
                  border: `1px solid ${cfg.sel}`,
                  borderRadius: 20, fontSize: 11, fontWeight: 600,
                  padding: '3px 10px', cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s ease',
                  opacity: response.status !== null && !selected ? 0.45 : 1,
                }}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>
      {/* Right 40% */}
      <div style={{ flex: '0 0 40%', minWidth: 180, display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          className="feedback-input"
          value={response.comment}
          onChange={e => onComment(response.item, e.target.value)}
          placeholder={placeholder}
          maxLength={150}
          style={{
            width: '100%', background: '#0d1b2a',
            border: '1px solid #2d4a63', borderRadius: 7,
            color: '#cbd5e1', fontSize: 12,
            padding: '7px 10px', fontFamily: 'inherit',
          }}
        />
      </div>
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {[400, 700, 1000].map((s, i) => (
          <div key={i} style={{
            position: 'absolute', width: s, height: s,
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            borderRadius: '50%', border: '1px solid rgba(239,159,39,0.05)',
          }} />
        ))}
      </div>
      <div style={{ position: 'relative', zIndex: 1, padding: '48px 20px 80px' }}>
        {children}
      </div>
    </div>
  )
}
