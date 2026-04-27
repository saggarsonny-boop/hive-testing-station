import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const runtime = 'nodejs'

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const auth = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret')
  return auth === secret
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sql = getDb()
  const testers = await sql`
    SELECT
      t.tester_id,
      t.name,
      t.email,
      t.engine_slug,
      t.engine_name,
      t.country,
      t.device,
      t.browser,
      t.email_verified,
      t.feedback_submitted,
      t.feedback_at,
      t.credit_earned_usd,
      t.credit_granted_usd,
      t.stripe_customer_id,
      t.engines_tested,
      t.notes,
      t.created_at,
      jsonb_array_length(t.engines_tested) AS engines_tested_count
    FROM hive_testers t
    ORDER BY t.created_at DESC
  `
  return NextResponse.json({ testers })
}
