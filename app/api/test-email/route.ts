import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ ok: false, error: 'RESEND_API_KEY not set' }, { status: 503 })
  }

  let email = 'saggarsonny@gmail.com'
  try {
    const body = await req.json()
    if (body.email) email = body.email
  } catch { /* use default */ }

  try {
    const resend = new Resend(resendKey)
    const result = await resend.emails.send({
      from: 'Hive Testing <hive@hive.baby>',
      to: email,
      subject: 'Hive test-email — Resend is working',
      html: '<p>If you received this, <strong>RESEND_API_KEY is set and working</strong> on HiveTestingStation.</p><p style="color:#888;font-size:12px">No ads. No investors. No agenda.</p>',
    })
    return NextResponse.json({ ok: true, id: result.data?.id, to: email })
  } catch (e) {
    console.error('[test-email]', { error: (e as Error).message, timestamp: new Date().toISOString() })
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
