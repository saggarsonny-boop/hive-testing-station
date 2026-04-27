import { test, expect } from '@playwright/test'

const BASE = 'https://test.hive.baby'

test('homepage loads', async ({ page }) => {
  await page.goto(BASE)
  await expect(page).toHaveTitle(/Hive Testing Station/i)
})

test('engine page loads', async ({ page }) => {
  await page.goto(`${BASE}/test/hivephoto`)
  await expect(page.locator('form')).toBeVisible()
})

test('health endpoint returns ok', async ({ request }) => {
  const res = await request.get(`${BASE}/api/health`)
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.ok).toBe(true)
  expect(body.timestamp).toBeTruthy()
})

test('signup rejects honeypot', async ({ request }) => {
  const res = await request.post(`${BASE}/api/apply`, {
    data: {
      name: 'Bot',
      email: 'bot@bot.com',
      engineSlug: 'hivephoto',
      country: 'GB',
      device: 'desktop',
      browser: 'chrome',
      honeypot: 'filled',
      agreedFeedback: true,
    },
  })
  expect(res.status()).toBe(400)
  const body = await res.json()
  expect(body.error).toBeTruthy()
})

test('signup validates required fields', async ({ request }) => {
  const res = await request.post(`${BASE}/api/apply`, {
    data: {
      honeypot: '',
      // missing required fields
    },
  })
  expect(res.status()).toBe(400)
})

test('engines endpoint returns list', async ({ request }) => {
  const res = await request.get(`${BASE}/api/engines`)
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(Array.isArray(body.engines)).toBe(true)
})

test('leaderboard endpoint returns list', async ({ request }) => {
  const res = await request.get(`${BASE}/api/leaderboard`)
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(Array.isArray(body.leaderboard)).toBe(true)
})

test('unknown tester returns 404', async ({ request }) => {
  const res = await request.get(`${BASE}/api/tester?id=XXXX-9999`)
  expect(res.status()).toBe(404)
})
