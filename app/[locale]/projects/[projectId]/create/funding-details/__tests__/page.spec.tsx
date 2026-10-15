import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MockedProvider } from '@apollo/client/testing/react';
import { MockedResponse } from '@apollo/client/testing';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import {
  ProjectFundingDocument,
  ProjectFundingStatus,
  ProjectFundingsApiDocument,
  UpdateProjectFundingDocument,
} from '@/generated/graphql';
import ProjectsCreateProjectFundingDetails from '../page';

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

const mockToastAdd = jest.fn();
jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ add: mockToastAdd }),
}));

const fundingMock = {
  request: { query: ProjectFundingDocument, variables: { projectFundingId: 18 } },
  result: {
    data: {
      projectFunding: {
        affiliation: { name: 'NSF', displayName: 'National Science Foundation', uri: 'https://ror.org/nsf' },
        status: ProjectFundingStatus.Granted,
        grantId: 'G-1',
        funderOpportunityNumber: null,
        funderProjectNumber: null,
        project: { readOnly: false },
      },
    },
  },
};

const errorFields = {
  affiliationId: null,
  funderOpportunityNumber: null,
  funderProjectNumber: null,
  general: null,
  grantId: null,
  projectId: null,
  status: null,
};

const updateMock = (errors: object | null) => ({
  request: {
    query: UpdateProjectFundingDocument,
    variables: {
      input: {
        projectFundingId: 18,
        status: ProjectFundingStatus.Granted,
        grantId: 'G-2',
        funderProjectNumber: 'P-9',
        funderOpportunityNumber: '',
      },
    },
  },
  result: { data: { updateProjectFunding: { errors } } },
});

const mockPush = jest.fn();

function renderPage(mocks: MockedResponse[]) {
  return render(
    <MockedProvider mocks={mocks}>
      <ProjectsCreateProjectFundingDetails />
    </MockedProvider>
  );
}

describe('ProjectsCreateProjectFundingDetails', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    HTMLElement.prototype.scrollIntoView = jest.fn();
    mockPush.mockReset();
    mockToastAdd.mockReset();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useParams as jest.Mock).mockReturnValue({ projectId: '123' });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=plan&projectFundingId=18'));
  });

  it('prefills the form from the saved funding', async () => {
    renderPage([fundingMock]);

    expect(await screen.findByDisplayValue('National Science Foundation')).toBeDisabled();
    expect(screen.getByLabelText('fundingDetails.grantId')).toHaveValue('G-1');
    expect(screen.getByTestId('create-flow-stage-addFunder')).toHaveAttribute('aria-current', 'step');
  });

  it('falls back to the project funding when no id is in the URL', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=plan'));
    renderPage([
      {
        request: { query: ProjectFundingsApiDocument, variables: { projectId: 123 } },
        result: {
          data: {
            project: {
              fundings: [{
                id: 18,
                status: ProjectFundingStatus.Granted,
                affiliation: { apiTarget: null, uri: 'https://ror.org/nsf', id: 1, displayName: 'NSF' },
              }],
            },
          },
        },
      },
      fundingMock,
    ]);

    expect(await screen.findByDisplayValue('National Science Foundation')).toBeInTheDocument();
  });

  it('saves the identifiers and moves on to project details', async () => {
    renderPage([fundingMock, updateMock(errorFields)]);

    await screen.findByDisplayValue('G-1');
    fireEvent.change(screen.getByLabelText('fundingDetails.grantId'), { target: { value: 'G-2' } });
    fireEvent.change(screen.getByLabelText('fundingDetails.funderProjectNumber'), { target: { value: 'P-9' } });
    fireEvent.click(screen.getByRole('button', { name: 'buttons.next' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en-US/projects/123/project?intent=plan');
    });
    expect(mockToastAdd).toHaveBeenCalledWith('fundingDetails.messages.saved', { type: 'success' });
  });

  it('shows field errors from the server and stays on the page', async () => {
    renderPage([fundingMock, updateMock({ ...errorFields, grantId: 'Bad grant' })]);

    await screen.findByDisplayValue('G-1');
    fireEvent.change(screen.getByLabelText('fundingDetails.grantId'), { target: { value: 'G-2' } });
    fireEvent.change(screen.getByLabelText('fundingDetails.funderProjectNumber'), { target: { value: 'P-9' } });
    fireEvent.click(screen.getByRole('button', { name: 'buttons.next' }));

    expect(await screen.findByText('Bad grant')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('says the funding was not found when the project has none', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=plan'));
    renderPage([{
      request: { query: ProjectFundingsApiDocument, variables: { projectId: 123 } },
      result: { data: { project: { fundings: [] } } },
    }]);

    fireEvent.click(await screen.findByRole('button', { name: 'buttons.next' }));

    expect(await screen.findByText('fundingDetails.messages.notFound')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows a generic error when saving fails on the network', async () => {
    renderPage([fundingMock, { ...updateMock(null), result: undefined, error: new Error('Network down') }]);

    await screen.findByDisplayValue('G-1');
    fireEvent.change(screen.getByLabelText('fundingDetails.grantId'), { target: { value: 'G-2' } });
    fireEvent.change(screen.getByLabelText('fundingDetails.funderProjectNumber'), { target: { value: 'P-9' } });
    fireEvent.click(screen.getByRole('button', { name: 'buttons.next' }));

    expect(await screen.findByText('fundingDetails.messages.saveFailed')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('lets the user change the funding status', async () => {
    renderPage([fundingMock, {
      request: {
        query: UpdateProjectFundingDocument,
        variables: {
          input: {
            projectFundingId: 18,
            status: ProjectFundingStatus.Denied,
            grantId: 'G-1',
            funderProjectNumber: '',
            funderOpportunityNumber: '',
          },
        },
      },
      result: { data: { updateProjectFunding: { errors: errorFields } } },
    }]);

    await screen.findByDisplayValue('G-1');
    fireEvent.click(screen.getByRole('button', { name: /fundingDetails.status/ }));
    fireEvent.click(await screen.findByRole('option', { name: 'fundingDetails.statuses.DENIED' }));
    fireEvent.click(screen.getByRole('button', { name: 'buttons.next' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en-US/projects/123/project?intent=plan');
    });
  });

  it('should pass axe accessibility test', async () => {
    const { container } = renderPage([fundingMock]);
    await screen.findByDisplayValue('G-1');
    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
