import { test, expect, type Page } from '@playwright/test';
import { LOCALE } from './helpers/login';
import { asRole, authFile } from './helpers/roles';
import {
  archiveTemplate,
  checkAria,
  editorBody,
  graphql,
  graphqlResponse,
  nameNewTemplate,
  openDialog,
  search,
  sidebarRow,
  typeInEditor,
} from './helpers/template';

// Templates are an admin page; start already logged in as the admin saved by auth.setup.ts
test.use(asRole('admin'));

// The tests build one template step by step (sections, questions, publishing), so they run in order and
// share its state. If one fails, the rest are skipped, and a retry starts again from the first test.
test.describe.configure({ mode: 'serial', timeout: 120_000 });

// Every question type on /template/[templateId]/q/new, by the data-type on its Select button
const QUESTION_TYPES = [
  { type: 'textArea', title: 'Text Area' },
  { type: 'text', title: 'Text Field' },
  { type: 'radioButtons', title: 'Radio Buttons' },
  { type: 'checkBoxes', title: 'Check Boxes' },
  { type: 'selectBox', title: 'Select Box' },
  { type: 'multiselectBox', title: 'Multi-select Box' },
  { type: 'number', title: 'Number Field' },
  { type: 'numberRange', title: 'Number Range' },
  { type: 'currency', title: 'Currency Field' },
  { type: 'email', title: 'Email Field' },
  { type: 'url', title: 'URL Field' },
  { type: 'date', title: 'Date Field' },
  { type: 'dateRange', title: 'Date Range' },
  { type: 'affiliationSearch', title: 'Affiliation Search' },
  { type: 'researchOutputTable', title: 'Research Output Table' },
] as const;
type QuestionType = (typeof QUESTION_TYPES)[number]['type'];

const CHOICE_TYPES: QuestionType[] = ['radioButtons', 'checkBoxes', 'selectBox', 'multiselectBox'];
const RANGE_TYPES: QuestionType[] = ['numberRange', 'dateRange'];
// Types with an "Additional comment box" option
const COMMENT_BOX_TYPES: QuestionType[] = [...CHOICE_TYPES, 'number', 'numberRange', 'currency', 'email', 'url', 'date', 'dateRange', 'affiliationSearch'];

const questionText = (title: string) => `E2E ${title} question`;
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Shared by the tests in this file (one copy per browser project)
let templateName: string;
let templateId: number;
let sectionName: string;
let sectionId: number;
const section = {
  introduction: 'E2E section introduction',
  requirements: 'E2E section requirements',
  guidance: 'E2E section guidance',
};
// Every template created here, so afterAll can remove them all
const createdTemplateIds: number[] = [];

const templateUrl = () => new RegExp(`/${LOCALE}/template/${templateId}$`);

test.beforeAll(async ({}, testInfo) => {
  const run = `${testInfo.project.name} ${Date.now()}`;
  templateName = `E2E template ${run}`;
  sectionName = `E2E section ${run}`;
});

// Remove the test templates even when a test failed. afterAll has no page, so log in from the saved admin session.
// Newest first: Apollo can't archive a template while a copy made from it still exists. Every template is tried
// before any failure is reported
test.afterAll(async ({ playwright }) => {
  const request = await playwright.request.newContext({ storageState: authFile('admin') });
  const failures: unknown[] = [];
  for (const id of [...createdTemplateIds].reverse()) {
    await archiveTemplate(request, id).catch((err) => failures.push(err));
  }
  createdTemplateIds.length = 0;
  await request.dispose();
  expect(failures, 'archiving the test templates').toEqual([]);
});

// Leaving a form with unsaved changes opens a "Leave site?" dialog; accept it so the navigation goes ahead
test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept());
});

// Opens step 1 of adding a question to the test section, and waits for the question types to show
async function openQuestionTypes(page: Page) {
  await page.goto(`/${LOCALE}/template/${templateId}/q/new?section_id=${sectionId}`);
  await expect(page.getByRole('heading', { level: 1, name: 'What type of question would you like to add?' })).toBeVisible();
  await expect(page.locator('button[data-type]')).toHaveCount(QUESTION_TYPES.length);
}

// Selects a question type on step 1. Retries until React has hydrated and the form for that type opens.
// Skips the click once the form has opened, in case an earlier try's click just took a while
async function selectQuestionType(page: Page, type: QuestionType, opened: RegExp) {
  await expect(async () => {
    if (!opened.test(page.url())) {
      await page.locator(`button[data-type="${type}"]`).click({ timeout: 2000 });
    }
    await expect(page).toHaveURL(opened, { timeout: 2000 });
  }).toPass();
}

// The edit link for a question on the template page, which is named after the question
function editQuestionLink(page: Page, text: string) {
  return page.getByRole('main').getByRole('link', { name: `Edit question: ${text}`, exact: true });
}

test('step 2 of creating a template has a search, and Start builds a new template from scratch', async ({ page }) => {
  await nameNewTemplate(page, templateName);

  await expect(page.getByRole('heading', { level: 1, name: 'Start with a copy of an existing template' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'My organization templates' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Public templates' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Build a new template' })).toBeVisible();
  await expect(page.getByText('Search by research organization, field station or lab, template description, etc.')).toBeVisible();

  // A search with no matches empties both lists. Finding and copying a public template is tested after publishing
  await search(page, `no-match-${Date.now()}`, async () => {
    await expect(page.getByText('No items found')).toHaveCount(2, { timeout: 2000 });
  });

  const added = graphqlResponse(page, 'AddTemplate');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  const body = await (await added).json();
  templateId = body.data?.addTemplate?.id;
  expect(templateId, 'the AddTemplate mutation returns the new template id').toBeTruthy();
  createdTemplateIds.push(templateId);

  await page.waitForURL(templateUrl());
  await expect(page.getByRole('heading', { level: 1, name: templateName })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Add section' })).toBeVisible();
  // A new template is a draft with no sections yet
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(0);
  await expect(sidebarRow(page, 'Visibility settings')).toContainText('Draft');
});

test('a section built from scratch is saved with all its fields and shows on the template', async ({ page }) => {
  await page.goto(`/${LOCALE}/template/${templateId}`);
  await page.getByRole('link', { name: 'Add section' }).click();

  await page.waitForURL(new RegExp(`/template/${templateId}/section/new$`));
  await expect(page.getByRole('heading', { level: 1, name: 'Add new section' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Use one of your previously created sections' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Use a best practice section created by DMP Tool' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Build a new section' })).toBeVisible();
  await page.getByRole('link', { name: 'Create new section' }).click();

  await page.waitForURL(new RegExp(`/template/${templateId}/section/create$`));
  await expect(page.getByRole('heading', { level: 1, name: 'Create section' })).toBeVisible();
  for (const tab of ['Edit section', 'Options', 'Logic']) {
    await expect(page.getByRole('tab', { name: tab })).toBeVisible();
  }
  // Labels and help text for each field
  for (const text of [
    'Section introduction',
    'Enter a short, concise introduction to the section.',
    'Section requirements',
    'Outline the requirements that a user must consider in this section.',
    'Section guidance',
    'Provide users with helpful guidance to help them answer the questions in the section.',
  ]) {
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  }

  await page.getByLabel('Section name').fill(sectionName);
  await typeInEditor(page, 'sectionIntroduction', section.introduction);
  await typeInEditor(page, 'sectionRequirements', section.requirements);
  await typeInEditor(page, 'sectionGuidance', section.guidance);

  const added = graphqlResponse(page, 'AddSection');
  await page.getByRole('button', { name: 'Create section' }).click();
  const body = await (await added).json();
  sectionId = body.data?.addSection?.id;
  expect(sectionId, 'the AddSection mutation returns the new section id').toBeTruthy();

  await page.waitForURL(templateUrl());
  const sectionItem = page.getByRole('main').getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name: `Section 1 ${sectionName}` }) });
  await expect(sectionItem).toBeVisible();
  await expect(page.getByRole('link', { name: 'Add question' })).toBeVisible();

  // Every field was saved
  await sectionItem.getByRole('link', { name: 'Edit section' }).click();
  await page.waitForURL(new RegExp(`/template/${templateId}/section/${sectionId}$`));
  await expect(page.getByRole('heading', { level: 1, name: 'Update section' })).toBeVisible();
  await expect(page.getByLabel('Section name')).toHaveValue(sectionName);
  await expect(editorBody(page, 'sectionIntroduction')).toHaveText(section.introduction);
  await expect(editorBody(page, 'sectionRequirements')).toHaveText(section.requirements);
  await expect(editorBody(page, 'sectionGuidance')).toHaveText(section.guidance);
});

test('the question type search filters the types, and clearing it shows them all again', async ({ page }) => {
  await page.goto(`/${LOCALE}/template/${templateId}`);
  await page.getByRole('link', { name: 'Add question' }).click();
  await page.waitForURL(new RegExp(`/template/${templateId}/q/new\\?section_id=${sectionId}`));
  await expect(page.locator('button[data-type]')).toHaveCount(QUESTION_TYPES.length);
  for (const { title } of QUESTION_TYPES) {
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  }

  // Matches the type names and descriptions
  await search(page, 'date', async () => {
    await expect(page.locator('button[data-type]')).toHaveCount(2, { timeout: 2000 });
  });
  await expect(page.getByRole('heading', { name: 'Date Field', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Date Range', exact: true })).toBeVisible();
  await expect(page.getByText('2 results match your search').first()).toBeVisible();

  // A search with no matches replaces the previous results
  await search(page, `no-match-${Date.now()}`, async () => {
    await expect(page.getByText('No items found')).toBeVisible({ timeout: 2000 });
  });
  await expect(page.locator('button[data-type]')).toHaveCount(0);

  await page.getByRole('searchbox').fill('');
  await expect(page.locator('button[data-type]')).toHaveCount(QUESTION_TYPES.length);
  await search(page, 'date', async () => {
    await expect(page.locator('button[data-type]')).toHaveCount(2, { timeout: 2000 });
  });
  await page.getByRole('button', { name: 'clear filter' }).first().click();
  await expect(page.locator('button[data-type]')).toHaveCount(QUESTION_TYPES.length);
});

for (const { type, title } of QUESTION_TYPES) {
  test(`a ${title} question is saved with all its fields and shows on the template`, async ({ page }) => {
    await openQuestionTypes(page);
    await selectQuestionType(page, type, /step=2/);

    // Fields every question type has
    await expect(page.getByRole('heading', { level: 1, name: 'Add new question' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Type' })).toHaveValue(title);
    await expect(page.getByRole('button', { name: 'Change type' })).toBeVisible();
    for (const text of [
      'Changing the question type, for example from Text Field to Radio Buttons, may result in some data being lost.',
      'Keep the question text concise and clear. Use the requirements or guidance to provide additional explanation.',
      'Question requirements (optional but recommended)',
      'Use this for specific instructions on what researchers are required to include in their answer, such as what properties of their data they should be listing.',
      'Question guidance (optional but recommended)',
      'Let researchers know how to best provide answers to the requirements, such as policies to consider from your organization or what factors to consider.',
      'Select one or more tags to associate global best practice guidance written by DMP Tool.',
    ]) {
      await expect(page.getByText(text).first()).toBeVisible();
    }
    await expect(page.getByRole('group', { name: 'Question Best Practices to include' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Preview question' })).toBeVisible();

    await page.getByLabel('Question text').fill(questionText(title));
    await typeInEditor(page, 'question_requirements', `E2E ${title} requirements`);
    await typeInEditor(page, 'question_guidance', `E2E ${title} guidance`);

    // Only text areas have sample text, which can also be the default answer
    const defaultAnswer = page.getByRole('checkbox', { name: 'Use this sample text as the default answer in the DMP' });
    if (type === 'textArea') {
      await expect(page.getByText('Plan creators will be able to copy the sample text into the field as a starting point, to speed up content entry.')).toBeVisible();
      await typeInEditor(page, 'sample_text', `E2E ${title} sample text`);
      await checkAria(defaultAnswer);
    } else {
      await expect(defaultAnswer).toHaveCount(0);
    }

    if (CHOICE_TYPES.includes(type)) {
      await expect(page.getByText('Answer choices', { exact: true })).toBeVisible();
      await page.getByRole('textbox', { name: 'Choice 1' }).fill('E2E choice 1');
      await page.getByRole('button', { name: 'Add choice' }).click();
      await page.getByRole('textbox', { name: 'Choice 2' }).fill('E2E choice 2');
      // Its name changes from "Set choice 1 as default" to "Clear choice 1 as default" once checked
      await checkAria(page.getByRole('group', { name: 'Choice 1' }).getByRole('checkbox'));
      await expect(page.getByText('Choice 1 set as default.')).toBeVisible();
    }

    if (RANGE_TYPES.includes(type)) {
      await expect(page.getByRole('textbox', { name: 'Starting Label' })).toHaveValue('From');
      await expect(page.getByRole('textbox', { name: 'Ending Label' })).toHaveValue('To');
      await page.getByRole('textbox', { name: 'Starting Label' }).fill('E2E start');
      await page.getByRole('textbox', { name: 'Ending Label' }).fill('E2E end');
    }

    if (COMMENT_BOX_TYPES.includes(type)) {
      await checkAria(page.getByRole('radio', { name: 'Show a comment field where plan writers can explain their answer' }));
    }

    if (type === 'affiliationSearch') {
      await page.getByRole('textbox', { name: 'Search label' }).fill('E2E search label');
      await page.getByRole('textbox', { name: 'Help text' }).fill('E2E help text');
    }

    if (type === 'researchOutputTable') {
      await expect(page.getByRole('heading', { name: 'Enable standard fields' })).toBeVisible();
      // Title is always included
      await expect(page.getByRole('checkbox', { name: 'Title', exact: true })).toBeChecked();
      await expect(page.getByRole('checkbox', { name: 'Title', exact: true })).toBeDisabled();
      await checkAria(page.getByRole('checkbox', { name: 'Description', exact: true }));
    }

    // Each tag has an info button next to it, named after the tag
    await expect(page.getByRole('button', { name: 'More information about Storage & security' })).toBeVisible();
    await checkAria(page.getByRole('checkbox', { name: 'Storage & security', exact: true }));
    await checkAria(page.getByRole('checkbox', { name: 'Data Collection', exact: true }));
    await checkAria(page.getByRole('radiogroup', { name: /Mark as required\?/ }).getByRole('radio', { name: 'Yes' }));
    if (COMMENT_BOX_TYPES.includes(type)) {
      // Choosing "required" doesn't change the comment box choice
      await expect(page.getByRole('radio', { name: 'Show a comment field where plan writers can explain their answer' })).toBeChecked();
    }

    const added = graphqlResponse(page, 'AddQuestion');
    await page.getByRole('button', { name: 'Save and add' }).click();
    const response = await added;
    const input = response.request().postDataJSON()?.variables?.input;
    expect(input.required, 'the question is saved as required').toBe(true);
    expect(input.tags.map((tag: { name: string }) => tag.name)).toEqual(
      expect.arrayContaining(['Storage & security', 'Data Collection'])
    );
    if (COMMENT_BOX_TYPES.includes(type)) {
      expect(JSON.parse(input.json).showCommentField, 'the comment box is saved').toBe(true);
    }
    const body = await response.json();
    expect(body.errors).toBeUndefined();
    expect(body.data?.addQuestion?.errors?.general ?? null).toBeNull();

    await page.waitForURL(templateUrl());
    await expect(page.getByRole('main').getByText(questionText(title), { exact: true })).toBeVisible();
  });
}

test('a saved question keeps every value entered when it was added', async ({ page }) => {
  await page.goto(`/${LOCALE}/template/${templateId}`);
  await editQuestionLink(page, questionText('Text Area')).click();

  await page.waitForURL(new RegExp(`/template/${templateId}/q/\\d+$`));
  await expect(page.getByRole('heading', { level: 1, name: 'Edit Question' })).toBeVisible();
  // The edit page names types differently from the add page: "Text area" rather than "Text Area"
  await expect(page.getByRole('textbox', { name: 'Type' })).toHaveValue('Text area');
  await expect(page.getByLabel('Question text')).toHaveValue(questionText('Text Area'));
  await expect(editorBody(page, 'question_requirements')).toHaveText('E2E Text Area requirements');
  await expect(editorBody(page, 'question_guidance')).toHaveText('E2E Text Area guidance');
  await expect(editorBody(page, 'sample_text')).toHaveText('E2E Text Area sample text');
  await expect(page.getByRole('checkbox', { name: 'Use this sample text as the default answer in the DMP' })).toBeChecked();
  await expect(page.getByRole('radiogroup', { name: /Mark as required\?/ }).getByRole('radio', { name: 'Yes' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Storage & security', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Data Collection', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Preservation', exact: true })).not.toBeChecked();
});

test('the type of a new question can be changed before it is saved', async ({ page }) => {
  await openQuestionTypes(page);
  await selectQuestionType(page, 'text', /step=2/);
  await expect(page.getByRole('textbox', { name: 'Type' })).toHaveValue('Text Field');
  await page.getByLabel('Question text').fill('E2E unsaved question');

  await page.getByRole('button', { name: 'Change type' }).click();
  await expect(page).toHaveURL(/step=1/);
  await expect(page.locator('button[data-type]')).toHaveCount(QUESTION_TYPES.length);

  await selectQuestionType(page, 'radioButtons', /step=2/);
  await expect(page.getByRole('textbox', { name: 'Type' })).toHaveValue('Radio Buttons');
  await expect(page.getByRole('textbox', { name: 'Choice 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add choice' })).toBeVisible();
  // Nothing is saved; the next tests count only the questions added above
});

test('the type of a saved question can be changed, and the new type is saved', async ({ page }) => {
  await page.goto(`/${LOCALE}/template/${templateId}`);
  await editQuestionLink(page, questionText('Text Field')).click();
  await page.waitForURL(new RegExp(`/template/${templateId}/q/\\d+$`));
  const questionUrl = page.url();
  const questionId = new URL(questionUrl).pathname.split('/').pop();
  // The edit page names types differently from the add page: "Text" rather than "Text Field"
  await expect(page.getByRole('textbox', { name: 'Type' })).toHaveValue('Text');

  await page.getByRole('button', { name: 'Change type' }).click();
  await expect(page).toHaveURL(new RegExp(`questionId=${questionId}`));
  await selectQuestionType(page, 'checkBoxes', /questionType=checkBoxes/);

  await expect(page.getByRole('textbox', { name: 'Type' })).toHaveValue('Checkbox');
  await expect(page.getByLabel('Question text')).toHaveValue(questionText('Text Field'));
  await page.getByRole('textbox', { name: 'Choice 1' }).fill('E2E changed choice');

  await page.getByRole('button', { name: 'Save and update' }).click();
  await page.waitForURL(templateUrl());

  await page.goto(questionUrl);
  await expect(page.getByRole('textbox', { name: 'Type' })).toHaveValue('Checkbox');
  await expect(page.getByRole('textbox', { name: 'Choice 1' })).toHaveValue('E2E changed choice');
});

test('Save as draft saves a new version and updates the sidebar', async ({ page }) => {
  await page.goto(`/${LOCALE}/template/${templateId}`);
  const saveAsDraft = page.getByRole('button', { name: 'Save as draft' });

  // Retry the click until React has hydrated, but never once the save was sent, so only one version is saved
  let sent = false;
  page.on('request', (req) => {
    if (req.url().includes('/graphql') && req.postDataJSON()?.operationName === 'CreateTemplateVersion') sent = true;
  });
  const saved = graphqlResponse(page, 'CreateTemplateVersion');
  await expect(async () => {
    if (!sent) {
      await saveAsDraft.click({ timeout: 2000 });
    }
    await expect.poll(() => sent, { timeout: 2000 }).toBe(true);
  }).toPass();
  const body = await (await saved).json();
  expect(body.data?.createTemplateVersion?.errors?.general ?? null).toBeNull();

  await expect(page.getByText('Successfully updated.')).toBeVisible();
  await expect(page.getByText(/Version: v1/)).toBeVisible();
  await expect(sidebarRow(page, 'Visibility settings')).toContainText('Unpublished changes');
});

test('Publish template checks the form, then publishes the template as public', async ({ page }) => {
  await page.goto(`/${LOCALE}/template/${templateId}`);
  const dialog = await openDialog(page, page.getByRole('complementary').getByRole('button', { name: 'Publish template' }));

  await expect(dialog.getByRole('heading', { name: 'Publish' })).toBeVisible();
  for (const text of [
    'You can control who can use this published template.',
    'This template can be used by all plan writers.',
    'Only plan writers from your organization will be able to view and use this template.',
    'After publication, all new plans will use this version.',
    'In-progress or existing plans will not be updated.',
    'Enter a short description of what has been changed. This will only be visible to people in your organization.',
  ]) {
    await expect(dialog.getByText(text)).toBeVisible();
  }

  // Visibility and the change log are both required
  await dialog.getByRole('button', { name: 'Save and publish' }).click();
  await expect(dialog.getByText('Please select a visibility option before publishing.')).toBeVisible();
  await expect(dialog.getByText('A change log is required. Please describe what has changed in this version before publishing.')).toBeVisible();

  await checkAria(dialog.getByRole('radio', { name: /^Public/ }));
  await expect(dialog.getByTestId('visText')).toHaveText(/Visibility as Public/);
  await dialog.getByRole('textbox', { name: 'Change log' }).fill('E2E first publish');

  const published = graphqlResponse(page, 'CreateTemplateVersion');
  await dialog.getByRole('button', { name: 'Save and publish' }).click();
  const body = await (await published).json();
  expect(body.data?.createTemplateVersion?.errors?.general ?? null).toBeNull();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(/Version: v2/)).toBeVisible();
  await expect(sidebarRow(page, 'Visibility settings')).toContainText('Published');
});

test('step 2 search finds the published template under Public templates, and selecting it copies it', async ({ page }) => {
  const copyName = `${templateName} copy`;
  await nameNewTemplate(page, copyName);

  const publicTemplates = page.getByRole('list', { name: 'Public templates' });
  await search(page, templateName, async () => {
    await expect(publicTemplates.getByRole('heading', { name: templateName, exact: true })).toBeVisible({ timeout: 2000 });
  });

  const added = graphqlResponse(page, 'AddTemplate');
  await publicTemplates.getByRole('button', { name: `Select ${templateName}`, exact: true }).click();
  const body = await (await added).json();
  const copyId: number = body.data?.addTemplate?.id;
  expect(copyId, 'the AddTemplate mutation returns the copied template id').toBeTruthy();
  createdTemplateIds.push(copyId);
  expect(copyId).not.toBe(templateId);

  // The copy has the new name and the original's section and questions
  await page.waitForURL(new RegExp(`/${LOCALE}/template/${copyId}$`));
  await expect(page.getByRole('heading', { level: 1, name: copyName })).toBeVisible();
  await expect(page.getByRole('heading', { name: `Section 1 ${sectionName}` })).toBeVisible();
  for (const { title } of QUESTION_TYPES) {
    await expect(page.getByRole('main').getByText(questionText(title), { exact: true })).toBeVisible();
  }
});

test('the templates page search finds the organization templates by name', async ({ page }) => {
  await page.goto(`/${LOCALE}/template`);
  await expect(page).toHaveTitle(/Organization templates/);
  const templates = page.getByRole('list', { name: 'List of templates' });
  // Each heading wraps an "Update <name>" link, so match the end of its name
  const heading = (name: string) => templates.getByRole('heading', { name: new RegExp(`${escapeRegExp(name)}$`) });

  // The original and its copy both match the original's name
  await search(page, templateName, async () => {
    await expect(heading(templateName)).toBeVisible({ timeout: 2000 });
  });
  await expect(heading(`${templateName} copy`)).toBeVisible();
  await expect(templates.getByRole('heading', { name: new RegExp(escapeRegExp(templateName)) })).toHaveCount(2);

  await search(page, `no-match-${Date.now()}`, async () => {
    await expect(page.getByText('No items found')).toBeVisible({ timeout: 2000 });
  });
  await expect(heading(templateName)).toBeHidden();
});

test('the visibility can be changed from the Edit link in the sidebar', async ({ page }) => {
  // Apollo refuses to publish with "There are no changes to publish" unless something changed since the last
  // publish, even if only the visibility is new. So make a change first: update the section guidance
  await page.goto(`/${LOCALE}/template/${templateId}/section/${sectionId}`);
  await typeInEditor(page, 'sectionGuidance', ' (updated)');
  const updated = graphqlResponse(page, 'UpdateSection');
  await page.getByRole('button', { name: 'Save and update' }).click();
  expect((await (await updated).json()).data?.updateSection?.errors?.general ?? null).toBeNull();
  await page.waitForURL(templateUrl());

  const dialog = await openDialog(page, sidebarRow(page, 'Visibility settings').getByRole('link', { name: 'Edit' }));

  // It shows what was last published and pre-selects that visibility
  await expect(dialog.getByTestId('lastPublishedVisibility')).toContainText(/Version v2 was published on .+ with Public visibility/);
  await expect(dialog.getByRole('radio', { name: /^Public/ })).toBeChecked();

  await checkAria(dialog.getByRole('radio', { name: /^Organization only/ }));
  await expect(dialog.getByTestId('visText')).toHaveText(/Visibility as Private/);
  await dialog.getByRole('textbox', { name: 'Change log' }).fill('E2E visibility changed to organization only');

  const published = graphqlResponse(page, 'CreateTemplateVersion');
  await dialog.getByRole('button', { name: 'Save and publish' }).click();
  const body = await (await published).json();
  expect(body.data?.createTemplateVersion?.errors?.general ?? null).toBeNull();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(/Version: v3/)).toBeVisible();

  // Reopening the dialog shows the new visibility
  await sidebarRow(page, 'Visibility settings').getByRole('link', { name: 'Edit' }).click();
  await expect(dialog.getByTestId('lastPublishedVisibility')).toContainText(/Version v3 was published on .+ with Organization only visibility/);
  await expect(dialog.getByRole('radio', { name: /^Organization only/ })).toBeChecked();
});

test('the Preview link in the sidebar shows the section and every question', async ({ page }) => {
  await page.goto(`/${LOCALE}/template/${templateId}`);
  await sidebarRow(page, 'Preview template').getByRole('link', { name: 'Preview' }).click();

  await page.waitForURL(new RegExp(`/template/${templateId}/preview$`));
  await expect(page.getByRole('heading', { level: 1, name: `Preview: ${templateName}` })).toBeVisible();
  await expect(page.getByText('This is how your template will look to someone writing a plan.')).toBeVisible();

  const sectionRegion = page.getByRole('region', { name: sectionName });
  await expect(sectionRegion.getByRole('heading', { name: sectionName })).toBeVisible();
  await expect(sectionRegion.getByText(section.introduction)).toBeVisible();
  await expect(sectionRegion.getByText(section.requirements)).toBeVisible();
  await expect(page.getByText(`0 of ${QUESTION_TYPES.length} questions answered`)).toBeVisible();
  for (const { title } of QUESTION_TYPES) {
    await expect(sectionRegion.getByRole('heading', { name: questionText(title), exact: true })).toBeVisible();
  }

  await page.getByRole('link', { name: 'Back to template' }).first().click();
  await page.waitForURL(templateUrl());
});

test('both History links open the template history, which lists every version', async ({ page }) => {
  const me = await graphql(page.request, '{ me { givenName surName } }');
  const userName = `${me.data.me.givenName} ${me.data.me.surName}`;
  const historyUrl = new RegExp(`/template/${templateId}/history$`);

  const expectHistory = async () => {
    await expect(page.getByRole('heading', { level: 1, name: 'Template history' })).toBeVisible();
    const grid = page.getByRole('grid', { name: 'History' });
    for (const column of ['Action', 'User', 'Time and Date']) {
      await expect(grid.getByRole('columnheader', { name: column })).toBeVisible();
    }
    // Newest first: the two publishes, then the draft
    const rows = grid.getByRole('rowgroup').nth(1).getByRole('row');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText('PUBLISHED v3');
    await expect(rows.nth(0)).toContainText(/Change log:\s*E2E visibility changed to organization only/);
    await expect(rows.nth(1)).toContainText('PUBLISHED v2');
    await expect(rows.nth(1)).toContainText(/Change log:\s*E2E first publish/);
    await expect(rows.nth(2)).toContainText('DRAFT v1');
    for (let i = 0; i < 3; i++) {
      await expect(rows.nth(i)).toContainText(userName);
    }
  };

  // "View history" below the page title
  await page.goto(`/${LOCALE}/template/${templateId}`);
  await page.getByRole('link', { name: 'View history' }).click();
  await page.waitForURL(historyUrl);
  await expectHistory();

  // "History" in the sidebar
  await page.goto(`/${LOCALE}/template/${templateId}`);
  await sidebarRow(page, 'History').getByRole('link', { name: 'History' }).click();
  await page.waitForURL(historyUrl);
  await expectHistory();
});
