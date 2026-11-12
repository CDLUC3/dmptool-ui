import { expect, type Page } from '@playwright/test';
import type { Credentials } from './roles';

export const LOCALE = 'en-US';

// Traces record the text typed with fill(), including passwords, so specs that call login() turn them off
export const NO_TRACE = { trace: 'off' } as const;

// The login form is two steps: enter the email and Continue, then enter the password and Login.
// Uses the regular (non-SSO) email and password login.
// Retries the whole login until it leaves the login page: a click before React has hydrated is ignored, and in
// dev mode the page can reload while the password is being typed. Submitting the login again is harmless
export async function login(page: Page, { email, password }: Credentials) {
  await page.goto(`/${LOCALE}/login`);

  await expect(async () => {
    if (!new URL(page.url()).pathname.includes('/login')) return;
    if (!(await page.getByTestId('passInput').isVisible())) {
      await page.getByLabel('Email address').fill(email, { timeout: 2000 });
      await page.getByTestId('actionContinue').click({ timeout: 2000 });
      await expect(page.getByTestId('passInput')).toBeVisible({ timeout: 2000 });
    }
    await page.getByTestId('passInput').fill(password, { timeout: 2000 });
    await page.getByTestId('actionSubmit').click({ timeout: 2000 });
    // A successful login leaves the login page for the home page
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 });
  }).toPass({ timeout: 60_000 });
}
