import { test as setup, expect } from '@playwright/test';
import { login } from './helpers/login';
import { ROLES, authFile, credentialsFor } from './helpers/roles';

// Runs once before the browser projects: logs in as each role and saves the session,
// so tests can start already logged in with test.use(asRole('admin')) instead of logging in every time.
for (const role of ROLES) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    await login(page, credentialsFor(role));

    // The header should show the logged-in state once the auth cookies are set
    await expect(page.getByTestId('logoutButtonDesktop')).toBeVisible();

    await page.context().storageState({ path: authFile(role) });
  });
}
