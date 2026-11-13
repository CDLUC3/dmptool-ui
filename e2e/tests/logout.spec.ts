import { test, expect } from '@playwright/test';
import { LOCALE, NO_TRACE, login } from './helpers/login';
import { credentialsFor, loggedOut } from './helpers/roles';

// Logs in fresh in each test, so logging out doesn't invalidate the sessions saved by auth.setup.ts
test.use(loggedOut);

// These tests type a password, so never record a trace
test.use(NO_TRACE);

test.describe('on desktop', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('logging out from the Account menu goes to the login page', async ({ page }) => {
    await login(page, credentialsFor('researcher'));

    // Login ends with a full page load, so retry until the header has hydrated and the menu opens
    const logoutItem = page.getByTestId('logoutButtonDesktop');
    await expect(async () => {
      if (!(await logoutItem.isVisible())) {
        await page.getByTestId('accountMenuDesktop').click({ timeout: 2000 });
      }
      await expect(logoutItem).toBeVisible({ timeout: 2000 });
    }).toPass();

    await logoutItem.click();

    await expect(page).toHaveURL(new RegExp(`/${LOCALE}/login`));
  });
});

test.describe('on mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('logging out from the mobile menu goes to the login page', async ({ page }) => {
    await login(page, credentialsFor('researcher'));

    // Login ends with a full page load, so retry until the header has hydrated and the menu has slid fully into view
    const mobileNav = page.locator('#mobile-navigation');
    await expect(async () => {
      await page.locator('#mobile-menu-open').click();
      await expect(mobileNav).toBeInViewport({ ratio: 1, timeout: 1000 });
    }).toPass();

    await mobileNav.getByTestId('logoutButtonMobile').click();

    await expect(page).toHaveURL(new RegExp(`/${LOCALE}/login`));
  });
});
