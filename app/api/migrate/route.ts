import { NextRequest, NextResponse } from 'next/server'
import { initDb, getDb } from '@/lib/db'
import { ENGINES } from '@/lib/engines'

export const runtime = 'nodejs'

async function runMigration() {
  await initDb()
  const sql = getDb()

  for (const engine of ENGINES) {
    await sql`
      INSERT INTO engine_slots (engine_slug, engine_name, description, max_testers, current_testers, active, checklist)
      VALUES (
        ${engine.slug},
        ${engine.name},
        ${engine.description},
        100,
        0,
        TRUE,
        ${JSON.stringify(engine.checklist)}
      )
      ON CONFLICT (engine_slug) DO UPDATE SET
        engine_name = EXCLUDED.engine_name,
        description = EXCLUDED.description,
        checklist = EXCLUDED.checklist
    `
  }

  return { ok: true, message: `Migrated and seeded ${ENGINES.length} engines` }
}

function checkAuth(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true
  return req.headers.get('authorization') === `Bearer ${cronSecret}`
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await runMigration()
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await runMigration()
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
