import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { ENGINES } from '@/lib/engines'

export const runtime = 'nodejs'
export const revalidate = 30

export async function GET() {
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT engine_slug, engine_name, max_testers, current_testers, active
      FROM engine_slots
      WHERE active = TRUE
      ORDER BY engine_slug
    `
    const slotMap = Object.fromEntries(
      (rows as Array<{ engine_slug: string; max_testers: number; current_testers: number; active: boolean }>)
        .map(r => [r.engine_slug, { max: r.max_testers, current: r.current_testers }])
    )
    const engines = ENGINES.map(e => ({
      ...e,
      maxTesters: slotMap[e.slug]?.max ?? 100,
      currentTesters: slotMap[e.slug]?.current ?? 0,
      spotsRemaining: Math.max(0, (slotMap[e.slug]?.max ?? 100) - (slotMap[e.slug]?.current ?? 0)),
      isFull: (slotMap[e.slug]?.current ?? 0) >= (slotMap[e.slug]?.max ?? 100),
    }))
    return NextResponse.json({ engines })
  } catch {
    // Fall back to static data if DB unavailable
    const engines = ENGINES.map(e => ({
      ...e,
      maxTesters: 100,
      currentTesters: 0,
      spotsRemaining: 100,
      isFull: false,
    }))
    return NextResponse.json({ engines })
  }
}
