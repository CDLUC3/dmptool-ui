import { test, expect } from '@playwright/test';
import { LOCALE } from './helpers/login';
import { asRole } from './helpers/roles';

// Templates are an admin page; start already logged in as the admin saved by auth.setup.ts
test.use(asRole('admin'));

test('the templates page loads the organization templates from Apollo', async ({ page }) => {
  const templatesResponse = page.waitForResponse(
    (res) => res.url().includes('/graphql') && res.request().postDataJSON()?.operationName === 'Templates'
  );

  await page.goto(`/${LOCALE}/template`);

  await expect(page).toHaveTitle(/Organization templates/);

  const body = await (await templatesResponse).json();
  expect(body.data.myTemplates.items.length).toBeGreaterThan(0);
});
