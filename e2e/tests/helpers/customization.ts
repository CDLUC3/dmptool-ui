import { expect, type APIRequestContext } from '@playwright/test';
import { graphql } from './template';

// The URI of the logged-in user's organization. Used to name the funder organization as a project's funder
export async function myAffiliationUri(request: APIRequestContext): Promise<string> {
  const body = await graphql(request, 'query Me { me { affiliation { uri } } }');
  expect(body.errors, 'looking up the user\'s organization').toBeUndefined();
  const uri: string | undefined = body.data?.me?.affiliation?.uri;
  expect(uri, 'the user belongs to an organization').toBeTruthy();
  return uri!;
}

// Creates a project through Apollo with `funderUri` as its planned funder, so the "Select a DMP template" page
// lists that funder's templates. `request` must be logged in as the researcher. Returns the project's id;
// remove it with archiveProject from ./plan
export async function createProjectWithFunder(request: APIRequestContext, title: string, funderUri: string): Promise<number> {
  const project = await graphql(
    request,
    'mutation AddProject($title: String!) { addProject(title: $title) { id errors { general title } } }',
    { title }
  );
  expect(project.errors, 'adding the project').toBeUndefined();
  expect(project.data?.addProject?.errors?.general ?? null, 'adding the project').toBeNull();
  expect(project.data?.addProject?.errors?.title ?? null, 'adding the project').toBeNull();
  const projectId: number = project.data.addProject.id;

  const funding = await graphql(
    request,
    'mutation AddProjectFunding($input: AddProjectFundingInput!) { addProjectFunding(input: $input) { id errors { general affiliationId } } }',
    { input: { projectId, affiliationId: funderUri, status: 'PLANNED' } }
  );
  expect(funding.errors, 'adding the project\'s funder').toBeUndefined();
  expect(funding.data?.addProjectFunding?.errors?.general ?? null, 'adding the project\'s funder').toBeNull();

  return projectId;
}

// Deletes a template customization through Apollo. `request` must be logged in as an admin of the organization
// that made it. Remove the plans that use it (by archiving their projects) first
export async function removeCustomization(request: APIRequestContext, templateCustomizationId: number) {
  const body = await graphql(
    request,
    'mutation RemoveTemplateCustomization($id: Int!) { removeTemplateCustomization(templateCustomizationId: $id) { id errors { general } } }',
    { id: templateCustomizationId }
  );
  expect(body.errors, `removing test customization ${templateCustomizationId}`).toBeUndefined();
  expect(body.data?.removeTemplateCustomization?.errors?.general ?? null).toBeNull();
}
