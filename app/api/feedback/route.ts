import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { testerId, engineSlug, overallRating, whatWorked, whatBroke, uiIssues, wouldUseRegularly, anythingElse } = body

    if (!testerId || !engineSlug || !overallRating) {
      return NextResponse.json({ error: 'Tester ID, engine, and rating are required' }, { status: 400 })
    }

    if (overallRating < 1 || overallRating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const sql = getDb()

    const tester = await sql`
      SELECT id, engine_slug, feedback_submitted
      FROM hive_testers
      WHERE tester_id = ${testerId.toUpperCase()} AND email_verified = TRUE
      LIMIT 1
    ` as Array<{ id: string; engine_slug: string; feedback_submitted: boolean }>

    if (!tester.length) {
      return NextResponse.json({ error: 'Tester ID not found or email not verified' }, { status: 404 })
    }

    if (tester[0].feedback_submitted) {
      return NextResponse.json({ error: 'Feedback already submitted for this tester ID' }, { status: 409 })
    }

    await sql`
      INSERT INTO tester_feedback (
        tester_id, engine_slug, overall_rating,
        what_worked, what_broke, ui_issues, would_use_regularly, anything_else
      ) VALUES (
        ${testerId.toUpperCase()}, ${engineSlug}, ${overallRating},
        ${whatWorked || null}, ${whatBroke || null}, ${uiIssues || null},
        ${wouldUseRegularly ?? null}, ${anythingElse || null}
      )
    `

    await sql`
      UPDATE hive_testers
      SET feedback_submitted = TRUE, feedback_at = NOW()
      WHERE tester_id = ${testerId.toUpperCase()}
    `

    return NextResponse.json({ ok: true, message: 'Feedback received — thank you.' })
  } catch (e) {
    console.error('[feedback]', e)
    return NextResponse.json({ error: 'Feedback submission failed' }, { status: 500 })
  }
}
