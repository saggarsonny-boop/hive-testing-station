import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { findOrCreateCustomer, grantCreditToCustomer } from '@/lib/stripe'

export const runtime = 'nodejs'

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  return (req.headers.get('x-admin-secret') ?? '') === secret
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { testerId, amountUsd, reason, overrideCap } = body

  if (!testerId || !amountUsd || amountUsd <= 0) {
    return NextResponse.json({ error: 'testerId and amountUsd required' }, { status: 400 })
  }

  const sql = getDb()
  const rows = await sql`
    SELECT id, email, name, credit_earned_usd, credit_granted_usd, stripe_customer_id
    FROM hive_testers
    WHERE tester_id = ${testerId.toUpperCase()}
    LIMIT 1
  ` as Array<{
    id: string; email: string; name: string;
    credit_earned_usd: number; credit_granted_usd: number;
    stripe_customer_id: string | null
  }>

  if (!rows.length) return NextResponse.json({ error: 'Tester not found' }, { status: 404 })

  const tester = rows[0]
  const MAX_CREDIT = 1000

  let grantAmount = amountUsd
  if (!overrideCap) {
    const headroom = MAX_CREDIT - tester.credit_earned_usd
    grantAmount = Math.min(grantAmount, headroom)
    if (grantAmount <= 0) {
      return NextResponse.json({ error: 'Tester has reached the $1,000 credit cap. Use overrideCap: true to bypass.' }, { status: 409 })
    }
  }

  let stripeCustomerId = tester.stripe_customer_id
  try {
    stripeCustomerId = stripeCustomerId ?? await findOrCreateCustomer({ email: tester.email, name: tester.name })
    if (stripeCustomerId) {
      await grantCreditToCustomer({
        customerId: stripeCustomerId,
        amountUsd: grantAmount,
        engineName: reason ?? 'Manual admin grant',
      })
    }
  } catch (e) {
    return NextResponse.json({ error: `Stripe error: ${(e as Error).message}` }, { status: 500 })
  }

  await sql`
    UPDATE hive_testers
    SET
      credit_earned_usd = credit_earned_usd + ${grantAmount},
      credit_granted_usd = credit_granted_usd + ${grantAmount},
      credit_granted = TRUE,
      stripe_customer_id = ${stripeCustomerId ?? null}
    WHERE tester_id = ${testerId.toUpperCase()}
  `

  return NextResponse.json({ ok: true, granted: grantAmount, reason })
}
