import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { findOrCreateCustomer, grantCreditToCustomer } from '@/lib/stripe'
import { sendCreditEmail } from '@/lib/email'

export const runtime = 'nodejs'

const CREDIT_PER_ENGINE = 100
const MAX_CREDIT = 1000

type Status = 'worked' | 'partial' | 'failed' | null
interface FeedbackResponse {
  item: number
  question: string
  status: Status
  comment: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ 'tester-id': string }> }
) {
  try {
    const { 'tester-id': rawId } = await params
    const testerId = rawId?.toUpperCase()
    if (!testerId) return NextResponse.json({ error: 'Missing tester ID' }, { status: 400 })

    const body = await req.json()
    const { engineSlug, responses } = body as { engineSlug: string; responses: FeedbackResponse[] }

    if (!engineSlug || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json({ error: 'engineSlug and responses are required' }, { status: 400 })
    }

    const responded = responses.filter(r => r.status !== null)
    if (responded.length < 5) {
      return NextResponse.json({ error: 'At least 5 items must have a status selected' }, { status: 400 })
    }

    // Derive overall rating (1–5) from statuses
    const workedCount  = responded.filter(r => r.status === 'worked').length
    const partialCount = responded.filter(r => r.status === 'partial').length
    const failedCount  = responded.filter(r => r.status === 'failed').length
    const score = (workedCount * 5 + partialCount * 3 + failedCount * 1) / responded.length
    const overallRating = Math.max(1, Math.min(5, Math.round(score)))

    // Summarise for legacy what_worked / what_broke fields
    const whatWorked = responses.filter(r => r.status === 'worked' && r.comment)
      .map(r => `${r.item}. ${r.comment}`).join('; ') || null
    const whatBroke = responses.filter(r => r.status === 'failed' && r.comment)
      .map(r => `${r.item}. ${r.comment}`).join('; ') || null

    const sql = getDb()

    const rows = await sql`
      SELECT id, email, name, engine_slug, feedback_submitted,
             credit_earned_usd, stripe_customer_id, engines_tested
      FROM hive_testers
      WHERE tester_id = ${testerId} AND email_verified = TRUE
      LIMIT 1
    ` as Array<{
      id: string; email: string; name: string; engine_slug: string;
      feedback_submitted: boolean; credit_earned_usd: number;
      stripe_customer_id: string | null; engines_tested: string[]
    }>

    if (!rows.length) return NextResponse.json({ error: 'Tester not found or email not verified' }, { status: 404 })

    const tester = rows[0]
    if (tester.feedback_submitted) {
      return NextResponse.json({ error: 'Feedback already submitted' }, { status: 409 })
    }

    const itemsTested = responded.length
    const issuesFound = responded.filter(r => r.status === 'failed' || r.status === 'partial').length

    await sql`
      INSERT INTO tester_feedback (
        tester_id, engine_slug, overall_rating,
        what_worked, what_broke, ui_issues, would_use_regularly, anything_else,
        checklist_responses
      ) VALUES (
        ${testerId}, ${engineSlug}, ${overallRating},
        ${whatWorked}, ${whatBroke}, ${null}, ${null}, ${null},
        ${JSON.stringify(responses)}
      )
    `

    // Credit
    const enginesTested = Array.isArray(tester.engines_tested) ? tester.engines_tested : []
    const alreadyTested = enginesTested.includes(engineSlug)
    const newCreditEarned = alreadyTested ? 0 : Math.min(CREDIT_PER_ENGINE, MAX_CREDIT - tester.credit_earned_usd)
    const newTotal = tester.credit_earned_usd + newCreditEarned

    let stripeCustomerId = tester.stripe_customer_id
    let creditGranted = 0

    if (newCreditEarned > 0) {
      try {
        stripeCustomerId = stripeCustomerId ?? await findOrCreateCustomer({ email: tester.email, name: tester.name })
        if (stripeCustomerId) {
          const nameRow = (await sql`SELECT engine_name FROM hive_testers WHERE tester_id = ${testerId} LIMIT 1` as Array<{ engine_name: string }>)[0]
          const ok = await grantCreditToCustomer({ customerId: stripeCustomerId, amountUsd: newCreditEarned, engineName: nameRow?.engine_name ?? engineSlug })
          if (ok) creditGranted = newCreditEarned
        }
      } catch (e) {
        console.error('[feedback/tester-id] Stripe credit failed:', e)
      }
    }

    const updatedEngines = alreadyTested ? enginesTested : [...enginesTested, engineSlug]

    await sql`
      UPDATE hive_testers SET
        feedback_submitted = TRUE,
        feedback_at = NOW(),
        credit_earned_usd = ${newTotal},
        credit_granted_usd = credit_granted_usd + ${creditGranted},
        credit_granted = ${creditGranted > 0 || tester.credit_earned_usd > 0},
        stripe_customer_id = ${stripeCustomerId ?? null},
        engines_tested = ${JSON.stringify(updatedEngines)},
        items_tested = items_tested + ${itemsTested},
        issues_found = issues_found + ${issuesFound}
      WHERE tester_id = ${testerId}
    `

    if (creditGranted > 0) {
      try {
        await sendCreditEmail({ to: tester.email, name: tester.name, testerId, engineName: engineSlug, creditAmount: creditGranted, totalCredit: newTotal })
      } catch (e) {
        console.error('[feedback/tester-id] Credit email failed:', e)
      }
    }

    return NextResponse.json({ ok: true, message: 'Feedback received — thank you.', creditGranted, totalCredit: newTotal })
  } catch (e) {
    console.error('[feedback/tester-id]', { error: (e as Error).message, stack: (e as Error).stack, timestamp: new Date().toISOString() })
    return NextResponse.json({ error: 'Feedback submission failed' }, { status: 500 })
  }
}
