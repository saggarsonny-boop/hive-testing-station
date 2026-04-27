'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ENGINES } from '@/lib/engines'

interface Tester {
  tester_id: string
  name: string
  engine_slug: string
  engine_name: string
}

function ConfirmContent() {
  const params = useSearchParams()
  const id = params.get('id')
  const [tester, setTester] = useState<Tester | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) { setError('No tester ID provided.'); setLoading(false); return }
    fetch(`/api/tester?id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => {
        if (d.tester) setTester(d.tester)
        else setError('Tester not found. Check your email for the verification link.')
      })
      .catch(() => setError('Could not load tester details.'))
      .finally(() => setLoading(false))
  }, [id])

  const engine = tester ? ENGINES.find(e => e.slug === tester.engine_slug) : null
  const testerNumber = tester ? parseInt(tester.tester_id.split('-')[1] ?? '1', 10) : 0

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 64, color: '#64748b' }}>Loading…</div>
  }

  if (error || !tester) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: '#94a3b8', marginBottom: 16 }}>{error || 'Something went wrong.'}</p>
        <a href="/" style={{ color: '#EF9F27', textDecoration: 'none', fontSize: 14 }}>← Back to engines</a>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
      {/* Badge */}
      <div style={{
        display: 'inline-block',
        background: 'linear-gradient(135deg, #EF9F27, #d4850f)',
        color: '#1e2d3d',
        fontWeight: 800,
        fontSize: 13,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '6px 18px',
        borderRadius: 24,
        marginBottom: 24,
      }}>
        Founding Tester #{testerNumber}
      </div>

      <h1 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, color: '#f1f5f9', marginBottom: 12, lineHeight: 1.2 }}>
        You&apos;re in, {tester.name.split(' ')[0]}.
      </h1>
      <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 32, lineHeight: 1.6 }}>
        Welcome to the founding tester programme for <strong style={{ color: '#EF9F27' }}>{tester.engine_name}</strong>.
        Your tester kit has been sent to your email.
      </p>

      {/* Tester ID card */}
      <div style={{
        background: '#1e2d3d',
        border: '1px solid #EF9F27',
        borderRadius: 12,
        padding: '24px 28px',
        marginBottom: 32,
        display: 'inline-block',
        minWidth: 280,
      }}>
        <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Your Tester ID</p>
        <p style={{ fontSize: 32, fontWeight: 800, color: '#EF9F27', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
          {tester.tester_id}
        </p>
      </div>

      {/* CTA */}
      {engine && (
        <div style={{ marginBottom: 32 }}>
          <a href={engine.url} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-block',
            background: '#EF9F27',
            color: '#1e2d3d',
            fontWeight: 700,
            fontSize: 15,
            padding: '12px 28px',
            borderRadius: 8,
            textDecoration: 'none',
            marginBottom: 16,
          }}>
            Open {tester.engine_name} →
          </a>
        </div>
      )}

      {/* Checklist */}
      {engine && (
        <div style={{ background: '#1e2d3d', border: '1px solid #2d4a63', borderRadius: 12, padding: 24, textAlign: 'left', marginBottom: 32 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Your testing checklist</h2>
          <ol style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {engine.checklist.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>
                <span style={{ color: '#EF9F27', fontWeight: 700, minWidth: 20, flexShrink: 0, fontFamily: 'monospace' }}>{i + 1}.</span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Feedback instructions */}
      <div style={{ background: '#162233', border: '1px solid #2d4a63', borderRadius: 12, padding: 20, marginBottom: 32, textAlign: 'left' }}>
        <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.65 }}>
          Email your feedback to{' '}
          <a href={`mailto:hive@hive.baby?subject=${encodeURIComponent(`Feedback from ${tester.tester_id}`)}`} style={{ color: '#EF9F27', textDecoration: 'none', fontWeight: 600 }}>
            hive@hive.baby
          </a>{' '}
          with your tester ID <strong style={{ color: '#EF9F27', fontFamily: 'monospace' }}>{tester.tester_id}</strong> in the subject line.
          Deadline: 7 days.
        </p>
      </div>

      <p style={{ color: '#4b6278', fontSize: 13 }}>
        Or use our{' '}
        <a href="/feedback" style={{ color: '#EF9F27', textDecoration: 'none' }}>online feedback form</a>.
      </p>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {[400, 700, 1000].map((size, i) => (
          <div key={i} style={{ position: 'absolute', width: size, height: size, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', borderRadius: '50%', border: '1px solid rgba(239,159,39,0.05)' }} />
        ))}
      </div>
      <div style={{ position: 'relative', zIndex: 1, padding: '60px 20px 80px', display: 'flex', justifyContent: 'center' }}>
        <Suspense fallback={<div style={{ color: '#64748b' }}>Loading…</div>}>
          <ConfirmContent />
        </Suspense>
      </div>
    </div>
  )
}
