import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getDb } from '@/lib/db'
import { Resend } from 'resend'

export const runtime = 'nodejs'

function checkAuth(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true
  return req.headers.get('authorization') === `Bearer ${cronSecret}`
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]
    const todayTs = Math.floor(today.getTime() / 1000)
    const yesterdayTs = todayTs - 86400

    let stripeData: {
      mrr_cents: number
      active_subscriptions: number
      new_today: number
      cancelled_today: number
      revenue_by_product: Record<string, number>
    } | null = null

    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

      // Active subscriptions — calculate MRR
      const activeSubs = await stripe.subscriptions.list({ status: 'active', limit: 100, expand: ['data.items.data.price.product'] })
      let mrr = 0
      const revenueByProduct: Record<string, number> = {}

      for (const sub of activeSubs.data) {
        for (const item of sub.items.data) {
          const interval = item.price.recurring?.interval
          const amount = item.price.unit_amount || 0
          const monthly = interval === 'year' ? amount / 12 : interval === 'month' ? amount : 0
          mrr += monthly
          const prod = item.price.product
          const productName = typeof prod === 'object' && prod !== null && 'name' in prod
            ? (prod as Stripe.Product).name
            : typeof prod === 'string' ? prod : 'unknown'
          revenueByProduct[productName] = (revenueByProduct[productName] || 0) + monthly
        }
      }

      // New subscriptions created today
      const newSubs = await stripe.subscriptions.list({
        created: { gte: todayTs },
        status: 'active',
        limit: 100,
      })

      // Cancelled subscriptions since yesterday
      const cancelledSubs = await stripe.subscriptions.list({
        created: { gte: yesterdayTs },
        status: 'canceled',
        limit: 100,
      })

      stripeData = {
        mrr_cents: Math.round(mrr),
        active_subscriptions: activeSubs.data.length,
        new_today: newSubs.data.length,
        cancelled_today: cancelledSubs.data.length,
        revenue_by_product: revenueByProduct,
      }
    }

    // Upsert into noi_daily
    await sql`
      INSERT INTO noi_daily (date, mrr_cents, active_subscriptions, new_today, cancelled_today, revenue_by_product, raw_data)
      VALUES (
        ${todayStr},
        ${stripeData?.mrr_cents ?? 0},
        ${stripeData?.active_subscriptions ?? 0},
        ${stripeData?.new_today ?? 0},
        ${stripeData?.cancelled_today ?? 0},
        ${JSON.stringify(stripeData?.revenue_by_product ?? {})},
        ${JSON.stringify(stripeData ?? {})}
      )
      ON CONFLICT (date) DO UPDATE SET
        mrr_cents = EXCLUDED.mrr_cents,
        active_subscriptions = EXCLUDED.active_subscriptions,
        new_today = EXCLUDED.new_today,
        cancelled_today = EXCLUDED.cancelled_today,
        revenue_by_product = EXCLUDED.revenue_by_product,
        raw_data = EXCLUDED.raw_data,
        updated_at = NOW()
    `

    // Weekly P&L email every Monday
    const isMonday = now.getDay() === 1
    let weeklySent = false

    if (isMonday && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)

      const rows = await sql`
        SELECT date, mrr_cents, active_subscriptions, new_today, cancelled_today
        FROM noi_daily
        WHERE date >= ${weekAgo.toISOString().split('T')[0]}
        ORDER BY date DESC
      ` as Array<{ date: string; mrr_cents: number; active_subscriptions: number; new_today: number; cancelled_today: number }>

      const latestMrr = rows[0]?.mrr_cents ?? 0
      const totalNew = rows.reduce((s, r) => s + (r.new_today || 0), 0)
      const totalCancelled = rows.reduce((s, r) => s + (r.cancelled_today || 0), 0)
      const net = totalNew - totalCancelled

      const tableRows = rows.map(r =>
        `<tr><td>${r.date}</td><td>£${((r.mrr_cents || 0) / 100).toFixed(2)}</td><td>+${r.new_today || 0}</td><td>-${r.cancelled_today || 0}</td></tr>`
      ).join('')

      await resend.emails.send({
        from: 'Hive NOI <hive@hive.baby>',
        to: 'saggarsonny@gmail.com',
        subject: `Hive Weekly P&L — w/c ${todayStr}`,
        html: `
          <h2>Hive Weekly P&L</h2>
          <table cellpadding="6" style="border-collapse:collapse;margin-bottom:16px">
            <tr><td><strong>MRR</strong></td><td>£${(latestMrr / 100).toFixed(2)}</td></tr>
            <tr><td><strong>New subscriptions</strong></td><td>+${totalNew}</td></tr>
            <tr><td><strong>Cancellations</strong></td><td>-${totalCancelled}</td></tr>
            <tr><td><strong>Net change</strong></td><td>${net >= 0 ? '+' : ''}${net}</td></tr>
          </table>
          <h3>Daily breakdown</h3>
          <table border="1" cellpadding="4" style="border-collapse:collapse;font-size:13px">
            <tr><th>Date</th><th>MRR</th><th>New</th><th>Cancelled</th></tr>
            ${tableRows}
          </table>
          <p style="color:#888;font-size:12px;margin-top:24px">No ads. No investors. No agenda.</p>
        `,
      })
      weeklySent = true
    }

    return NextResponse.json({
      ok: true,
      date: todayStr,
      stripe: stripeData,
      weekly_email_sent: weeklySent,
    })
  } catch (e) {
    console.error('[cron/noi]', { error: (e as Error).message, stack: (e as Error).stack, timestamp: new Date().toISOString() })
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
