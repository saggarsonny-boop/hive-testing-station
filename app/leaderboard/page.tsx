'use client'
import { useEffect, useState } from 'react'

interface LeaderboardEntry {
  rank: number
  testerId: string
  name: string
  enginesTested: number
  itemsTested: number
  issuesFound: number
  status: 'FOUNDING' | 'VERIFIED' | 'ACTIVE'
}

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  FOUNDING: { bg: 'rgba(239,159,39,0.15)', color: '#EF9F27', border: 'rgba(239,159,39,0.4)' },
  VERIFIED: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.35)' },
  ACTIVE:   { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: 'rgba(96,165,250,0.35)' },
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => {
        if (d.leaderboard) setLeaderboard(d.leaderboard)
        else setError(d.error || 'Failed to load leaderboard.')
      })
      .catch(() => setError('Network error — please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
  }

  const innerStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 1,
    maxWidth: 860,
    margin: '0 auto',
    padding: '40px 20px 80px',
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#64748b',
    borderBottom: '1px solid #2d4a63',
    whiteSpace: 'nowrap',
  }

  const tdStyle: React.CSSProperties = {
    padding: '12px 14px',
    fontSize: 14,
    color: '#cbd5e1',
    borderBottom: '1px solid #1a2d3e',
    verticalAlign: 'middle',
  }

  return (
    <div style={containerStyle}>
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
          href="/"
          style={{ color: '#64748b', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}
        >
          ← Hive Testing Station
        </a>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#f1f5f9', marginBottom: 8, margin: 0 }}>
            Leaderboard
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            Founding Testers ranked by contribution
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 64, color: '#64748b', fontSize: 14 }}>
            Loading…
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div style={{
            background: '#2d1515',
            border: '1px solid #7f1d1d',
            borderRadius: 10,
            padding: '16px 20px',
            color: '#fca5a5',
            fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && leaderboard.length === 0 && (
          <div style={{ textAlign: 'center', padding: 64, color: '#64748b', fontSize: 14 }}>
            No verified testers yet.
          </div>
        )}

        {/* Table */}
        {!loading && !error && leaderboard.length > 0 && (
          <div style={{
            background: '#1e2d3d',
            border: '1px solid #2d4a63',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                <thead>
                  <tr style={{ background: '#162233' }}>
                    <th style={{ ...thStyle, width: 48 }}>#</th>
                    <th style={thStyle}>Tester ID</th>
                    <th style={thStyle}>Name</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Engines</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Items</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Issues</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr
                      key={entry.testerId}
                      style={{
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                        transition: 'background 0.1s',
                      }}
                    >
                      {/* Rank */}
                      <td style={{ ...tdStyle, color: entry.rank <= 3 ? '#EF9F27' : '#4b6278', fontWeight: entry.rank <= 3 ? 700 : 400 }}>
                        {entry.rank}
                      </td>

                      {/* Tester ID */}
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 13, color: '#94a3b8', letterSpacing: '0.04em' }}>
                        {entry.testerId}
                      </td>

                      {/* Name */}
                      <td style={{ ...tdStyle, color: '#f1f5f9', fontWeight: 500 }}>
                        {entry.name}
                      </td>

                      {/* Engines */}
                      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {entry.enginesTested}
                      </td>

                      {/* Items */}
                      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {entry.itemsTested}
                      </td>

                      {/* Issues */}
                      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {entry.issuesFound}
                      </td>

                      {/* Status badge */}
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.07em',
                          background: STATUS_COLORS[entry.status].bg,
                          color: STATUS_COLORS[entry.status].color,
                          border: `1px solid ${STATUS_COLORS[entry.status].border}`,
                        }}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 48, color: '#4b6278', fontSize: 13 }}>
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
