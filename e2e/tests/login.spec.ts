import { test, expect } from '@playwright/test';
import { LOCALE, login } from './helpers/login';
import { credentialsFor, loggedOut } from './helpers/roles';

// Start logged out, ignoring the sessions saved by auth.setup.ts
test.use(loggedOut);

test('logging in with email and password goes to the home page and shows the logged-in header', async ({ page }) => {
  await login(page, credentialsFor('researcher'));

  await expect(page).toHaveURL(new RegExp(`/${LOCALE}/?$`));
  await expect(page.getByTestId('logoutButtonDesktop')).toBeVisible();
});

test('a logged-out user sees the Login button in the header', async ({ page }) => {
  await page.goto(`/${LOCALE}`);

  await expect(page.getByTestId('logoutButtonDesktop')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Login', exact: true }).first()).toBeVisible();
});
