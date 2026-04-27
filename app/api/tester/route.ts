import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    const sql = getDb()
    const rows = await sql`
      SELECT tester_id, name, engine_slug, engine_name, email_verified, created_at
      FROM hive_testers
      WHERE tester_id = ${id.toUpperCase()} AND email_verified = TRUE
      LIMIT 1
    ` as Array<{ tester_id: string; name: string; engine_slug: string; engine_name: string; email_verified: boolean; created_at: string }>

    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ tester: rows[0] })
  } catch (e) {
    console.error('[tester]', { error: (e as Error).message, stack: (e as Error).stack, timestamp: new Date().toISOString(), path: req.url })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
