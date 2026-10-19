import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Load e2e/.env for local runs (Node's built-in loader, no dotenv needed).
// Skipped when the file is absent, e.g. on CI where variables come from secrets.
const envFile = path.resolve(import.meta.dirname, '.env');
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if test.only was accidentally left in the source code
  forbidOnly: !!process.env.CI,
  // Retry on CI only, so flaky tests are reported as "flaky" instead of hidden
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    locale: 'en-US',
    // Collect a trace when retrying a failed test. See https://playwright.dev/docs/trace-viewer
    trace: 'on-first-retry',
  },

  projects: [
    // Logs in once per role and saves each session for the browser projects below
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
  ],
});
