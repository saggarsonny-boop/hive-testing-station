import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { findOrCreateCustomer, grantCreditToCustomer } from '@/lib/stripe'
import { sendCreditEmail } from '@/lib/email'

export const runtime = 'nodejs'

const CREDIT_PER_ENGINE = 100
const MAX_CREDIT = 1000

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { testerId, engineSlug, overallRating, whatWorked, whatBroke, uiIssues, wouldUseRegularly, anythingElse, checklistResponses } = body

    if (!testerId || !engineSlug || !overallRating) {
      return NextResponse.json({ error: 'Tester ID, engine, and rating are required' }, { status: 400 })
    }
    if (overallRating < 1 || overallRating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const sql = getDb()

    const rows = await sql`
      SELECT id, email, name, engine_slug, feedback_submitted,
             credit_earned_usd, stripe_customer_id, engines_tested
      FROM hive_testers
      WHERE tester_id = ${testerId.toUpperCase()} AND email_verified = TRUE
      LIMIT 1
    ` as Array<{
      id: string; email: string; name: string; engine_slug: string;
      feedback_submitted: boolean; credit_earned_usd: number;
      stripe_customer_id: string | null; engines_tested: string[]
    }>

    if (!rows.length) {
      return NextResponse.json({ error: 'Tester ID not found or email not verified' }, { status: 404 })
    }

    const tester = rows[0]

    if (tester.feedback_submitted) {
      return NextResponse.json({ error: 'Feedback already submitted for this tester ID' }, { status: 409 })
    }

    const checklistJson = checklistResponses ? JSON.stringify(checklistResponses) : null
    const itemsTested = Array.isArray(checklistResponses) ? checklistResponses.length : 0
    const issuesFound = Array.isArray(checklistResponses)
      ? checklistResponses.filter((r: { result: string }) => r.result === 'fail' || r.result === 'partial').length
      : 0

    await sql`
      INSERT INTO tester_feedback (
        tester_id, engine_slug, overall_rating,
        what_worked, what_broke, ui_issues, would_use_regularly, anything_else,
        checklist_responses
      ) VALUES (
        ${testerId.toUpperCase()}, ${engineSlug}, ${overallRating},
        ${whatWorked || null}, ${whatBroke || null}, ${uiIssues || null},
        ${wouldUseRegularly ?? null}, ${anythingElse || null},
        ${checklistJson}
      )
    `

    // Calculate credit
    const enginesTested = Array.isArray(tester.engines_tested) ? tester.engines_tested : []
    const alreadyTested = enginesTested.includes(engineSlug)
    const newCreditEarned = alreadyTested ? 0 : Math.min(CREDIT_PER_ENGINE, MAX_CREDIT - tester.credit_earned_usd)
    const newTotal = tester.credit_earned_usd + newCreditEarned

    // Find/create Stripe customer and grant credit
    let stripeCustomerId = tester.stripe_customer_id
    let creditGranted = 0

    if (newCreditEarned > 0) {
      try {
        stripeCustomerId = stripeCustomerId ?? await findOrCreateCustomer({ email: tester.email, name: tester.name })
        if (stripeCustomerId) {
          const engineName = (await sql`SELECT engine_name FROM hive_testers WHERE tester_id = ${testerId.toUpperCase()} LIMIT 1` as Array<{ engine_name: string }>)[0]?.engine_name ?? engineSlug
          const ok = await grantCreditToCustomer({ customerId: stripeCustomerId, amountUsd: newCreditEarned, engineName })
          if (ok) creditGranted = newCreditEarned
        }
      } catch (e) {
        console.error('[feedback] Stripe credit failed:', e)
      }
    }

    const updatedEngines = alreadyTested ? enginesTested : [...enginesTested, engineSlug]

    await sql`
      UPDATE hive_testers
      SET
        feedback_submitted = TRUE,
        feedback_at = NOW(),
        credit_earned_usd = ${newTotal},
        credit_granted_usd = credit_granted_usd + ${creditGranted},
        credit_granted = ${creditGranted > 0 || tester.credit_earned_usd > 0},
        stripe_customer_id = ${stripeCustomerId ?? null},
        engines_tested = ${JSON.stringify(updatedEngines)},
        items_tested = items_tested + ${itemsTested},
        issues_found = issues_found + ${issuesFound}
      WHERE tester_id = ${testerId.toUpperCase()}
    `

    // Send credit confirmation email
    if (creditGranted > 0) {
      try {
        await sendCreditEmail({
          to: tester.email,
          name: tester.name,
          testerId: testerId.toUpperCase(),
          engineName: engineSlug,
          creditAmount: creditGranted,
          totalCredit: newTotal,
        })
      } catch (e) {
        console.error('[feedback] Credit email failed:', e)
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Feedback received — thank you.',
      creditGranted,
      totalCredit: newTotal,
    })
  } catch (e) {
    console.error('[feedback]', e)
    return NextResponse.json({ error: 'Feedback submission failed' }, { status: 500 })
  }
}
