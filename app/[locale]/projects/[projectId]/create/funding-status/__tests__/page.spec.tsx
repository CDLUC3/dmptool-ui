import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MockedProvider } from '@apollo/client/testing/react';
import { MockedResponse } from '@apollo/client/testing';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import {
  ProjectFundingStatus,
  ProjectFundingsApiDocument,
  RemoveProjectFundingDocument,
  UpdateProjectFundingDocument,
} from '@/generated/graphql';
import ProjectsCreateProjectFunding from '../page';

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

const fundingsMock = (apiTarget: string | null, status = ProjectFundingStatus.Planned) => ({
  request: { query: ProjectFundingsApiDocument, variables: { projectId: 123 } },
  result: {
    data: {
      project: {
        fundings: [{
          id: 18,
          status,
          affiliation: { apiTarget, uri: 'https://funder', id: 99, displayName: 'NSF' },
        }],
      },
    },
  },
});

const updateMock = (status: ProjectFundingStatus) => ({
  request: {
    query: UpdateProjectFundingDocument,
    variables: { input: { projectFundingId: 18, status } },
  },
  result: { data: { updateProjectFunding: { errors: null } } },
});

const errorFields = {
  affiliationId: null,
  funderOpportunityNumber: null,
  funderProjectNumber: null,
  grantId: null,
  projectId: null,
  status: null,
};

const mockPush = jest.fn();

function renderPage(mocks: MockedResponse[]) {
  return render(
    <MockedProvider mocks={mocks}>
      <ProjectsCreateProjectFunding />
    </MockedProvider>
  );
}

describe('ProjectsCreateProjectFunding (funding status)', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    HTMLElement.prototype.scrollIntoView = jest.fn();
    mockPush.mockReset();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useParams as jest.Mock).mockReturnValue({ projectId: '123' });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=plan&projectFundingId=18'));
  });

  it('renders the three status options with Planning to apply selected by default', async () => {
    renderPage([fundingsMock(null)]);

    expect(await screen.findByLabelText('fundingStatus.options.planned')).toBeChecked();
    expect(screen.getByLabelText('fundingStatus.options.applied')).not.toBeChecked();
    expect(screen.getByLabelText('fundingStatus.options.funded')).not.toBeChecked();
    expect(screen.getByTestId('create-flow-stage-addFunder')).toHaveAttribute('aria-current', 'step');
  });

  it('preselects Already funded when the funding is GRANTED', async () => {
    renderPage([fundingsMock(null, ProjectFundingStatus.Granted)]);

    await waitFor(() => {
      expect(screen.getByLabelText('fundingStatus.options.funded')).toBeChecked();
    });
  });

  it('goes to project details when Planning to apply, even for an API funder', async () => {
    renderPage([fundingsMock('/api'), updateMock(ProjectFundingStatus.Planned)]);

    fireEvent.click(await screen.findByRole('button', { name: 'buttons.next' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en-US/projects/123/project?intent=plan');
    });
  });

  it('goes to project search when funded and the funder has an API', async () => {
    renderPage([fundingsMock('/api'), updateMock(ProjectFundingStatus.Granted)]);

    fireEvent.click(await screen.findByLabelText('fundingStatus.options.funded'));
    fireEvent.click(screen.getByRole('button', { name: 'buttons.next' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en-US/projects/123/create/project-search?intent=plan&affId=99&projectFundingId=18');
    });
  });

  it('saves Already applied as PLANNED and searches when the funder has an API', async () => {
    renderPage([fundingsMock('/api'), updateMock(ProjectFundingStatus.Planned)]);

    fireEvent.click(await screen.findByLabelText('fundingStatus.options.applied'));
    fireEvent.click(screen.getByRole('button', { name: 'buttons.next' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en-US/projects/123/create/project-search?intent=plan&affId=99&projectFundingId=18');
    });
  });

  it('goes to project details when funded but the funder has no API', async () => {
    renderPage([fundingsMock(null), updateMock(ProjectFundingStatus.Granted)]);

    fireEvent.click(await screen.findByLabelText('fundingStatus.options.funded'));
    fireEvent.click(screen.getByRole('button', { name: 'buttons.next' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en-US/projects/123/project?intent=plan');
    });
  });

  it('shows the server error and stays on the page when the update fails', async () => {
    renderPage([
      fundingsMock(null),
      {
        request: {
          query: UpdateProjectFundingDocument,
          variables: { input: { projectFundingId: 18, status: ProjectFundingStatus.Planned } },
        },
        result: { data: { updateProjectFunding: { errors: { ...errorFields, general: 'Nope' } } } },
      },
    ]);

    fireEvent.click(await screen.findByRole('button', { name: 'buttons.next' }));

    expect(await screen.findByText('Nope')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('removes the funding and returns to the funder step on Change funder', async () => {
    renderPage([
      fundingsMock(null),
      {
        request: { query: RemoveProjectFundingDocument, variables: { projectFundingId: 18 } },
        result: { data: { removeProjectFunding: { id: 18, errors: { ...errorFields, general: null } } } },
      },
    ]);

    fireEvent.click(await screen.findByTestId('change-funder'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en-US/projects/123/create/funder?intent=plan');
    });
  });

  it('asks the user to add a funder first when the project has no funding', async () => {
    renderPage([{
      request: { query: ProjectFundingsApiDocument, variables: { projectId: 123 } },
      result: { data: { project: { fundings: [] } } },
    }]);

    fireEvent.click(await screen.findByRole('button', { name: 'buttons.next' }));

    expect(await screen.findByText('fundingStatus.errors.noFunding')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows a generic error when saving the status fails on the network', async () => {
    renderPage([
      fundingsMock(null),
      {
        request: {
          query: UpdateProjectFundingDocument,
          variables: { input: { projectFundingId: 18, status: ProjectFundingStatus.Planned } },
        },
        error: new Error('Network down'),
      },
    ]);

    fireEvent.click(await screen.findByRole('button', { name: 'buttons.next' }));

    expect(await screen.findByText('fundingStatus.errors.saveFailed')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('stays on the page when removing the funder fails', async () => {
    renderPage([
      fundingsMock(null),
      {
        request: { query: RemoveProjectFundingDocument, variables: { projectFundingId: 18 } },
        error: new Error('Network down'),
      },
    ]);

    fireEvent.click(await screen.findByTestId('change-funder'));

    expect(await screen.findByText('fundingStatus.errors.saveFailed')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should pass axe accessibility test', async () => {
    const { container } = renderPage([fundingsMock(null)]);
    await screen.findByLabelText('fundingStatus.options.planned');
    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
