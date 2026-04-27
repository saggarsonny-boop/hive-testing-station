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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://test.hive.baby'
  const checklistUrl = `${appUrl}/confirm/${params.testerId}`

  await resend.emails.send({
    from: 'Hive Testing Station <hive@hive.baby>',
    to: params.to,
    subject: `You're Founding Tester #${params.testerNumber} for ${params.engineName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #1e2d3d; color: #e2e8f0; padding: 40px 32px; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #EF9F27, #d4850f); color: #1e2d3d; display: inline-block; padding: 6px 18px; border-radius: 20px; font-weight: 800; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px;">Founding Tester #${params.testerNumber}</div>

        <h1 style="color: #f1f5f9; font-size: 26px; font-weight: 800; margin: 0 0 10px; line-height: 1.2;">Congratulations, ${params.name.split(' ')[0]}.</h1>
        <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">You are Founding Tester #${params.testerNumber} — one of the first people to shape what Hive builds.</p>

        <div style="background: #0f1e2d; border: 1px solid #EF9F27; border-radius: 10px; padding: 18px 22px; margin-bottom: 28px; text-align: center;">
          <p style="margin: 0 0 4px; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Your Tester ID</p>
          <p style="margin: 0; font-size: 28px; font-weight: 800; color: #EF9F27; font-family: 'Courier New', monospace; letter-spacing: 0.05em;">${params.testerId}</p>
        </div>

        <div style="margin-bottom: 28px;">
          <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 8px;">Engine to test</p>
          <a href="${params.engineUrl}" style="display: block; background: #162233; border: 1px solid #2d4a63; border-radius: 8px; padding: 14px 18px; text-decoration: none; color: inherit;">
            <span style="display: block; font-size: 15px; font-weight: 700; color: #EF9F27; margin-bottom: 3px;">${params.engineName} →</span>
            <span style="font-size: 13px; color: #64748b;">${params.engineName} — the Hive engine you have kindly chosen to test</span>
          </a>
        </div>

        <a href="${checklistUrl}" style="display: block; background: #EF9F27; color: #1e2d3d; font-weight: 800; padding: 16px 28px; border-radius: 10px; text-decoration: none; font-size: 16px; text-align: center; margin-bottom: 28px;">Complete your testing checklist →</a>

        <div style="background: #162233; border-radius: 8px; padding: 16px 18px; margin-bottom: 28px;">
          <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.6;">The checklist has <strong style="color: #e2e8f0;">${params.checklist.length} items</strong>. Rate each one (Worked / Partial / Failed), add optional notes, and submit. Your <strong style="color: #EF9F27;">$100 credit</strong> activates the moment you hit submit.</p>
        </div>

        <p style="color: #64748b; font-size: 13px; border-top: 1px solid #2d3f50; margin-top: 8px; padding-top: 24px;">No ads. No investors. No agenda. — Hive</p>
      </div>
    `,
  })
}
