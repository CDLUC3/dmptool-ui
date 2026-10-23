import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MockedProvider } from '@apollo/client/testing/react';
import { MockedResponse } from '@apollo/client/testing';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';

import {
  ProjectFundingDocument,
  ProjectFundingsApiDocument,
  ProjectFundingStatus,
  UpdateProjectFundingDocument,
} from '@/generated/graphql';
import ProjectsCreateProjectFundingDetails from '../page';

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
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

const projectFundingsMock = (fundingIds: number[]) => ({
  request: { query: ProjectFundingsApiDocument, variables: { projectId: 123 } },
  result: {
    data: {
      project: {
        __typename: 'Project',
        fundings: fundingIds.map((id) => ({
          __typename: 'ProjectFunding',
          id,
          status: ProjectFundingStatus.Granted,
          affiliation: {
            __typename: 'Affiliation',
            apiTarget: null,
            uri: `https://ror.org/funder-${id}`,
            id,
            displayName: `Funder ${id}`,
          },
        })),
      },
    },
  },
});

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

function renderPage(mocks: MockedResponse[], projectFundingIds = [18]) {
  return render(
    <MockedProvider mocks={[projectFundingsMock(projectFundingIds), ...mocks]}>
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
    (useParams as jest.Mock).mockReturnValue({ projectId: '123', projectFundingId: '18' });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=plan'));
  });

  it('loads the funding named in the path', async () => {
    renderPage([fundingMock]);

    expect(await screen.findByDisplayValue('National Science Foundation')).toBeDisabled();
    expect(screen.getByLabelText('fundingDetails.grantId')).toHaveValue('G-1');
    expect(screen.getByTestId('create-flow-stage-addFunder')).toHaveAttribute('aria-current', 'step');
  });

  it.each(['abc', '0', undefined])(
    'offers to choose a funder instead of the form when the funding id in the path is invalid (%s)',
    (projectFundingId) => {
      (useParams as jest.Mock).mockReturnValue({ projectId: '123', projectFundingId });
      renderPage([]);

      expect(screen.getByText('fundingDetails.messages.notFound')).toBeInTheDocument();
      expect(screen.queryByLabelText('fundingDetails.grantId')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'buttons.next' })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'buttons.chooseFunder' }));
      expect(mockPush).toHaveBeenCalledWith('/projects/123/create/funder?intent=plan');
    }
  );

  it('offers to choose a funder instead of the form when the funding fails to load', async () => {
    renderPage([{ ...fundingMock, result: undefined, error: new Error('Not found') }]);

    expect(await screen.findByText('fundingDetails.messages.notFound')).toBeInTheDocument();
    expect(screen.queryByLabelText('fundingDetails.grantId')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.chooseFunder' })).toBeInTheDocument();
  });

  it('offers to choose a funder instead of the form when the funding belongs to another project', async () => {
    renderPage([fundingMock], [5]);

    expect(await screen.findByText('fundingDetails.messages.notFound')).toBeInTheDocument();
    expect(screen.queryByLabelText('fundingDetails.grantId')).not.toBeInTheDocument();
  });

  it('offers to choose a funder instead of the form when the project fundings fail to load', async () => {
    render(
      <MockedProvider mocks={[{ ...projectFundingsMock([18]), result: undefined, error: new Error('Down') }, fundingMock]}>
        <ProjectsCreateProjectFundingDetails />
      </MockedProvider>
    );

    expect(await screen.findByText('fundingDetails.messages.notFound')).toBeInTheDocument();
    expect(screen.queryByLabelText('fundingDetails.grantId')).not.toBeInTheDocument();
  });

  it('offers to choose a funder instead of the form when the funding does not exist', async () => {
    renderPage([{ ...fundingMock, result: { data: { projectFunding: null } } }]);

    expect(await screen.findByText('fundingDetails.messages.notFound')).toBeInTheDocument();
    expect(screen.queryByLabelText('fundingDetails.grantId')).not.toBeInTheDocument();
  });

  it('keeps the flow query when sending the user back to choose a funder', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=project&from=existing'));
    renderPage([{ ...fundingMock, result: { data: { projectFunding: null } } }]);

    fireEvent.click(await screen.findByRole('button', { name: 'buttons.chooseFunder' }));
    expect(mockPush).toHaveBeenCalledWith('/projects/123/create/funder?intent=project&from=existing');
  });

  it('saves the identifiers and moves on to project details', async () => {
    renderPage([fundingMock, updateMock(errorFields)]);

    await screen.findByDisplayValue('G-1');
    fireEvent.change(screen.getByLabelText('fundingDetails.grantId'), { target: { value: 'G-2' } });
    fireEvent.change(screen.getByLabelText('fundingDetails.funderProjectNumber'), { target: { value: 'P-9' } });
    fireEvent.click(screen.getByRole('button', { name: 'buttons.next' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects/123/project?intent=plan');
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
      expect(mockPush).toHaveBeenCalledWith('/projects/123/project?intent=plan');
    });
  });

  it('should pass axe accessibility test', async () => {
    const { container } = renderPage([fundingMock]);
    await screen.findByDisplayValue('G-1');
    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it('should pass axe accessibility test when the funding is not found', async () => {
    (useParams as jest.Mock).mockReturnValue({ projectId: '123', projectFundingId: 'abc' });
    const { container } = renderPage([]);
    await screen.findByRole('button', { name: 'buttons.chooseFunder' });
    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
