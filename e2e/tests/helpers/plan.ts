import { expect, type APIRequestContext } from '@playwright/test';
import { graphql } from './template';

// The questions in the template the plan tests write their plans with
export const PLAN_QUESTIONS = {
  textArea: {
    questionText: 'E2E plan text area question',
    sampleText: 'E2E sample answer for the text area question',
    json: {
      type: 'textArea',
      attributes: { maxLength: 1000, minLength: 0, cols: 40, rows: 20, asRichText: true },
      meta: { schemaVersion: '1.0' },
      showCommentField: false,
    },
  },
  radioButtons: {
    questionText: 'E2E plan radio buttons question',
    choices: ['E2E choice A', 'E2E choice B'],
    json: {
      type: 'radioButtons',
      attributes: {},
      meta: { schemaVersion: '1.0' },
      options: [
        { label: 'E2E choice A', value: 'E2E choice A', selected: false },
        { label: 'E2E choice B', value: 'E2E choice B', selected: false },
      ],
      showCommentField: false,
    },
  },
  text: {
    questionText: 'E2E plan text field question',
    json: {
      type: 'text',
      attributes: { maxLength: 1000, minLength: 0, pattern: '^.+$' },
      meta: { schemaVersion: '1.0' },
      showCommentField: false,
    },
  },
} as const;

export const PLAN_SECTION = {
  name: 'E2E plan section',
  introduction: '<p>E2E plan section introduction</p>',
  requirements: '<p>E2E plan section requirements</p>',
};

// Fails with Apollo's error messages if the request failed or the mutation returned validation errors
function expectNoErrors(body: { errors?: unknown; data?: Record<string, { errors?: Record<string, unknown> } | null> }, what: string) {
  expect(body.errors, what).toBeUndefined();
  const result = Object.values(body.data ?? {})[0];
  const errors = Object.entries(result?.errors ?? {}).filter(([key, value]) => key !== '__typename' && value);
  expect(errors, what).toEqual([]);
}

// Creates a template with one section and the PLAN_QUESTIONS through Apollo, and publishes it so researchers
// in the admin's organization can write plans with it. `request` must be logged in as an admin.
// Returns the template's id; remove it with archiveTemplate once its plans are gone.
export async function createPublishedTemplate(request: APIRequestContext, name: string): Promise<number> {
  const template = await graphql(
    request,
    'mutation AddTemplate($name: String!) { addTemplate(name: $name) { id errors { general name } } }',
    { name }
  );
  expectNoErrors(template, 'adding the plan template');
  const templateId: number = template.data.addTemplate.id;

  const section = await graphql(
    request,
    'mutation AddSection($input: AddSectionInput!) { addSection(input: $input) { id errors { general name } } }',
    { input: { templateId, displayOrder: 1, ...PLAN_SECTION } }
  );
  expectNoErrors(section, 'adding the plan template section');
  const sectionId: number = section.data.addSection.id;

  const questions = Object.values(PLAN_QUESTIONS);
  for (const [index, question] of questions.entries()) {
    const added = await graphql(
      request,
      'mutation AddQuestion($input: AddQuestionInput!) { addQuestion(input: $input) { id errors { general questionText } } }',
      {
        input: {
          templateId,
          sectionId,
          displayOrder: index + 1,
          isDirty: true,
          questionText: question.questionText,
          json: JSON.stringify(question.json),
          sampleText: 'sampleText' in question ? `<p>${question.sampleText}</p>` : undefined,
          useSampleTextAsDefault: false,
          required: false,
        },
      }
    );
    expectNoErrors(added, `adding the "${question.questionText}" question`);
  }

  const published = await graphql(
    request,
    `mutation CreateTemplateVersion($templateId: Int!, $comment: String, $versionType: TemplateVersionType, $latestPublishVisibility: TemplateVisibility!) {
      createTemplateVersion(templateId: $templateId, comment: $comment, versionType: $versionType, latestPublishVisibility: $latestPublishVisibility) { id errors { general } }
    }`,
    { templateId, comment: 'E2E plan template', versionType: 'PUBLISHED', latestPublishVisibility: 'ORGANIZATION' }
  );
  expectNoErrors(published, 'publishing the plan template');

  return templateId;
}

// Archives a project through Apollo, which also deletes its plans. `request` must be logged in as the project's owner
export async function archiveProject(request: APIRequestContext, projectId: number) {
  const body = await graphql(
    request,
    'mutation ArchiveProject($projectId: Int!) { archiveProject(projectId: $projectId) { id errors { general } } }',
    { projectId }
  );
  expect(body.errors, `archiving test project ${projectId}`).toBeUndefined();
}
