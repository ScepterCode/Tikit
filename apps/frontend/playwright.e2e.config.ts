import { defineConfig } from '@playwright/test';

/**
 * Walking-skeleton end-to-end tests.
 *
 * Separate from playwright.config.ts (which runs tests/integration/ — older
 * UI-presence specs written against selectors that may no longer exist).
 * These run against a real staging Supabase and a real API, and assert
 * outcomes in the database.
 *
 *   npm run test:e2e
 *
 * Skips cleanly when the staging variables are absent, so it is safe in CI
 * for anyone without a staging environment.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['list'], ['github']] : [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
