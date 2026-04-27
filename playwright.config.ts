import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'https://test.hive.baby',
    extraHTTPHeaders: { 'Accept': 'application/json' },
  },
})
