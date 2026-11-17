import { test, expect, type Locator, type Page } from '@playwright/test';
import { LOCALE } from './helpers/login';
import { asRole, freshSession } from './helpers/roles';
import { PLAN_QUESTIONS, PLAN_SECTION, archiveProject, createPublishedTemplate } from './helpers/plan';
import { clickAndWaitFor, clickWhenHydrated, fillWhenHydrated } from './helpers/navigation';
import { archiveTemplate, checkAria, graphql, graphqlResponse } from './helpers/template';

// A researcher creates projects and plans; the admin only builds the template the plans use
test.use(asRole('researcher'));

// Each test goes through several pages, and in dev mode a page can take a while to build the first time
test.describe.configure({ timeout: 90_000 });

// What each project test enters on the Project Details step
const DETAILS = {
  abstract: 'E2E project abstract',
  startDate: { typed: '01152027', shown: '01-15-2027', saved: '2027-01-15' },
  endDate: { typed: '12312028', shown: '12-31-2028', saved: '2028-12-31' },
  // Subdomains aren't tested: the local seed data doesn't link any subdomains to their domains
  researchDomain: 'Social Sciences',
};

// Every project and template created here, so afterAll can remove them, projects first (a template with plans
// can't be deleted). Each worker removes the ones it created
const createdProjectIds: number[] = [];
const createdTemplateIds: number[] = [];

test.afterAll(async ({ playwright }) => {
  const failures: unknown[] = [];
  const researcher = await playwright.request.newContext({ storageState: await freshSession('researcher') });
  for (const id of createdProjectIds) {
    await archiveProject(researcher, id).catch((err) => failures.push(err));
  }
  await researcher.dispose();
  const admin = await playwright.request.newContext({ storageState: await freshSession('admin') });
  for (const id of createdTemplateIds) {
    await archiveTemplate(admin, id).catch((err) => failures.push(err));
  }
  await admin.dispose();
  createdProjectIds.length = 0;
  createdTemplateIds.length = 0;
  expect(failures, 'archiving the test projects and templates').toEqual([]);
});

// A title no other test or browser uses. Apollo rejects a second project with the same title for the same user,
// and every run logs in as the same test researcher. Tests run one at a time by default, but --workers or two
// runs against the same environment can create projects in the same millisecond, so add a random part as well
// as the time
const uniqueTitle = (label: string) =>
  `E2E ${label} ${test.info().project.name} ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const nextButton = (page: Page) => page.getByRole('button', { name: 'Next', exact: true });

// Step 1, "Create project details", from the dashboard's Create project button. Returns the new project's id
async function createProject(page: Page, title: string, kind: 'Real project' | 'Mock project'): Promise<number> {
  await page.goto(`/${LOCALE}/projects`);
  await expect(page.getByRole('heading', { level: 1, name: 'Projects and Plans Dashboard' })).toBeVisible();
  await clickAndWaitFor(page, page.getByRole('link', { name: 'Create project', exact: true }), /\/projects\/create\/project/);
  await expect(page.getByRole('heading', { level: 1, name: 'Create project details' })).toBeVisible();
  await expect(async () => {
    await page.getByLabel('What is the title of the research project for this DMP?').fill(title, { timeout: 2000 });
    await checkAria(page.getByRole('radio', { name: kind }));
  }).toPass();

  const added = graphqlResponse(page, 'AddProject');
  await clickWhenHydrated(nextButton(page));
  const body = await (await added).json();
  const projectId: number = body.data?.addProject?.id;
  expect(projectId, 'the AddProject mutation returns the new project id').toBeTruthy();
  expect(body.data.addProject.errors?.general ?? null).toBeNull();
  createdProjectIds.push(projectId);

  await page.waitForURL(new RegExp(`/projects/${projectId}/create/funder`));
  await expect(page.getByRole('heading', { level: 1, name: 'Add funder' })).toBeVisible();
  return projectId;
}

// On the Add funder step, searches for a funder and waits for the results
async function searchFunders(page: Page, term: string) {
  await expect(async () => {
    await page.getByRole('searchbox', { name: /Search funders/ }).fill(term, { timeout: 2000 });
    await page.getByRole('button', { name: 'Search', exact: true }).click({ timeout: 2000 });
    await expect(page.getByRole('radiogroup', { name: /funders found/ })).toBeVisible({ timeout: 3000 });
  }).toPass();
}

// After a funder search, returns the named funder's radio, clicking "Load more" until it's listed. Apollo sorts the
// results by name and the page shows 5 at a time, so on an environment with the full ROR data (like AWS dev) a
// search can match many funders and the one we want can be several pages down
async function findFunder(page: Page, name: string): Promise<Locator> {
  const results = page.getByRole('radiogroup', { name: /funders found/ });
  const radios = results.getByRole('radio');
  const funder = results.getByRole('radio', { name, exact: true });
  const loadMore = page.getByRole('button', { name: 'Load more', exact: true });
  while ((await funder.count()) === 0) {
    expect(await loadMore.count(), `"${name}" is in the funder search results`).toBeGreaterThan(0);
    const shown = await radios.count();
    await loadMore.click();
    await expect(radios).not.toHaveCount(shown);
  }
  return funder;
}

// Searches for NIH, selects it, and continues to the Funding status step. The search is NIH's full name, not "NIH",
// because "NIH" is part of many other funders' names and domains
async function chooseNIH(page: Page, projectId: number) {
  await searchFunders(page, 'National Institutes of Health');
  await checkAria(await findFunder(page, 'National Institutes of Health (nih.gov)'));
  await clickWhenHydrated(nextButton(page));
  await page.waitForURL(new RegExp(`/projects/${projectId}/create/fundings/\\d+/status`));
  await expect(page.getByRole('heading', { level: 1, name: 'Funding status' })).toBeVisible();
  await expect(page.getByText('Tell us where you are with National Institutes of Health (nih.gov).')).toBeVisible();
}

// On the Project Details step, fills in the abstract, dates and research domain
async function fillProjectDetails(page: Page, title: string) {
  await expect(page.getByRole('heading', { level: 1, name: 'Project Details' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Project name' })).toHaveValue(title);
  await fillWhenHydrated(page.getByRole('textbox', { name: 'Project abstract' }), DETAILS.abstract);
  // Date fields have a segment for each part; typing the digits fills them in turn
  await clickWhenHydrated(page.getByRole('spinbutton', { name: 'month, Start date' }));
  await page.keyboard.type(DETAILS.startDate.typed);
  await page.getByRole('spinbutton', { name: 'month, End date' }).click();
  await page.keyboard.type(DETAILS.endDate.typed);
  await clickWhenHydrated(page.getByRole('button', { name: /Research domain/ }));
  await page.getByRole('option', { name: DETAILS.researchDomain }).click();
  await expect(page.getByRole('button', { name: /Research domain/ })).toContainText(DETAILS.researchDomain);
}

// Saves the Project Details step and checks the "You've created a project" page
async function finishProject(page: Page, projectId: number, title: string, funder?: string) {
  // The page moves on as soon as the save returns, so the response body can't be read; the tests check what was
  // saved through Apollo instead
  const updated = graphqlResponse(page, 'UpdateProject');
  await clickAndWaitFor(page, nextButton(page), new RegExp(`/projects/${projectId}/create/complete`));
  expect((await updated).ok()).toBe(true);

  await expect(page.getByRole('heading', { level: 1, name: "You've created a project" })).toBeVisible();
  await expect(page.getByRole('main')).toContainText(`Congratulations, your new project ${title} is set up`);
  if (funder) {
    await expect(page.getByRole('main')).toContainText(`linked to ${funder}`);
  }
  await expect(page.getByRole('link', { name: 'Create your first plan' })).toBeVisible();
}

// The project as Apollo has it, to check what the flow saved
async function savedProject(page: Page, projectId: number) {
  const body = await graphql(
    page.request,
    `query Project($projectId: Int!) { project(projectId: $projectId) {
      title abstractText startDate endDate isTestProject researchDomain { description }
      fundings { status grantId funderProjectNumber funderOpportunityNumber affiliation { displayName } }
      members { givenName surName isPrimaryContact }
    } }`,
    { projectId }
  );
  expect(body.errors).toBeUndefined();
  return body.data.project;
}

test.describe('creating a project', () => {
  test('a mock project with no funder', async ({ page }) => {
    const title = uniqueTitle('mock project');
    const projectId = await createProject(page, title, 'Mock project');

    // "I don't have a funder" goes straight to the project details
    await checkAria(page.getByRole('checkbox', { name: "I don't have a funder" }));
    await clickAndWaitFor(page, nextButton(page), new RegExp(`/projects/${projectId}/project`));
    await fillProjectDetails(page, title);
    await finishProject(page, projectId, title);

    const project = await savedProject(page, projectId);
    expect(project.isTestProject).toBe(true);
    expect(project.fundings).toEqual([]);
    // The researcher who created it is its primary contact, which a plan needs
    expect(project.members).toEqual([expect.objectContaining({ isPrimaryContact: true })]);
  });

  test('a real project that already applied to NIH, with the project added manually', async ({ page }) => {
    const title = uniqueTitle('applied project');
    const projectId = await createProject(page, title, 'Real project');
    await chooseNIH(page, projectId);

    // NIH has an award database, so "Already applied" goes to the project search
    await checkAria(page.getByRole('radio', { name: /Already applied/ }));
    await clickAndWaitFor(page, nextButton(page), /\/project-search/);
    await expect(page.getByRole('heading', { level: 1, name: 'Search for projects' })).toBeVisible();

    await clickAndWaitFor(page, page.getByRole('button', { name: 'Add project manually' }), /\/details/);
    await expect(page.getByRole('heading', { level: 1, name: 'Add funding details' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Funder' })).toHaveValue('National Institutes of Health (nih.gov)');
    await fillWhenHydrated(page.getByRole('textbox', { name: 'Grant number or URL' }), 'E2E-GRANT-1');
    await page.getByRole('textbox', { name: 'Project number or ID' }).fill('E2E-PROJECT-1');
    await page.getByRole('textbox', { name: 'Opportunity or Federal Award Number' }).fill('E2E-OPPORTUNITY-1');
    await clickAndWaitFor(page, nextButton(page), new RegExp(`/projects/${projectId}/project`));

    await fillProjectDetails(page, title);
    await finishProject(page, projectId, title, 'National Institutes of Health (nih.gov)');

    const project = await savedProject(page, projectId);
    expect(project.isTestProject).toBe(false);
    // "Already applied" is saved as PLANNED: Apollo has no APPLIED status yet
    expect(project.fundings).toEqual([expect.objectContaining({
      status: 'PLANNED',
      grantId: 'E2E-GRANT-1',
      funderProjectNumber: 'E2E-PROJECT-1',
      funderOpportunityNumber: 'E2E-OPPORTUNITY-1',
      affiliation: expect.objectContaining({ displayName: 'National Institutes of Health (nih.gov)' }),
    })]);
  });

  test('a real project already funded by NIH', async ({ page }) => {
    const title = uniqueTitle('funded project');
    const projectId = await createProject(page, title, 'Real project');
    await chooseNIH(page, projectId);

    await checkAria(page.getByRole('radio', { name: /Already funded/ }));
    await clickAndWaitFor(page, nextButton(page), /\/project-search/);
    await expect(page.getByRole('heading', { level: 1, name: 'Search for projects' })).toBeVisible();
    await clickAndWaitFor(page, page.getByRole('button', { name: 'Add project manually' }), /\/details/);
    await clickAndWaitFor(page, nextButton(page), new RegExp(`/projects/${projectId}/project`));

    await fillProjectDetails(page, title);
    await finishProject(page, projectId, title, 'National Institutes of Health (nih.gov)');

    const project = await savedProject(page, projectId);
    expect(project.fundings).toEqual([expect.objectContaining({ status: 'GRANTED' })]);
  });

  test('a real project with its funder added manually', async ({ page }) => {
    const title = uniqueTitle('manual funder project');
    const projectId = await createProject(page, title, 'Real project');

    // "Add funder manually" appears after a search
    await searchFunders(page, 'NIH');
    await clickAndWaitFor(page, page.getByRole('button', { name: 'Add funder manually' }), new RegExp(`/projects/${projectId}/fundings/add`));
    await expect(page.getByRole('heading', { level: 1, name: 'Add Funding Details' })).toBeVisible();

    // Pick an existing funder from the suggestions. Typing a new name would create a new organization,
    // which the tests can't remove afterwards. Use NIH: other funders like NSF aren't in every environment's data.
    // Type its full name, because the suggestions are a single page sorted by name, and a shorter term matches
    // too many organizations to list NIH when the environment has the full ROR data
    await page.getByRole('textbox', { name: 'Funder name' }).pressSequentially('National Institutes of Health', { delay: 50 });
    await page.getByRole('option', { name: 'National Institutes of Health (nih.gov)' }).click();
    await fillWhenHydrated(page.getByRole('textbox', { name: 'Grant number/url' }), 'E2E-MANUAL-GRANT');
    await clickAndWaitFor(page, page.getByRole('button', { name: 'Save changes' }), new RegExp(`/projects/${projectId}/project`));

    await fillProjectDetails(page, title);
    await finishProject(page, projectId, title, 'National Institutes of Health (nih.gov)');

    const project = await savedProject(page, projectId);
    expect(project.fundings).toEqual([expect.objectContaining({
      grantId: 'E2E-MANUAL-GRANT',
      affiliation: expect.objectContaining({ displayName: 'National Institutes of Health (nih.gov)' }),
    })]);
  });

  test('Back returns to the previous step', async ({ page }) => {
    // From the first step, Back returns to the dashboard
    await page.goto(`/${LOCALE}/projects`);
    await clickAndWaitFor(page, page.getByRole('link', { name: 'Create project', exact: true }), /\/projects\/create\/project/);
    await clickAndWaitFor(page, page.getByRole('button', { name: 'Back' }), new RegExp(`/${LOCALE}/projects$`));

    const projectId = await createProject(page, uniqueTitle('back project'), 'Real project');
    // The funder step has no Back: going back would create the project a second time
    await expect(page.getByRole('button', { name: 'Back' })).toHaveCount(0);
    await chooseNIH(page, projectId);
    const statusUrl = page.url();

    // Each later step's Back returns to the step before it. Going forward again uses the browser's history,
    // because the steps' Next buttons would save the step a second time
    await checkAria(page.getByRole('radio', { name: /Already applied/ }));
    await clickAndWaitFor(page, nextButton(page), /\/project-search/);
    await clickAndWaitFor(page, page.getByRole('button', { name: 'Back' }), /\/status/);
    await expect(page.getByRole('heading', { level: 1, name: 'Funding status' })).toBeVisible();
    expect(page.url()).toBe(statusUrl);

    await page.goForward();
    await expect(page.getByRole('heading', { level: 1, name: 'Search for projects' })).toBeVisible();
    await clickAndWaitFor(page, page.getByRole('button', { name: 'Add project manually' }), /\/details/);
    await clickAndWaitFor(page, page.getByRole('button', { name: 'Back' }), /\/project-search/);
    await expect(page.getByRole('heading', { level: 1, name: 'Search for projects' })).toBeVisible();

    await page.goForward();
    await expect(page.getByRole('heading', { level: 1, name: 'Add funding details' })).toBeVisible();
    await clickAndWaitFor(page, nextButton(page), new RegExp(`/projects/${projectId}/project`));
    await clickAndWaitFor(page, page.getByRole('button', { name: 'Back' }), /\/details/);
    await expect(page.getByRole('heading', { level: 1, name: 'Add funding details' })).toBeVisible();
  });
});

test.describe('a researcher writes a plan', () => {
  // These build on each other: one project, one plan
  test.describe.configure({ mode: 'serial' });

  let templateName: string;
  let projectTitle: string;
  let projectId: number;
  let planId: number;

  test.beforeAll(async ({ playwright }, testInfo) => {
    // The admin builds and publishes the template the plan is written with, in the researcher's organization
    templateName = `E2E plan template ${testInfo.project.name} ${Date.now()}`;
    const admin = await playwright.request.newContext({ storageState: await freshSession('admin') });
    createdTemplateIds.push(await createPublishedTemplate(admin, templateName));
    await admin.dispose();
  });

  test('a real project with a planned NIH application is created and shown on its overview', async ({ page }) => {
    projectTitle = uniqueTitle('plan project');
    projectId = await createProject(page, projectTitle, 'Real project');
    await chooseNIH(page, projectId);

    // "Planning to apply" is the default, and goes straight to the project details
    await expect(page.getByRole('radio', { name: /Planning to apply/ })).toBeChecked();
    await clickAndWaitFor(page, nextButton(page), new RegExp(`/projects/${projectId}/project`));
    await fillProjectDetails(page, projectTitle);
    await finishProject(page, projectId, projectTitle, 'National Institutes of Health (nih.gov)');

    await clickAndWaitFor(page, page.getByRole('link', { name: 'Project overview' }), new RegExp(`/projects/${projectId}$`));
    await expect(page.getByRole('heading', { level: 1, name: 'Project overview' })).toBeVisible();
    const projectRegion = page.getByRole('region', { name: 'Project', exact: true });
    await expect(projectRegion).toContainText(projectTitle);
    await expect(projectRegion).toContainText(`${DETAILS.startDate.shown} to ${DETAILS.endDate.shown}`);
    const funding = page.getByRole('region', { name: 'Funding sources' });
    await expect(funding).toContainText('1 funding source');
    await expect(funding).toContainText('National Institutes of Health (nih.gov)');

    // The overview doesn't show the abstract or research domain, so check them on the project details page.
    // The research domain is checked through Apollo: the page doesn't show a saved domain that has no subdomain
    // (components/ResearchDomainCascadingDropdown only restores the selection when there's a parent domain)
    await clickAndWaitFor(page, page.getByRole('link', { name: 'Edit project details' }), new RegExp(`/projects/${projectId}/project`));
    await expect(page.getByRole('textbox', { name: 'Project abstract' })).toHaveValue(DETAILS.abstract);
    const project = await savedProject(page, projectId);
    expect(project).toEqual(expect.objectContaining({
      startDate: DETAILS.startDate.saved,
      endDate: DETAILS.endDate.saved,
      researchDomain: { description: DETAILS.researchDomain },
    }));
  });

  test('Create new plan uses the template the researcher selects', async ({ page }) => {
    await page.goto(`/${LOCALE}/projects/${projectId}`);
    await clickAndWaitFor(page, page.getByRole('link', { name: 'Create a new plan' }), new RegExp(`/projects/${projectId}/dmp/create`));
    await expect(page.getByRole('heading', { level: 1, name: 'Plan: Select a DMP template' })).toBeVisible();

    // The list is filtered to the project's funder and the researcher's organization
    const filters = page.getByRole('group', { name: 'Filter by funder or organization' });
    await expect(filters.getByRole('checkbox', { name: 'National Institutes of Health (nih.gov)' })).toBeChecked();

    const selectTemplate = page.getByRole('button', { name: `Select ${templateName}`, exact: true });
    await expect(async () => {
      await page.getByRole('searchbox', { name: /Template search/ }).fill(templateName, { timeout: 2000 });
      await page.getByRole('search').getByRole('button', { name: 'Clear search' }).click({ timeout: 2000 });
      await expect(selectTemplate).toBeVisible({ timeout: 3000 });
    }).toPass();

    const added = graphqlResponse(page, 'AddPlan');
    await clickWhenHydrated(selectTemplate);
    const body = await (await added).json();
    expect(body.data?.addPlan?.errors?.general ?? null).toBeNull();
    planId = body.data?.addPlan?.id;
    expect(planId, 'the AddPlan mutation returns the new plan id').toBeTruthy();

    await page.waitForURL(new RegExp(`/projects/${projectId}/dmp/${planId}$`));
    // A new plan takes the project's title, funder and primary contact
    await expect(page.getByRole('heading', { level: 1, name: projectTitle })).toBeVisible();
    await expect(page.getByText(`This plan is based on the "${templateName}" template`)).toBeVisible();
    await expect(page.getByRole('region', { name: 'Funding for this plan' })).toContainText('National Institutes of Health (nih.gov)');
    await expect(page.getByRole('region', { name: 'Plan members for this plan' })).toContainText('Playwright Researcher');
    await expect(page.getByText('0 of 3 questions answered')).toBeVisible();
    await expect(page.getByRole('heading', { name: PLAN_SECTION.name, level: 2 })).toBeVisible();
  });

  test('questions can be answered, including with the sample answer', async ({ page }) => {
    await page.goto(`/${LOCALE}/projects/${projectId}/dmp/${planId}`);

    // The text area question offers the template's sample text as an answer
    const textArea = page.getByRole('article', { name: PLAN_QUESTIONS.textArea.questionText });
    await clickAndWaitForVisible(textArea.getByRole('button', { name: 'View sample answer' }), textArea.getByRole('button', { name: 'Use answer' }));
    await expect(textArea.getByText(PLAN_QUESTIONS.textArea.sampleText)).toBeVisible();
    const usedSample = graphqlResponse(page, 'AddAnswer');
    await clickWhenHydrated(textArea.getByRole('button', { name: 'Use answer' }));
    await usedSample;
    await expect(textArea.frameLocator('iframe').locator('body')).toHaveText(PLAN_QUESTIONS.textArea.sampleText);

    const radios = page.getByRole('article', { name: PLAN_QUESTIONS.radioButtons.questionText });
    await checkAria(radios.getByRole('radio', { name: PLAN_QUESTIONS.radioButtons.choices[1] }));
    const savedRadio = graphqlResponse(page, 'AddAnswer');
    await radios.getByRole('button', { name: 'Save' }).click();
    await savedRadio;

    const text = page.getByRole('article', { name: PLAN_QUESTIONS.text.questionText });
    await text.getByRole('textbox', { name: PLAN_QUESTIONS.text.questionText }).fill('E2E text field answer');
    const savedText = graphqlResponse(page, 'AddAnswer');
    await text.getByRole('button', { name: 'Save' }).click();
    await savedText;

    await expect(page.getByText('3 of 3 questions answered · 100%')).toBeVisible();
    for (const article of [textArea, radios, text]) {
      await expect(article.getByRole('img', { name: 'Answered' })).toBeVisible();
    }

    // The answers are still there after reloading
    await page.reload();
    await expect(page.getByText('3 of 3 questions answered · 100%')).toBeVisible();
    await expect(textArea.frameLocator('iframe').locator('body')).toHaveText(PLAN_QUESTIONS.textArea.sampleText);
    await expect(radios.getByRole('radio', { name: PLAN_QUESTIONS.radioButtons.choices[1] })).toBeChecked();
    await expect(text.getByRole('textbox', { name: PLAN_QUESTIONS.text.questionText })).toHaveValue('E2E text field answer');
  });

  test('the project page shows the plan, and Update plan opens it to change an answer', async ({ page }) => {
    await page.goto(`/${LOCALE}/projects/${projectId}/dmp/${planId}`);
    // Back to the project from the plan's breadcrumbs (named "Breadcrumb navigation" on this page)
    await clickAndWaitFor(page, page.getByRole('list', { name: /^Breadcrumb/ }).getByRole('link', { name: 'Project overview' }), new RegExp(`/projects/${projectId}$`));

    const plans = page.getByRole('region', { name: 'Plans' });
    await expect(plans.getByRole('heading', { level: 3, name: projectTitle })).toBeVisible();
    await expect(plans).toContainText('Funding: National Institutes of Health');
    const sectionItem = plans.getByRole('list', { name: 'Sections' }).getByRole('listitem').filter({ hasText: PLAN_SECTION.name });
    await expect(sectionItem).toContainText('3 of 3');
    // Every plan gets its DOI when it's created; it's only registered when the plan is published
    const { dmpId } = (await graphql(page.request, 'query Plan($planId: Int!) { plan(planId: $planId) { dmpId } }', { planId })).data.plan;
    await expect(plans.getByRole('link', { name: dmpId })).toBeVisible();
    await expect(plans.getByRole('link', { name: `Download ${projectTitle}` })).toBeVisible();

    await clickAndWaitFor(page, plans.getByRole('link', { name: `Update plan ${projectTitle}` }), new RegExp(`/projects/${projectId}/dmp/${planId}$`));
    const text = page.getByRole('article', { name: PLAN_QUESTIONS.text.questionText });
    const textbox = text.getByRole('textbox', { name: PLAN_QUESTIONS.text.questionText });
    await expect(textbox).toHaveValue('E2E text field answer');
    await textbox.fill('E2E updated text field answer');
    const updated = graphqlResponse(page, 'UpdateAnswer');
    await text.getByRole('button', { name: 'Save' }).click();
    const body = await (await updated).json();
    expect(body.errors).toBeUndefined();

    await page.reload();
    await expect(text.getByRole('textbox', { name: PLAN_QUESTIONS.text.questionText })).toHaveValue('E2E updated text field answer');
  });
});

// Clicks a button that shows something on the same page, once React has hydrated it
async function clickAndWaitForVisible(button: Locator, shown: Locator) {
  await clickWhenHydrated(button);
  await expect(shown).toBeVisible();
}
