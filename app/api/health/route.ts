import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      database: !!process.env.DATABASE_URL,
      resend: !!process.env.RESEND_API_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
    },
  })
}
