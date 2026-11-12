import { test, expect, type Page } from '@playwright/test';
import { LOCALE } from './helpers/login';
import { asRole, freshSession, type Role } from './helpers/roles';
import { PLAN_QUESTIONS, PLAN_SECTION, archiveProject, createPublishedTemplate } from './helpers/plan';
import { createProjectWithFunder, myAffiliationUri, removeCustomization } from './helpers/customization';
import { clickAndWaitFor, clickWhenHydrated, fillWhenHydrated } from './helpers/navigation';
import { archiveTemplate, graphqlResponse } from './helpers/template';

// The tests follow one customization from start to finish: the admin customizes the funder's template and
// publishes it, then the researcher writes a plan with it. They share its state, so they run in order, and if
// one fails, the rest are skipped. Each test goes through several pages, which can be slow to build in dev mode
test.describe.configure({ mode: 'serial', timeout: 120_000 });

// Shared by the tests in this file (one copy per browser project)
let funderTemplateName: string;
let funderTemplateId: number | undefined;
let customizationId: number | undefined;
let projectTitle: string;
let projectId: number | undefined;
let customQuestionText: string;
let customSectionName: string;
let customSectionQuestionText: string;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const customizationUrl = () => new RegExp(`/${LOCALE}/template/customizations/${customizationId}$`);

// The funder admin publishes a public template, which the admin can customize because their organization doesn't
// own it. The researcher's project names the funder organization as its funder, so the funder's templates are
// listed when the researcher creates a plan
test.beforeAll(async ({ playwright }, testInfo) => {
  const run = `${testInfo.project.name} ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  funderTemplateName = `E2E funder template ${run}`;
  projectTitle = `E2E customization project ${run}`;
  customQuestionText = `E2E custom question ${run}`;
  customSectionName = `E2E custom section ${run}`;
  customSectionQuestionText = `E2E custom section question ${run}`;

  const funder = await playwright.request.newContext({ storageState: await freshSession('funderAdmin') });
  funderTemplateId = await createPublishedTemplate(funder, funderTemplateName, 'PUBLIC');
  const funderUri = await myAffiliationUri(funder);
  await funder.dispose();

  const researcher = await playwright.request.newContext({ storageState: await freshSession('researcher') });
  projectId = await createProjectWithFunder(researcher, projectTitle, funderUri);
  await researcher.dispose();
});

// Remove everything even when a test failed, in dependency order: the project (which deletes its plan) before the
// customization the plan uses, and the customization before the funder template it customizes. Every step is tried
// before any failure is reported
test.afterAll(async ({ playwright }) => {
  const failures: unknown[] = [];
  const as = async (role: Role) => playwright.request.newContext({ storageState: await freshSession(role) });

  if (projectId !== undefined) {
    const researcher = await as('researcher');
    await archiveProject(researcher, projectId).catch((err) => failures.push(err));
    await researcher.dispose();
  }
  if (customizationId !== undefined) {
    const admin = await as('admin');
    await removeCustomization(admin, customizationId).catch((err) => failures.push(err));
    await admin.dispose();
  }
  if (funderTemplateId !== undefined) {
    const funder = await as('funderAdmin');
    await archiveTemplate(funder, funderTemplateId).catch((err) => failures.push(err));
    await funder.dispose();
  }

  projectId = customizationId = funderTemplateId = undefined;
  expect(failures, 'removing the test project, customization and funder template').toEqual([]);
});

// Adds a Text Field custom question from the customization's "Add question" link in `section`, and waits for the
// customization page to show it
async function addCustomQuestion(page: Page, section: string, text: string) {
  const sectionList = page.getByRole('list', { name: 'Questions list' })
    .filter({ has: page.getByRole('heading', { name: new RegExp(escapeRegExp(section)) }) });
  await clickAndWaitFor(
    page,
    sectionList.getByRole('link', { name: 'Add question' }),
    new RegExp(`/template/customizations/${customizationId}/q/new\\?section_id=\\d+`)
  );
  await clickWhenHydrated(page.locator('button[data-type="text"]'));
  await expect(page.getByRole('heading', { level: 1, name: 'Add new question' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Type' })).toHaveValue('Text Field');
  await fillWhenHydrated(page.getByLabel('Question text'), text);

  const added = graphqlResponse(page, 'AddCustomQuestion');
  await clickWhenHydrated(page.getByRole('button', { name: 'Save and add' }));
  const body = await (await added).json();
  expect(body.errors).toBeUndefined();
  expect(body.data?.addCustomQuestion?.errors?.general ?? null).toBeNull();

  await page.waitForURL(customizationUrl());
  await expect(page.getByRole('main').getByText(text, { exact: true })).toBeVisible();
}

test.describe('the admin customizes the funder template', () => {
  test.use(asRole('admin'));

  test('the funder template is listed as customizable, and Update starts a customization', async ({ page }) => {
    await page.goto(`/${LOCALE}/template/customizations`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Search for the funder template: the list also has every other public template.
    // Each template is a listitem inside another listitem, so take the inner one
    const item = page.getByRole('list', { name: 'List of templates' }).getByRole('listitem')
      .filter({ has: page.getByRole('heading', { name: funderTemplateName }) }).last();
    const searched = graphqlResponse(page, 'CustomizableTemplates');
    await fillWhenHydrated(page.getByRole('searchbox', { name: 'Search by keyword' }), funderTemplateName);
    // The Search button is inside the React Aria SearchField, which names it "Clear search"
    await clickWhenHydrated(page.getByRole('search').getByRole('button', { name: 'Clear search' }));
    await searched;
    await expect(item).toBeVisible();
    await expect(item).toContainText('DMP Tool API Testing Funder');
    await expect(item).toContainText('Not customized');
    // The item has two "Update" links, in its heading and its actions. Until the template is customized, neither goes
    // to a customization page: both create the customization first. Use the action
    const updateLinks = item.getByRole('link', { name: `Update ${funderTemplateName}` });
    await expect(updateLinks).toHaveCount(2);
    for (const link of await updateLinks.all()) {
      await expect(link).not.toHaveAttribute('href');
    }
    const added = graphqlResponse(page, 'AddTemplateCustomization');
    await clickWhenHydrated(updateLinks.last());
    const body = await (await added).json();
    expect(body.errors).toBeUndefined();
    expect(body.data?.addTemplateCustomization?.errors?.general ?? null).toBeNull();
    customizationId = body.data?.addTemplateCustomization?.customizationId;
    expect(customizationId, 'the AddTemplateCustomization mutation returns the new customization id').toBeTruthy();

    await page.waitForURL(customizationUrl());
    await expect(page.getByRole('heading', { level: 1, name: funderTemplateName })).toBeVisible();
    // The funder's section and questions are shown. Nothing has been customized yet, so there's nothing to publish
    await expect(page.getByRole('heading', { name: new RegExp(escapeRegExp(PLAN_SECTION.name)) })).toBeVisible();
    for (const question of Object.values(PLAN_QUESTIONS)) {
      await expect(page.getByRole('main').getByText(question.questionText, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Publish customization' })).toBeHidden();
  });

  test('a custom question is added to the funder\'s section', async ({ page }) => {
    await page.goto(`/${LOCALE}/template/customizations/${customizationId}`);
    await addCustomQuestion(page, PLAN_SECTION.name, customQuestionText);
    // Once something is customized, the customization is a draft that can be published
    await expect(page.getByRole('button', { name: 'Publish customization' })).toBeVisible();
  });

  test('a custom section is added, with a custom question in it', async ({ page }) => {
    await page.goto(`/${LOCALE}/template/customizations/${customizationId}`);
    await clickAndWaitFor(
      page,
      page.getByRole('link', { name: 'Add section' }),
      new RegExp(`/template/customizations/${customizationId}/section/create$`)
    );
    await expect(page.getByRole('heading', { level: 1, name: 'Create section' })).toBeVisible();
    await fillWhenHydrated(page.getByLabel('Section name'), customSectionName);

    const added = graphqlResponse(page, 'AddCustomSection');
    await clickWhenHydrated(page.getByRole('button', { name: 'Create section' }));
    const body = await (await added).json();
    expect(body.errors).toBeUndefined();
    expect(body.data?.addCustomSection?.errors?.general ?? null).toBeNull();

    await page.waitForURL(customizationUrl());
    await expect(page.getByRole('heading', { name: new RegExp(escapeRegExp(customSectionName)) })).toBeVisible();
    await addCustomQuestion(page, customSectionName, customSectionQuestionText);
  });

  test('publishing the customization', async ({ page }) => {
    await page.goto(`/${LOCALE}/template/customizations/${customizationId}`);
    const published = graphqlResponse(page, 'PublishTemplateCustomization');
    await clickWhenHydrated(page.getByRole('button', { name: 'Publish customization' }));
    const body = await (await published).json();
    expect(body.errors).toBeUndefined();
    expect(body.data?.publishTemplateCustomization?.errors?.general ?? null).toBeNull();

    // Once published, the only action is to unpublish it
    await expect(page.getByRole('button', { name: 'Unpublish' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Publish customization' })).toBeHidden();
  });
});

test.describe('a researcher in the admin\'s organization writes a plan with it', () => {
  test.use(asRole('researcher'));

  test('the plan has the funder\'s questions and the published customization', async ({ page }) => {
    await page.goto(`/${LOCALE}/projects/${projectId}/dmp/create`);
    await expect(page.getByRole('heading', { level: 1, name: 'Plan: Select a DMP template' })).toBeVisible();

    const selectTemplate = page.getByRole('button', { name: `Select ${funderTemplateName}`, exact: true });
    await expect(async () => {
      await page.getByRole('searchbox', { name: /Template search/ }).fill(funderTemplateName, { timeout: 2000 });
      await page.getByRole('search').getByRole('button', { name: 'Clear search' }).click({ timeout: 2000 });
      await expect(selectTemplate).toBeVisible({ timeout: 3000 });
    }).toPass();

    // The customization is applied when the plan is created, from the creator's organization
    const added = graphqlResponse(page, 'AddPlan');
    await clickWhenHydrated(selectTemplate);
    const body = await (await added).json();
    expect(body.data?.addPlan?.errors?.general ?? null).toBeNull();
    const planId: number = body.data?.addPlan?.id;
    expect(planId, 'the AddPlan mutation returns the new plan id').toBeTruthy();

    await page.waitForURL(new RegExp(`/projects/${projectId}/dmp/${planId}$`));
    await expect(page.getByText(`This plan is based on the "${funderTemplateName}" template`)).toBeVisible();

    // The funder's section and three questions, plus the two custom questions and the custom section
    await expect(page.getByRole('heading', { level: 2, name: PLAN_SECTION.name })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: customSectionName })).toBeVisible();
    for (const text of [...Object.values(PLAN_QUESTIONS).map((q) => q.questionText), customQuestionText, customSectionQuestionText]) {
      await expect(page.getByRole('article', { name: text })).toBeVisible();
    }
    await expect(page.getByText('0 of 5 questions answered')).toBeVisible();
  });
});
