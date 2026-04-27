import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const runtime = 'nodejs'

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  return (req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret') ?? '') === secret
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const testerId = req.nextUrl.searchParams.get('testerId')
  const sql = getDb()

  const rows = testerId
    ? await sql`SELECT * FROM tester_feedback WHERE tester_id = ${testerId.toUpperCase()} ORDER BY submitted_at DESC`
    : await sql`SELECT * FROM tester_feedback ORDER BY submitted_at DESC LIMIT 200`

  return NextResponse.json({ feedback: rows })
}
