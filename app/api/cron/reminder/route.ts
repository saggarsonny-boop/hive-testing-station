import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://test.hive.baby'

function checkAuth(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true
  return req.headers.get('authorization') === `Bearer ${cronSecret}`
}

type TesterRow = {
  tester_id: string
  name: string
  email: string
  engine_slug: string
  engine_name: string
  created_at: string
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()
    const now = new Date()

    const day3Cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    const day6Cutoff = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
    const day8Cutoff = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)

    // Mark expired: verified, no feedback, 8+ days old, not already marked
    const expired = await sql`
      UPDATE hive_testers
      SET notes = COALESCE(notes || ' ', '') || '[expired]'
      WHERE email_verified = true
        AND feedback_submitted = false
        AND created_at < ${day8Cutoff.toISOString()}
        AND (notes IS NULL OR notes NOT LIKE '%[expired]%')
      RETURNING tester_id, name, email, engine_name
    ` as TesterRow[]

    // Day 6 final reminder: 6-8 days old, verified, no feedback, not yet reminded at day 6
    const day6Testers = await sql`
      SELECT tester_id, name, email, engine_slug, engine_name, created_at
      FROM hive_testers
      WHERE email_verified = true
        AND feedback_submitted = false
        AND created_at < ${day6Cutoff.toISOString()}
        AND created_at >= ${day8Cutoff.toISOString()}
        AND (notes IS NULL OR (notes NOT LIKE '%[reminder_day6]%' AND notes NOT LIKE '%[expired]%'))
    ` as TesterRow[]

    // Day 3 reminder: 3-6 days old, verified, no feedback, not yet reminded
    const day3Testers = await sql`
      SELECT tester_id, name, email, engine_slug, engine_name, created_at
      FROM hive_testers
      WHERE email_verified = true
        AND feedback_submitted = false
        AND created_at < ${day3Cutoff.toISOString()}
        AND created_at >= ${day6Cutoff.toISOString()}
        AND (notes IS NULL OR notes NOT LIKE '%[reminder_day3]%')
    ` as TesterRow[]

    let emailsSent = 0
    const errors: string[] = []

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)

      for (const tester of day6Testers) {
        try {
          const daysOld = Math.floor((now.getTime() - new Date(tester.created_at).getTime()) / (24 * 60 * 60 * 1000))
          const daysLeft = Math.max(0, 8 - daysOld)

          await resend.emails.send({
            from: 'Hive Testing <hive@hive.baby>',
            to: tester.email,
            subject: `Final reminder — your ${tester.engine_name} feedback window closes in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
            html: `
              <p>Hi ${tester.name},</p>
              <p>You signed up 6 days ago to test <strong>${tester.engine_name}</strong>.</p>
              <p>Your feedback window closes in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>. This is your final reminder.</p>
              <p>Once the window closes, you won't be able to submit feedback for this session.</p>
              <p style="margin:24px 0">
                <a href="${APP_URL}/feedback/${tester.tester_id}"
                   style="display:inline-block;padding:12px 24px;background:#d4af37;color:#000;text-decoration:none;border-radius:6px;font-weight:bold">
                  Submit Feedback Now &rarr;
                </a>
              </p>
              <p style="color:#888;font-size:12px">No ads. No investors. No agenda.</p>
            `,
          })

          await sql`
            UPDATE hive_testers
            SET notes = COALESCE(notes || ' ', '') || '[reminder_day6]'
            WHERE tester_id = ${tester.tester_id}
          `
          emailsSent++
        } catch (e) {
          errors.push(`day6/${tester.tester_id}: ${(e as Error).message}`)
        }
      }

      for (const tester of day3Testers) {
        try {
          const daysOld = Math.floor((now.getTime() - new Date(tester.created_at).getTime()) / (24 * 60 * 60 * 1000))
          const daysLeft = Math.max(0, 8 - daysOld)

          await resend.emails.send({
            from: 'Hive Testing <hive@hive.baby>',
            to: tester.email,
            subject: `You signed up ${daysOld} days ago to test ${tester.engine_name} — have you tried it yet?`,
            html: `
              <p>Hi ${tester.name},</p>
              <p>You signed up ${daysOld} days ago to test <strong>${tester.engine_name}</strong>.</p>
              <p>Your feedback window closes in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.</p>
              <p>If you haven't tried it yet, now is a great time. Your feedback directly shapes the next version.</p>
              <p style="margin:24px 0">
                <a href="${APP_URL}/feedback/${tester.tester_id}"
                   style="display:inline-block;padding:12px 24px;background:#d4af37;color:#000;text-decoration:none;border-radius:6px;font-weight:bold">
                  Submit Feedback &rarr;
                </a>
              </p>
              <p style="color:#888;font-size:12px">No ads. No investors. No agenda.</p>
            `,
          })

          await sql`
            UPDATE hive_testers
            SET notes = COALESCE(notes || ' ', '') || '[reminder_day3]'
            WHERE tester_id = ${tester.tester_id}
          `
          emailsSent++
        } catch (e) {
          errors.push(`day3/${tester.tester_id}: ${(e as Error).message}`)
        }
      }
    }

    return NextResponse.json({
      ok: true,
      expired: expired.length,
      day6_reminders_sent: day6Testers.length,
      day3_reminders_sent: day3Testers.length,
      emails_sent: emailsSent,
      resend_configured: !!process.env.RESEND_API_KEY,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (e) {
    console.error('[cron/reminder]', { error: (e as Error).message, stack: (e as Error).stack, timestamp: new Date().toISOString() })
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
