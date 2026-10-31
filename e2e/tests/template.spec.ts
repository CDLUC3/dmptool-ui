import { test, expect, type Page } from '@playwright/test';
import { LOCALE } from './helpers/login';
import { asRole } from './helpers/roles';

const GRAPHQL_URL = process.env.GRAPHQL_URL ?? 'http://localhost:4000/graphql';

// Templates are an admin page; start already logged in as the admin saved by auth.setup.ts
test.use(asRole('admin'));

// Creates a blank template through the UI. The template belongs to the admin's current affiliation,
// so the test doesn't depend on which affiliation the admin has or on seeded templates.
// onCreated gets the new id as soon as Apollo returns it, so the template is cleaned up even if the page fails afterwards.
async function createTemplate(page: Page, name: string, onCreated: (id: number) => void) {
  await page.goto(`/${LOCALE}/template/create`);

  // Step 1: name the template. Retry until React has hydrated; a click on Next before hydration is ignored.
  // exact: true so it doesn't also match the "Open Next.js Dev Tools" button in dev mode
  const startNewButton = page.getByTestId('startNewButton');
  await expect(async () => {
    await page.getByLabel('Name of your template').fill(name);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(startNewButton).toBeVisible({ timeout: 2000 });
  }).toPass();

  // Step 2: start from a blank template, which opens the new template's page
  const addTemplateResponse = page.waitForResponse(
    (res) => res.url().includes('/graphql') && res.request().postDataJSON()?.operationName === 'AddTemplate'
  );
  await startNewButton.click();
  const body = await (await addTemplateResponse).json();
  const id: number | undefined = body.data?.addTemplate?.id;
  expect(id, 'the AddTemplate mutation returns the new template id').toBeTruthy();
  onCreated(id as number);

  await page.waitForURL(new RegExp(`/${LOCALE}/template/${id}$`));
  // Wait for the new template's page to render, so a later page.goto doesn't interrupt the navigation
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

let templateId: number | undefined;

test.afterEach(async ({ page }) => {
  if (!templateId) return;

  // Archiving a template with no plans deletes it, so test templates don't pile up
  const response = await page.request.post(GRAPHQL_URL, {
    data: {
      operationName: 'ArchiveTemplate',
      query: 'mutation ArchiveTemplate($templateId: Int!) { archiveTemplate(templateId: $templateId) { id errors { general } } }',
      variables: { templateId },
    },
  });
  const body = await response.json();
  expect(body.errors, 'archiving the test template').toBeUndefined();
  expect(body.data.archiveTemplate.errors?.general ?? null).toBeNull();
  templateId = undefined;
});

test('a template created by the admin is listed on the templates page', async ({ page }, testInfo) => {
  const name = `E2E template ${testInfo.project.name} ${Date.now()}`;
  await createTemplate(page, name, (id) => { templateId = id; });

  await page.goto(`/${LOCALE}/template`);
  await expect(page).toHaveTitle(/Organization templates/);

  // Search by name, so the template is found even if the organization has more templates than one page shows
  const searchResponse = page.waitForResponse(
    (res) => res.url().includes('/graphql')
      && res.request().postDataJSON()?.operationName === 'Templates'
      && res.request().postDataJSON()?.variables?.term === name.toLowerCase()
  );
  await page.getByLabel('Search by keyword').fill(name);
  // The Search button sits inside a React Aria SearchField, which names it "Clear search",
  // so find it as the only button in the search region rather than by name
  await page.getByRole('search').getByRole('button').click();

  const body = await (await searchResponse).json();
  expect(body.errors).toBeUndefined();
  expect(body.data.myTemplates.items.map((t: { id: number }) => t.id)).toContain(templateId);

  await expect(
    page.getByRole('list', { name: 'List of templates' }).getByRole('heading', { name })
  ).toBeVisible();
});
