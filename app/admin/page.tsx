'use client'
import { useEffect, useState, useCallback } from 'react'

interface Tester {
  tester_id: string
  name: string
  email: string
  engine_slug: string
  engine_name: string
  country: string
  device: string
  browser: string
  email_verified: boolean
  feedback_submitted: boolean
  feedback_at: string | null
  credit_earned_usd: number
  credit_granted_usd: number
  stripe_customer_id: string | null
  engines_tested: string[]
  engines_tested_count: number
  notes: string | null
  created_at: string
}

interface Feedback {
  id: string
  tester_id: string
  engine_slug: string
  overall_rating: number
  what_worked: string | null
  what_broke: string | null
  ui_issues: string | null
  would_use_regularly: boolean | null
  anything_else: string | null
  submitted_at: string
}

const inputStyle: React.CSSProperties = {
  background: '#0d1b2a', border: '1px solid #2d4a63', borderRadius: 6,
  padding: '8px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', width: '100%',
}

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')

  const [testers, setTesters] = useState<Tester[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterEngine, setFilterEngine] = useState('')

  const [selectedTester, setSelectedTester] = useState<Tester | null>(null)
  const [feedbackForTester, setFeedbackForTester] = useState<Feedback[]>([])
  const [loadingFeedback, setLoadingFeedback] = useState(false)

  const [grantAmount, setGrantAmount] = useState('100')
  const [grantReason, setGrantReason] = useState('')
  const [overrideCap, setOverrideCap] = useState(false)
  const [granting, setGranting] = useState(false)
  const [grantResult, setGrantResult] = useState('')

  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const fetchTesters = useCallback(async (s: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/testers', { headers: { 'x-admin-secret': s } })
      const data = await res.json()
      if (data.error) { setAuthError('Wrong password.'); return }
      setTesters(data.testers ?? [])
      setAuthed(true)
    } catch { setAuthError('Request failed.') } finally { setLoading(false) }
  }, [])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    fetchTesters(secret)
  }

  async function openTester(t: Tester) {
    setSelectedTester(t)
    setNoteText(t.notes ?? '')
    setGrantResult('')
    setFeedbackForTester([])
    setLoadingFeedback(true)
    try {
      const res = await fetch(`/api/admin/feedback?testerId=${t.tester_id}&secret=${encodeURIComponent(secret)}`)
      const data = await res.json()
      setFeedbackForTester(data.feedback ?? [])
    } catch { /* ignore */ } finally { setLoadingFeedback(false) }
  }

  async function handleGrantCredit() {
    if (!selectedTester) return
    setGranting(true)
    setGrantResult('')
    try {
      const res = await fetch('/api/admin/grant-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ testerId: selectedTester.tester_id, amountUsd: parseInt(grantAmount), reason: grantReason, overrideCap }),
      })
      const data = await res.json()
      if (data.ok) {
        setGrantResult(`✓ $${data.granted} granted`)
        fetchTesters(secret)
      } else { setGrantResult(`Error: ${data.error}`) }
    } catch { setGrantResult('Request failed') } finally { setGranting(false) }
  }

  async function handleSaveNote() {
    if (!selectedTester) return
    setSavingNote(true)
    try {
      await fetch('/api/admin/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ testerId: selectedTester.tester_id, note: noteText }),
      })
      fetchTesters(secret)
    } catch { /* ignore */ } finally { setSavingNote(false) }
  }

  function exportCsv() {
    const rows = [
      ['Tester ID', 'Name', 'Email', 'Engine', 'Country', 'Device', 'Browser', 'Verified', 'Feedback', 'Credit Earned', 'Credit Granted', 'Engines Tested', 'Joined'].join(','),
      ...filtered.map(t => [
        t.tester_id, `"${t.name}"`, t.email, t.engine_name, t.country, t.device, t.browser,
        t.email_verified ? 'yes' : 'no', t.feedback_submitted ? 'yes' : 'no',
        t.credit_earned_usd, t.credit_granted_usd,
        t.engines_tested_count, new Date(t.created_at).toISOString().split('T')[0],
      ].join(',')),
    ].join('\n')
    const blob = new Blob([rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'hive-testers.csv'; a.click()
  }

  const engines = [...new Set(testers.map(t => t.engine_name))].sort()
  const filtered = testers.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.tester_id.toLowerCase().includes(q)
    const matchEngine = !filterEngine || t.engine_name === filterEngine
    return matchSearch && matchEngine
  })

  const stats = {
    total: testers.length,
    verified: testers.filter(t => t.email_verified).length,
    feedbackDone: testers.filter(t => t.feedback_submitted).length,
    totalCreditEarned: testers.reduce((s, t) => s + t.credit_earned_usd, 0),
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 360, width: '100%' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#EF9F27', marginBottom: 8 }}>Admin</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Hive Testing Station</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="password"
              placeholder="Admin password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              style={inputStyle}
              autoFocus
            />
            {authError && <p style={{ color: '#ef4444', fontSize: 13 }}>{authError}</p>}
            <button type="submit" disabled={loading} style={{
              background: '#EF9F27', color: '#1e2d3d', fontWeight: 700, fontSize: 14,
              padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            }}>
              {loading ? 'Checking…' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px 20px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#EF9F27', marginBottom: 2 }}>Hive Testing Station — Admin</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            {stats.total} testers · {stats.verified} verified · {stats.feedbackDone} feedback submitted · ${stats.totalCreditEarned} total credit earned
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => fetchTesters(secret)} style={{ background: '#1e2d3d', border: '1px solid #2d4a63', color: '#94a3b8', fontSize: 13, padding: '7px 14px', borderRadius: 6, cursor: 'pointer' }}>
            Refresh
          </button>
          <button onClick={exportCsv} style={{ background: '#1e2d3d', border: '1px solid #2d4a63', color: '#94a3b8', fontSize: 13, padding: '7px 14px', borderRadius: 6, cursor: 'pointer' }}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Search name, email, tester ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, maxWidth: 280 }}
        />
        <select
          value={filterEngine}
          onChange={e => setFilterEngine(e.target.value)}
          style={{ ...inputStyle, maxWidth: 220, cursor: 'pointer' }}
        >
          <option value="">All engines</option>
          {engines.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', background: '#1e2d3d', border: '1px solid #2d4a63', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2d4a63' }}>
              {['Tester ID', 'Name', 'Engine', 'Verified', 'Feedback', 'Engines', 'Earned', 'Granted', 'Joined', ''].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.tester_id + t.engine_slug} style={{ borderBottom: '1px solid #162233' }}>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#EF9F27', whiteSpace: 'nowrap' }}>{t.tester_id}</td>
                <td style={{ padding: '8px 12px', color: '#e2e8f0', whiteSpace: 'nowrap' }}>{t.name}</td>
                <td style={{ padding: '8px 12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{t.engine_name}</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>{t.email_verified ? '✓' : '○'}</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>{t.feedback_submitted ? '✓' : '○'}</td>
                <td style={{ padding: '8px 12px', textAlign: 'center', color: '#94a3b8' }}>{t.engines_tested_count}</td>
                <td style={{ padding: '8px 12px', color: t.credit_earned_usd > 0 ? '#22c55e' : '#64748b' }}>${t.credit_earned_usd}</td>
                <td style={{ padding: '8px 12px', color: t.credit_granted_usd > 0 ? '#22c55e' : '#64748b' }}>${t.credit_granted_usd}</td>
                <td style={{ padding: '8px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '8px 12px' }}>
                  <button
                    onClick={() => openTester(t)}
                    style={{ background: '#EF9F27', color: '#1e2d3d', fontWeight: 700, fontSize: 12, padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    View →
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>No testers found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tester detail drawer */}
      {selectedTester && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.85)', zIndex: 50,
          display: 'flex', justifyContent: 'flex-end',
        }} onClick={e => { if (e.target === e.currentTarget) setSelectedTester(null) }}>
          <div style={{
            width: '100%', maxWidth: 520, background: '#1e2d3d', borderLeft: '1px solid #2d4a63',
            overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Tester ID</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#EF9F27', fontFamily: 'monospace' }}>{selectedTester.tester_id}</p>
              </div>
              <button onClick={() => setSelectedTester(null)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer', padding: 4 }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Name', selectedTester.name],
                ['Email', selectedTester.email],
                ['Engine', selectedTester.engine_name],
                ['Country', selectedTester.country],
                ['Device', selectedTester.device],
                ['Browser', selectedTester.browser],
                ['Verified', selectedTester.email_verified ? 'Yes' : 'No'],
                ['Feedback', selectedTester.feedback_submitted ? 'Submitted' : 'Pending'],
                ['Credit Earned', `$${selectedTester.credit_earned_usd}`],
                ['Credit Granted', `$${selectedTester.credit_granted_usd}`],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 13, color: '#e2e8f0' }}>{value}</p>
                </div>
              ))}
            </div>

            {(selectedTester.engines_tested ?? []).length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Engines Tested</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(selectedTester.engines_tested ?? []).map(slug => (
                    <span key={slug} style={{ background: '#162233', border: '1px solid #2d4a63', borderRadius: 4, padding: '2px 8px', fontSize: 12, color: '#94a3b8' }}>{slug}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Grant credit */}
            <div style={{ background: '#162233', border: '1px solid #2d4a63', borderRadius: 8, padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>Grant Credit</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flexGrow: 1 }}>
                    <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4 }}>Amount ($)</label>
                    <input type="number" min="1" value={grantAmount} onChange={e => setGrantAmount(e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4 }}>Reason</label>
                  <input type="text" placeholder="e.g. bonus for detailed feedback" value={grantReason} onChange={e => setGrantReason(e.target.value)} style={inputStyle} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}>
                  <input type="checkbox" checked={overrideCap} onChange={e => setOverrideCap(e.target.checked)} />
                  Override $1,000 cap
                </label>
                <button
                  onClick={handleGrantCredit}
                  disabled={granting}
                  style={{ background: granting ? '#b37819' : '#EF9F27', color: '#1e2d3d', fontWeight: 700, fontSize: 13, padding: '9px 16px', borderRadius: 6, border: 'none', cursor: granting ? 'not-allowed' : 'pointer' }}
                >
                  {granting ? 'Granting…' : `Grant $${grantAmount} credit →`}
                </button>
                {grantResult && <p style={{ fontSize: 13, color: grantResult.startsWith('✓') ? '#22c55e' : '#ef4444' }}>{grantResult}</p>}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Admin Notes</label>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Internal notes…"
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
              />
              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                style={{ marginTop: 8, background: '#162233', border: '1px solid #2d4a63', color: '#94a3b8', fontSize: 12, padding: '7px 14px', borderRadius: 6, cursor: 'pointer' }}
              >
                {savingNote ? 'Saving…' : 'Save note'}
              </button>
            </div>

            {/* Feedback */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>Feedback</p>
              {loadingFeedback ? (
                <p style={{ color: '#64748b', fontSize: 13 }}>Loading…</p>
              ) : feedbackForTester.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 13 }}>No feedback submitted yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {feedbackForTester.map(fb => (
                    <div key={fb.id} style={{ background: '#162233', border: '1px solid #2d4a63', borderRadius: 8, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ color: '#EF9F27' }}>{'★'.repeat(fb.overall_rating)}{'☆'.repeat(5 - fb.overall_rating)}</span>
                        <span style={{ color: '#64748b', fontSize: 11 }}>{new Date(fb.submitted_at).toLocaleDateString()}</span>
                      </div>
                      {[['Worked', fb.what_worked], ['Broken', fb.what_broke], ['UI Issues', fb.ui_issues], ['Other', fb.anything_else]].map(([label, text]) =>
                        text ? (
                          <div key={label as string} style={{ marginBottom: 8 }}>
                            <p style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{label}</p>
                            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>{text as string}</p>
                          </div>
                        ) : null
                      )}
                      {fb.would_use_regularly !== null && (
                        <p style={{ fontSize: 12, color: fb.would_use_regularly ? '#22c55e' : '#ef4444' }}>
                          {fb.would_use_regularly ? '✓ Would use regularly' : '✗ Would not use regularly'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
