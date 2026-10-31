import { test, expect } from '@playwright/test';
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from './helpers/cookies';
import { LOCALE, NO_TRACE, login } from './helpers/login';
import { credentialsFor, loggedOut } from './helpers/roles';

// Start logged out, ignoring the sessions saved by auth.setup.ts
test.use(loggedOut);

// These tests type a password, so never record a trace
test.use(NO_TRACE);

test('logging in with email and password goes to the home page and shows the logged-in header', async ({ page }) => {
  await login(page, credentialsFor('researcher'));

  await expect(page).toHaveURL(new RegExp(`/${LOCALE}/?$`));
  await expect(page.getByTestId('logoutButtonDesktop')).toBeVisible();
});

test('logging in sets the http-only access and refresh token cookies', async ({ page }) => {
  await login(page, credentialsFor('researcher'));

  const cookies = await page.context().cookies();
  for (const name of [ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME]) {
    const cookie = cookies.find((c) => c.name === name);
    expect(cookie, `${name} cookie`).toBeDefined();
    expect(cookie?.httpOnly, `${name} is http-only`).toBe(true);
  }
});

test('a logged-out user sees the Login button in the header', async ({ page }) => {
  await page.goto(`/${LOCALE}`);

  await expect(page.getByTestId('logoutButtonDesktop')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Login', exact: true }).first()).toBeVisible();
});
