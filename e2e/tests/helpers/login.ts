import { expect, type Page } from '@playwright/test';
import type { Credentials } from './roles';

export const LOCALE = 'en-US';

// Traces record the text typed with fill(), including passwords, so specs that call login() turn them off
export const NO_TRACE = { trace: 'off' } as const;

// The login form is two steps: enter the email and Continue, then enter the password and Login.
// Uses the regular (non-SSO) email and password login.
export async function login(page: Page, { email, password }: Credentials) {
  await page.goto(`/${LOCALE}/login`);

  // Retry until React has hydrated; a click on Continue before hydration is ignored
  await expect(async () => {
    await page.getByLabel('Email address').fill(email);
    await page.getByTestId('actionContinue').click();
    await expect(page.getByTestId('passInput')).toBeVisible({ timeout: 1000 });
  }).toPass();

  await page.getByTestId('passInput').fill(password);
  await page.getByTestId('actionSubmit').click();

  // A successful login leaves the login page for the home page
  await page.waitForURL((url) => !url.pathname.includes('/login'));
}
