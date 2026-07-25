'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FeedbackEntryPage() {
  const router = useRouter()
  const [testerId, setTesterId] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = testerId.trim().toUpperCase()
    if (!clean) return
    router.push(`/feedback/${clean}`)
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
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
              border: '1px solid rgba(239,159,39,0.05)',
            }}
          />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Back link */}
        <a
          href="/"
          style={{ color: '#64748b', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}
        >
          ← Hive Testing Station
        </a>

        {/* Heading */}
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>
          Submit feedback
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 36, lineHeight: 1.65 }}>
          Enter your Tester ID to open your personalised feedback checklist.
        </p>

        {/* Form */}
        <div style={{
          background: '#1e2d3d',
          border: '1px solid #2d4a63',
          borderRadius: 12,
          padding: '28px 24px',
          marginBottom: 28,
        }}>
          <form onSubmit={handleSubmit}>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#64748b',
              marginBottom: 8,
            }}>
              Tester ID
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                value={testerId}
                onChange={e => setTesterId(e.target.value.toUpperCase())}
                placeholder="HPHT-0001"
                autoFocus
                spellCheck={false}
                autoComplete="off"
                style={{
                  flex: 1,
                  background: '#0d1b2a',
                  border: '1px solid #2d4a63',
                  borderRadius: 8,
                  padding: '11px 14px',
                  color: '#EF9F27',
                  fontSize: 16,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  outline: 'none',
                  textTransform: 'uppercase',
                }}
              />
              <button
                type="submit"
                disabled={!testerId.trim()}
                style={{
                  padding: '11px 22px',
                  borderRadius: 8,
                  border: 'none',
                  background: testerId.trim() ? '#EF9F27' : '#2d4a63',
                  color: testerId.trim() ? '#1e2d3d' : '#4b6278',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: testerId.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                  transition: 'all 0.12s',
                }}
              >
                Go →
              </button>
            </div>
          </form>
        </div>

        {/* Direct link hint */}
        <div style={{
          background: '#162233',
          border: '1px solid #2d4a63',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 40,
        }}>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Direct link format:{' '}
            <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 12 }}>
              test.hive.baby/feedback/XXXX-0000
            </span>
          </p>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#4b6278', fontSize: 13 }}>
          No ads. No investors. No agenda. —{' '}
          <a href="https://hive.baby" style={{ color: '#EF9F27', textDecoration: 'none' }}>Hive</a>
        </div>
      </div>
    </div>
  )
}
