import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const runtime = 'nodejs'

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  return (req.headers.get('x-admin-secret') ?? '') === secret
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { testerId, note } = await req.json()
  if (!testerId) return NextResponse.json({ error: 'testerId required' }, { status: 400 })

  const sql = getDb()
  const result = await sql`
    UPDATE hive_testers SET notes = ${note ?? null}
    WHERE tester_id = ${testerId.toUpperCase()}
    RETURNING tester_id
  `
  if (!result.length) return NextResponse.json({ error: 'Tester not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
