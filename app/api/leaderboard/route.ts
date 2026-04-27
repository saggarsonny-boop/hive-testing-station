import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const runtime = 'nodejs'

interface TesterRow {
  tester_id: string
  name: string
  engines_tested: string[]
  items_tested: number
  issues_found: number
  feedback_submitted: boolean
  created_at: string
}

function computeDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return 'Unknown'
  const first = parts[0]
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0].toUpperCase() + '.' : ''
  return lastInitial ? `${first} ${lastInitial}` : first
}

function computeStatus(enginesCount: number, feedbackSubmitted: boolean): 'FOUNDING' | 'VERIFIED' | 'ACTIVE' {
  if (enginesCount >= 10) return 'FOUNDING'
  if (feedbackSubmitted) return 'VERIFIED'
  return 'ACTIVE'
}

export async function GET(req: NextRequest) {
  try {
    const sql = getDb()
    const testerId = req.nextUrl.searchParams.get('testerId')

    const rows = await sql`
      SELECT
        tester_id,
        name,
        engines_tested,
        items_tested,
        issues_found,
        feedback_submitted,
        created_at
      FROM hive_testers
      WHERE email_verified = TRUE
      ORDER BY
        jsonb_array_length(engines_tested) DESC,
        items_tested DESC,
        issues_found DESC,
        created_at ASC
      LIMIT 200
    ` as TesterRow[]

    const leaderboard = rows.map((row, index) => {
      const enginesCount = Array.isArray(row.engines_tested) ? row.engines_tested.length : 0
      return {
        rank: index + 1,
        testerId: row.tester_id,
        name: computeDisplayName(row.name),
        enginesTested: enginesCount,
        itemsTested: row.items_tested ?? 0,
        issuesFound: row.issues_found ?? 0,
        status: computeStatus(enginesCount, row.feedback_submitted),
      }
    })

    let myRank: number | undefined
    if (testerId) {
      const upperTesterId = testerId.toUpperCase()
      const found = leaderboard.find(entry => entry.testerId === upperTesterId)
      if (found) {
        myRank = found.rank
      } else {
        // Tester exists but may be outside top 200 — do a positional query
        try {
          const posRows = await sql`
            SELECT pos FROM (
              SELECT
                tester_id,
                ROW_NUMBER() OVER (
                  ORDER BY
                    jsonb_array_length(engines_tested) DESC,
                    items_tested DESC,
                    issues_found DESC,
                    created_at ASC
                ) AS pos
              FROM hive_testers
              WHERE email_verified = TRUE
            ) ranked
            WHERE tester_id = ${upperTesterId}
            LIMIT 1
          ` as Array<{ pos: string }>
          if (posRows.length) {
            myRank = parseInt(posRows[0].pos, 10)
          }
        } catch {
          // Non-fatal: myRank stays undefined
        }
      }
    }

    return NextResponse.json({
      leaderboard,
      ...(myRank !== undefined ? { myRank } : {}),
    })
  } catch (e) {
    console.error('[leaderboard]', e)
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
  }
}
