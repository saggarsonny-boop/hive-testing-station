import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getEngineBySlug } from '@/lib/engines'
import { sendTesterKitEmail } from '@/lib/email'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://test.hive.baby'

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/?error=invalid-token`)
  }

  try {
    const sql = getDb()

    const rows = await sql`
      SELECT id, tester_id, name, email, engine_slug, engine_name,
             verify_token_expires_at, email_verified
      FROM hive_testers
      WHERE verify_token = ${token}
      LIMIT 1
    ` as Array<{
      id: string; tester_id: string; name: string; email: string;
      engine_slug: string; engine_name: string;
      verify_token_expires_at: string; email_verified: boolean;
    }>

    if (!rows.length) {
      return NextResponse.redirect(`${baseUrl}/?error=invalid-token`)
    }

    const tester = rows[0]

    if (tester.email_verified) {
      return NextResponse.redirect(`${baseUrl}/confirm/${tester.tester_id}`)
    }

    if (new Date() > new Date(tester.verify_token_expires_at)) {
      return NextResponse.redirect(`${baseUrl}/?error=token-expired`)
    }

    await sql`
      UPDATE hive_testers
      SET email_verified = TRUE, verify_token = NULL, verify_token_expires_at = NULL
      WHERE id = ${tester.id}
    `

    const engine = getEngineBySlug(tester.engine_slug)
    if (engine) {
      const testerNumber = parseInt(tester.tester_id.split('-')[1] ?? '1', 10)
      await sendTesterKitEmail({
        to: tester.email,
        name: tester.name,
        testerId: tester.tester_id,
        engineName: engine.name,
        engineUrl: engine.url,
        testerNumber,
        checklist: engine.checklist,
      })
    }

    return NextResponse.redirect(`${baseUrl}/confirm/${tester.tester_id}`)
  } catch (e) {
    console.error('[verify]', { error: (e as Error).message, stack: (e as Error).stack, timestamp: new Date().toISOString(), path: req.url })
    return NextResponse.redirect(`${baseUrl}/?error=server-error`)
  }
}
