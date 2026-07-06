'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface EngineWithSlots {
  slug: string
  code: string
  name: string
  description: string
  maxTesters: number
  currentTesters: number
  spotsRemaining: number
  isFull: boolean
}

function ProgressBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min(100, (current / max) * 100)
  const color = pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#22c55e'
  return (
    <div style={{ background: '#0d1b2a', borderRadius: 4, height: 6, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
    </div>
  )
}

function EngineCard({ engine }: { engine: EngineWithSlots }) {
  return (
    <div style={{
      background: '#1e2d3d',
      border: engine.isFull ? '1px solid #2d3748' : '1px solid #2d4a63',
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      opacity: engine.isFull ? 0.55 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3 }}>{engine.name}</h3>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', background: '#0d1b2a', padding: '2px 7px', borderRadius: 4, fontFamily: 'monospace', flexShrink: 0 }}>
          {engine.code}
        </span>
      </div>
      <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, flexGrow: 1 }}>{engine.description}</p>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: engine.isFull ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
            {engine.isFull ? 'Full' : `${engine.spotsRemaining} spots left`}
          </span>
          <span style={{ color: '#4b6278' }}>{engine.currentTesters}/{engine.maxTesters}</span>
        </div>
        <ProgressBar current={engine.currentTesters} max={engine.maxTesters} />
      </div>
      {engine.isFull ? (
        <div style={{ textAlign: 'center', color: '#4b6278', fontSize: 13, padding: '9px 14px', border: '1px solid #2d3748', borderRadius: 8 }}>
          Applications closed
        </div>
      ) : (
        <Link href={`/test/${engine.slug}`} style={{
          display: 'block', textAlign: 'center', background: '#EF9F27', color: '#1e2d3d',
          fontWeight: 700, fontSize: 14, padding: '10px 16px', borderRadius: 8, textDecoration: 'none',
        }}>
          Apply to test →
        </Link>
      )}
    </div>
  )
}

export default function HomePage() {
  const [engines, setEngines] = useState<EngineWithSlots[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/engines')
      .then(r => r.json())
      .then(d => setEngines(d.engines ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Orbital grid */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {[400, 650, 900, 1150, 1400].map((size, i) => (
          <div key={i} className="orbital-ring" style={{ width: size, height: size, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '48px 20px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="badge-gold" style={{ marginBottom: 20 }}>Founding Tester Programme</div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 16, color: '#f1f5f9' }}>
            Help build the Hive.<br />
            <span style={{ color: '#EF9F27' }}>Get paid in access.</span>
          </h1>
          <p style={{ fontSize: 17, color: '#94a3b8', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.65 }}>
            The first 100 testers for each engine get free lifetime access and $100 in Pro credit.
          </p>
          <div style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['∞', 'Free lifetime access'], ['$', '$100 Pro credit'], ['★', 'Founding Tester status'], ['⚡', 'Early access, always']].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#cbd5e1', fontSize: 14 }}>
                <span style={{ color: '#EF9F27', fontSize: 15 }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#4b6278', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 24 }}>
          Engines available to test
        </h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 64, color: '#4b6278' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
            {engines.map(e => <EngineCard key={e.slug} engine={e} />)}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 64, color: '#4b6278', fontSize: 13, borderTop: '1px solid #1e2d3d', paddingTop: 32 }}>
          No ads. No investors. No agenda. —{' '}
          <a href="https://hive.baby" style={{ color: '#EF9F27', textDecoration: 'none' }}>Hive</a>
        </div>
      </div>
    </div>
  )
}



<!-- Stripe Checkout Block -->
<div id="stripe-checkout-cta" style="margin: 2rem auto; padding: 2rem; border-radius: 12px; background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.2); text-align: center; font-family: sans-serif; max-width: 600px;">
    <h3 style="margin-top: 0; color: #fff;">Activate Premium License</h3>
    <p style="color: #9ca3af; font-size: 0.95rem; margin-bottom: 1.5rem;">Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/6oU00lb2L6F37bIazv0RG0J" target="_blank" style="display: inline-block; padding: 0.8rem 2rem; background: #3b82f6; color: #fff; font-weight: bold; border-radius: 8px; text-decoration: none; transition: background 0.2s;">Unlock Now</a>
</div>
