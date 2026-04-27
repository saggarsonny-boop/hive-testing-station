import { neon } from '@neondatabase/serverless'

export function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not set')
  return neon(url)
}

export async function initDb() {
  const sql = getDb()
  await sql`
    CREATE TABLE IF NOT EXISTS engine_slots (
      engine_slug TEXT PRIMARY KEY,
      engine_name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      max_testers INT NOT NULL DEFAULT 100,
      current_testers INT NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      checklist JSONB NOT NULL DEFAULT '[]'
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS hive_testers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tester_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      engine_slug TEXT NOT NULL REFERENCES engine_slots(engine_slug),
      engine_name TEXT NOT NULL,
      country TEXT NOT NULL,
      device TEXT NOT NULL,
      browser TEXT NOT NULL,
      agreed_feedback BOOLEAN NOT NULL DEFAULT FALSE,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      verify_token TEXT,
      verify_token_expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      feedback_submitted BOOLEAN NOT NULL DEFAULT FALSE,
      feedback_at TIMESTAMPTZ,
      credit_granted BOOLEAN NOT NULL DEFAULT FALSE,
      CONSTRAINT unique_email_per_engine UNIQUE (email, engine_slug)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS tester_feedback (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tester_id TEXT NOT NULL REFERENCES hive_testers(tester_id),
      engine_slug TEXT NOT NULL,
      overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
      what_worked TEXT,
      what_broke TEXT,
      ui_issues TEXT,
      would_use_regularly BOOLEAN,
      anything_else TEXT,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS signup_rate_limits (
      ip TEXT NOT NULL,
      engine_slug TEXT NOT NULL,
      attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (ip, engine_slug)
    )
  `
}
