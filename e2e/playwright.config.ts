import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';

// Load e2e/.env for local runs (Node's built-in loader, no dotenv needed).
// Skipped when the file is absent, e.g. on CI where variables come from secrets.
const envFile = path.resolve(import.meta.dirname, '.env');
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

// Use the app's auth cookie names from the root .env.local, unless e2e/.env already sets them.
// Only these names are copied, so the app's other settings don't leak into the tests.
const appEnvFile = path.resolve(import.meta.dirname, '../.env.local');
if (fs.existsSync(appEnvFile)) {
  const appEnv = parseEnv(fs.readFileSync(appEnvFile, 'utf8'));
  for (const name of ['ACCESS_TOKEN_NAME', 'REFRESH_TOKEN_NAME']) {
    if (!process.env[name] && appEnv[name]) {
      process.env[name] = appEnv[name];
    }
  }
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  // Run tests in files in parallel
  fullyParallel: true,
  // Retry on CI only, so flaky tests are reported as "flaky" instead of hidden
  retries: process.env.CI ? 2 : 0,
  // Limit the number of workers on CI to avoid overloading the environment
  workers: process.env.CI ? 1 : undefined,
  // reporter tells Playwright how to report results. The list reporter is always used,
  //  and the html and junit reporters are added on CI.
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
    // Logs in once per role and saves each session for the browser projects below. It types passwords,
    // so it never records a trace, screenshot or video. The cleanup project deletes the saved sessions after the run.
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup',
      use: { trace: 'off', screenshot: 'off', video: 'off' },
    },
    { name: 'cleanup', testMatch: /.*\.teardown\.ts/ },
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
