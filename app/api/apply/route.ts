import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getEngineBySlug } from '@/lib/engines'
import { sendVerificationEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.net',
  'guerrillamail.org', 'spam4.me', 'trashmail.com', 'trashmail.me', 'dispostable.com',
  'fakeinbox.com', 'getairmail.com', 'maildrop.cc', 'mailnull.com', 'spamgourmet.com',
])

function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false
}

function formatTesterId(code: string, number: number): string {
  return `${code}-${String(number).padStart(4, '0')}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { engineSlug, name, email, phone, country, device, browser, agreedFeedback, honeypot } = body

    // Anti-bot: honeypot field must be empty
    if (honeypot) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
    }

    if (!engineSlug || !name || !email || !country || !device || !browser || !agreedFeedback) {
      return NextResponse.json({ error: 'All required fields must be filled' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (isDisposableEmail(email)) {
      return NextResponse.json({ error: 'Disposable email addresses are not allowed' }, { status: 400 })
    }

    const engine = getEngineBySlug(engineSlug)
    if (!engine) {
      return NextResponse.json({ error: 'Unknown engine' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const sql = getDb()

    // Rate limit: 1 signup per IP per engine
    try {
      await sql`
        INSERT INTO signup_rate_limits (ip, engine_slug)
        VALUES (${ip}, ${engineSlug})
      `
    } catch {
      return NextResponse.json(
        { error: 'You have already applied to test this engine from this device' },
        { status: 429 }
      )
    }

    // Check slots
    const slots = await sql`
      SELECT max_testers, current_testers
      FROM engine_slots
      WHERE engine_slug = ${engineSlug} AND active = TRUE
    ` as Array<{ max_testers: number; current_testers: number }>

    if (!slots.length || slots[0].current_testers >= slots[0].max_testers) {
      // Clean up rate limit on failure
      await sql`DELETE FROM signup_rate_limits WHERE ip = ${ip} AND engine_slug = ${engineSlug}`
      return NextResponse.json({ error: 'No spots remaining for this engine' }, { status: 409 })
    }

    // Check for duplicate email+engine
    const existing = await sql`
      SELECT id FROM hive_testers
      WHERE email = ${email.toLowerCase()} AND engine_slug = ${engineSlug}
    `
    if (existing.length > 0) {
      await sql`DELETE FROM signup_rate_limits WHERE ip = ${ip} AND engine_slug = ${engineSlug}`
      return NextResponse.json(
        { error: 'This email has already applied to test this engine' },
        { status: 409 }
      )
    }

    // Reserve slot and assign tester number
    const updated = await sql`
      UPDATE engine_slots
      SET current_testers = current_testers + 1
      WHERE engine_slug = ${engineSlug}
        AND current_testers < max_testers
      RETURNING current_testers
    ` as Array<{ current_testers: number }>

    if (!updated.length) {
      await sql`DELETE FROM signup_rate_limits WHERE ip = ${ip} AND engine_slug = ${engineSlug}`
      return NextResponse.json({ error: 'No spots remaining' }, { status: 409 })
    }

    const testerNumber = updated[0].current_testers
    const testerId = formatTesterId(engine.code, testerNumber)
    const verifyToken = randomBytes(32).toString('hex')
    const verifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await sql`
      INSERT INTO hive_testers (
        tester_id, name, email, phone, engine_slug, engine_name,
        country, device, browser, agreed_feedback,
        email_verified, verify_token, verify_token_expires_at
      ) VALUES (
        ${testerId}, ${name.trim()}, ${email.toLowerCase()},
        ${phone || null}, ${engineSlug}, ${engine.name},
        ${country}, ${device}, ${browser}, ${agreedFeedback},
        FALSE, ${verifyToken}, ${verifyTokenExpiresAt}
      )
    `

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://test.hive.baby'
    const verifyUrl = `${baseUrl}/api/verify?token=${verifyToken}`

    await sendVerificationEmail({
      to: email,
      name: name.trim(),
      engineName: engine.name,
      verifyUrl,
    })

    return NextResponse.json({ ok: true, pending: true, message: 'Check your email to confirm your application.' })
  } catch (e) {
    console.error('[apply]', { error: (e as Error).message, stack: (e as Error).stack, timestamp: new Date().toISOString(), path: req.url })
    return NextResponse.json({ error: 'Signup failed — please try again' }, { status: 500 })
  }
}
