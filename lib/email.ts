import { Resend } from 'resend'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export async function sendVerificationEmail(params: {
  to: string
  name: string
  engineName: string
  verifyUrl: string
}) {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping verification email')
    return
  }
  await resend.emails.send({
    from: 'Hive Testing Station <hive@hive.baby>',
    to: params.to,
    subject: `Verify your email — ${params.engineName} tester application`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #1e2d3d; color: #e2e8f0; padding: 32px; border-radius: 12px;">
        <h1 style="color: #EF9F27; margin-bottom: 8px;">One more step, ${params.name}</h1>
        <p style="color: #94a3b8; margin-bottom: 24px;">Verify your email to confirm your application to test <strong style="color: #e2e8f0;">${params.engineName}</strong>.</p>
        <a href="${params.verifyUrl}" style="display: inline-block; background: #EF9F27; color: #1e2d3d; font-weight: bold; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px;">Confirm my email →</a>
        <p style="color: #64748b; margin-top: 24px; font-size: 14px;">Link expires in 24 hours. If you didn't apply, ignore this email.</p>
      </div>
    `,
  })
}

export async function sendCreditEmail(params: {
  to: string
  name: string
  testerId: string
  engineName: string
  creditAmount: number
  totalCredit: number
}) {
  const resend = getResend()
  if (!resend) { console.warn('[email] RESEND_API_KEY not set — skipping credit email'); return }
  await resend.emails.send({
    from: 'Hive Testing Station <hive@hive.baby>',
    to: params.to,
    subject: `$${params.creditAmount} credit added to your account — ${params.engineName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #1e2d3d; color: #e2e8f0; padding: 32px; border-radius: 12px;">
        <div style="background: #EF9F27; color: #1e2d3d; display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-bottom: 16px;">CREDIT CONFIRMED</div>
        <h1 style="color: #e2e8f0; margin-bottom: 4px;">$${params.creditAmount} added, ${params.name.split(' ')[0]}.</h1>
        <p style="color: #94a3b8; margin-bottom: 24px;">Your feedback for <strong style="color: #EF9F27;">${params.engineName}</strong> has been confirmed and $${params.creditAmount} has been added to your account.</p>
        <div style="background: #0f1e2d; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b; font-size: 14px;">This engine</span>
            <span style="color: #EF9F27; font-weight: bold;">$${params.creditAmount}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b; font-size: 14px;">Total earned so far</span>
            <span style="color: #EF9F27; font-weight: bold;">$${params.totalCredit} / $1,000 max</span>
          </div>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">Your credit is waiting in your account. It applies automatically when you subscribe to any paid plan. Tester ID: <strong style="color: #EF9F27; font-family: monospace;">${params.testerId}</strong></p>
        <p style="color: #64748b; font-size: 14px; border-top: 1px solid #2d3f50; margin-top: 32px; padding-top: 24px;">No ads. No investors. No agenda. — Hive</p>
      </div>
    `,
  })
}

export async function sendTesterKitEmail(params: {
  to: string
  name: string
  testerId: string
  engineName: string
  engineUrl: string
  testerNumber: number
  checklist: string[]
}) {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping tester kit email')
    return
  }
  const checklistHtml = params.checklist
    .map((item, i) => `<li style="margin-bottom: 8px; color: #cbd5e1;"><span style="color: #EF9F27; font-weight: bold;">${i + 1}.</span> ${item}</li>`)
    .join('')

  await resend.emails.send({
    from: 'Hive Testing Station <hive@hive.baby>',
    to: params.to,
    subject: `You're Founding Tester #${params.testerNumber} for ${params.engineName} — here's your kit`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #1e2d3d; color: #e2e8f0; padding: 32px; border-radius: 12px;">
        <div style="background: #EF9F27; color: #1e2d3d; display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-bottom: 16px;">FOUNDING TESTER #${params.testerNumber}</div>
        <h1 style="color: #e2e8f0; margin-bottom: 4px;">Welcome, ${params.name}.</h1>
        <p style="color: #94a3b8; margin-bottom: 24px;">You're officially Founding Tester #${params.testerNumber} for <strong style="color: #EF9F27;">${params.engineName}</strong>.</p>

        <div style="background: #0f1e2d; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Your Tester ID</p>
          <p style="margin: 4px 0 0; font-size: 24px; font-weight: bold; color: #EF9F27; font-family: monospace;">${params.testerId}</p>
        </div>

        <a href="${params.engineUrl}" style="display: inline-block; background: #EF9F27; color: #1e2d3d; font-weight: bold; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; margin-bottom: 32px;">Open ${params.engineName} →</a>

        <h2 style="color: #e2e8f0; margin-bottom: 16px;">Your testing checklist</h2>
        <ol style="padding-left: 0; list-style: none; margin: 0 0 32px;">${checklistHtml}</ol>

        <p style="color: #94a3b8; margin-bottom: 8px;"><strong style="color: #e2e8f0;">Deadline:</strong> 7 days from now.</p>
        <p style="color: #94a3b8; margin-bottom: 24px;"><strong style="color: #e2e8f0;">Send your feedback to:</strong> <a href="mailto:hive@hive.baby" style="color: #EF9F27;">hive@hive.baby</a></p>
        <p style="color: #94a3b8; margin-bottom: 8px;">Include your tester ID <strong style="color: #EF9F27; font-family: monospace;">${params.testerId}</strong> in the subject line.</p>
        <p style="color: #64748b; font-size: 14px; border-top: 1px solid #2d3f50; margin-top: 32px; padding-top: 24px;">No ads. No investors. No agenda. — Hive</p>
      </div>
    `,
  })
}
