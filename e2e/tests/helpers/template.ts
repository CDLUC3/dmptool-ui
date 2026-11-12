import { expect, type APIRequestContext, type Locator, type Page, type Response } from '@playwright/test';

export const GRAPHQL_URL = process.env.GRAPHQL_URL ?? 'http://localhost:4000/graphql';

// Resolves with the next GraphQL response for the named operation. Start waiting before the action that sends it.
export function graphqlResponse(page: Page, operationName: string): Promise<Response> {
  return page.waitForResponse(
    (res) => res.url().includes('/graphql') && res.request().postDataJSON()?.operationName === operationName
  );
}

// Sends a GraphQL request as the browser context's logged-in user and returns the parsed body
export async function graphql(request: APIRequestContext, query: string, variables?: Record<string, unknown>) {
  const response = await request.post(GRAPHQL_URL, { data: { query, variables } });
  return response.json();
}

// Archiving a template that has no plans deletes it, so test templates don't pile up
export async function archiveTemplate(request: APIRequestContext, templateId: number) {
  const body = await graphql(
    request,
    'mutation ArchiveTemplate($templateId: Int!) { archiveTemplate(templateId: $templateId) { id errors { general } } }',
    { templateId }
  );
  expect(body.errors, `archiving test template ${templateId}`).toBeUndefined();
  expect(body.data.archiveTemplate.errors?.general ?? null).toBeNull();
}

// The body of a TinyMCE editor. TinyMCE renders each editor in an iframe whose id starts with the field's id
export function editorBody(page: Page, idPrefix: string): Locator {
  return page.frameLocator(`iframe[id^="${idPrefix}"]`).locator('body');
}

// Types into a TinyMCE editor. The editor saves its content on key events, so type rather than fill.
// Keys typed while TinyMCE is still starting up, or while it re-creates its iframe, are lost, so retry until the
// text sticks. Each try selects everything and types the whole content (what was there plus the new text), so a
// retry never types the text twice
export async function typeInEditor(page: Page, idPrefix: string, text: string) {
  const body = editorBody(page, idPrefix);
  const content = `${(await body.innerText()).trim()}${text}`;
  await expect(async () => {
    await body.click({ timeout: 2000 });
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type(content);
    await expect(body).toHaveText(content, { timeout: 2000 });
  }).toPass();
}

// Checks a React Aria checkbox or radio from the keyboard: focus it and press Space, as a keyboard user would.
// React Aria hides the real input and draws its own control, and some labels also contain other buttons
// (like "Click for more info" on the best practice tags), so clicking isn't reliable
export async function checkAria(input: Locator) {
  if (!(await input.isChecked())) {
    await input.focus();
    await input.press('Space');
  }
  await expect(input).toBeChecked();
}

// Runs the search on pages with a React Aria SearchField. Its Search button is named "Clear search",
// so it's found as the only button in the search region. Retries until React has hydrated and the
// search has run, which `searched` confirms
export async function search(page: Page, term: string, searched: () => Promise<void>) {
  const region = page.getByRole('search');
  await expect(async () => {
    await region.getByRole('searchbox').fill(term);
    await region.getByRole('button').click();
    await searched();
  }).toPass();
}

// Step 1 of /template/create: names the template and continues to step 2.
// Retries until React has hydrated; a click on Next before hydration is ignored.
// exact: true so it doesn't also match the "Open Next.js Dev Tools" button in dev mode
export async function nameNewTemplate(page: Page, name: string) {
  await page.goto('/en-US/template/create');
  const startNewButton = page.getByTestId('startNewButton');
  await expect(async () => {
    // Skip once step 2 is showing, in case an earlier try's click just took a while
    if (!(await startNewButton.isVisible())) {
      await page.getByLabel('Name of your template').fill(name, { timeout: 2000 });
      await page.getByRole('button', { name: 'Next', exact: true }).click({ timeout: 2000 });
    }
    await expect(startNewButton).toBeVisible({ timeout: 2000 });
  }).toPass();
}

// The sidebar row on the template page with the given heading, e.g. "Visibility settings"
export function sidebarRow(page: Page, heading: string): Locator {
  return page.getByRole('complementary').locator('.panelRow')
    .filter({ has: page.getByRole('heading', { name: heading, exact: true }) });
}

// Opens a dialog by clicking `opener`. Retries until React has hydrated; a click before hydration is ignored.
// Skips the click once the dialog is open, in case an earlier try's click just took a while
export async function openDialog(page: Page, opener: Locator): Promise<Locator> {
  const dialog = page.getByRole('dialog');
  await expect(async () => {
    if (!(await dialog.isVisible())) {
      await opener.click({ timeout: 2000 });
    }
    await expect(dialog).toBeVisible({ timeout: 2000 });
  }).toPass();
  return dialog;
}
