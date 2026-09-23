import React from 'react';
import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  ProjectFundingDocument,
  UpdateProjectFundingDocument
} from '@/generated/graphql';
import {
  removeProjectFundingAction
} from '../actions';
import logECS from '@/utils/clientLogger';
import { useToast } from '@/context/ToastContext';

import ProjectsProjectFundingEdit from '../page';
import { axe, toHaveNoViolations } from 'jest-axe';
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";

expect.extend(toHaveNoViolations);

jest.mock('../actions/index', () => ({
  removeProjectFundingAction: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn()
}));

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useApolloClient: () => ({
    cache: {
      evict: jest.fn(),
      gc: jest.fn(),
      modify: jest.fn(),
      identify: jest.fn(),
    },
  }),
}));

jest.mock('@/generated/graphql', () => ({
  ...jest.requireActual('@/generated/graphql'),
  ProjectFundingStatus: {
    Planned: 'PLANNED',
    Denied: 'DENIED',
    Granted: 'GRANTED'
  }
}));

const mockRouter = {
  push: jest.fn(),
};

const mockToast = {
  add: jest.fn(),
};

// Cast with jest.mocked utility
const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);

const setupMocks = (isReadOnly = false) => {
  // Create stable references OUTSIDE mockImplementation, so that 
  // the different objects are returned on every call and causing infinite loop
  const stableQueryReturn = {
    data: {
      projectFunding: {
        affiliation: {
          name: 'National Science Foundation',
        },
        funderOpportunityNumber: 'NSF-12345-ABC',
        funderProjectNumber: 'IRL-123-1234',
        grantId: 'https://example.com/awards/IRL-000000X1',
        status: 'DENIED',
        project: {
          readOnly: isReadOnly
        }
      },
    },
    loading: false,
    refetch: jest.fn()
  };

  const stableMutationFn = jest.fn().mockResolvedValue({
    data: { key: 'value' },
  });

  mockUseQuery.mockImplementation((document) => {
    if (document === ProjectFundingDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return stableQueryReturn as any;
    }

    return {
      data: null,
      loading: false,
      error: undefined
    };
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === UpdateProjectFundingDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [stableMutationFn, { loading: false, error: undefined }] as any;
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return [jest.fn(), { loading: false, error: undefined }] as any;
  });
};

describe('ProjectsProjectFundingEdit', () => {
  const mockUseParams = useParams as jest.Mock;

  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
    mockUseParams.mockReturnValue({ projectId: '1', projectFundingId: '1' });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    // Mock Toast
    (useToast as jest.Mock).mockReturnValue(mockToast);
  });

  it('should render the project details form', async () => {
    await act(async () => {
      render(
        <ProjectsProjectFundingEdit />
      );
    });

    expect(screen.getByLabelText('labels.funderName')).toBeInTheDocument();
    expect(screen.getByLabelText(/labels.fundingStatus/)).toBeInTheDocument();
    // Find the "denied" text within a <span> element
    const deniedSpan = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && content === 'denied';
    });
    expect(deniedSpan).toBeInTheDocument();

    // Funding status select dropdown
    const hiddenContainer = screen.getByTestId('hidden-select-container');
    const selectElement = within(hiddenContainer).getByDisplayValue('denied');//default value

    const options = Array.from(selectElement.querySelectorAll('option'));
    expect(options[1]).toHaveValue('PLANNED');
    expect(options[1]).toHaveTextContent('planned');

    expect(options[2]).toHaveValue('DENIED');
    expect(options[2]).toHaveTextContent('denied');

    expect(options[3]).toHaveValue('GRANTED');
    expect(options[3]).toHaveTextContent('granted');

    expect(screen.getByText('labels.grantNumber')).toBeInTheDocument();
    expect(screen.getByLabelText(/labels.projectNumber/)).toBeInTheDocument();
    expect(screen.getByLabelText(/labels.opportunity/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buttons.saveChanges/i })).toBeInTheDocument();

    // breadcrumbs
    expect(screen.getByText('breadcrumbs.home')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbs.projects')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbs.projectOverview')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbs.projectFunding')).toBeInTheDocument();
  });

  it('should display error if the initial ProjectFundingsQuery returns an error', async () => {
    // Create stable references OUTSIDE mockImplementation
    const projectFundingReturn = {
      data: null,
      loading: false,
      error: { message: 'There was an error getting the funders.' },
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === ProjectFundingDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return projectFundingReturn as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => {
      render(
        <ProjectsProjectFundingEdit />
      );
    });

    expect(screen.getByText('There was an error getting the funders.')).toBeInTheDocument();
  })

  it('should update the fundingStatus field when the user selects a new option', async () => {
    await act(async () => {
      render(
        <ProjectsProjectFundingEdit />
      );
    });

    const fundingStatusSelect = screen.getByLabelText(/labels.fundingStatus/);
    fireEvent.change(fundingStatusSelect, { target: { value: 'GRANTED' } });

    expect(fundingStatusSelect).toHaveValue('GRANTED');
  });

  it('should update the grantNumber field when the user types in the input', async () => {
    await act(async () => {
      render(
        <ProjectsProjectFundingEdit />
      );
    });

    const grantNumberInput = screen.getByLabelText(/labels.grantNumber/);
    fireEvent.change(grantNumberInput, { target: { value: 'New-grantNumber-123' } });

    expect(grantNumberInput).toHaveValue('New-grantNumber-123');
  });

  it('should update the projectNumber field when the user types in the input', async () => {
    await act(async () => {
      render(
        <ProjectsProjectFundingEdit />
      );
    });

    const projectNumberInput = screen.getByLabelText(/labels.projectNumber/);
    fireEvent.change(projectNumberInput, { target: { value: 'New-projectNumber-123' } });

    expect(projectNumberInput).toHaveValue('New-projectNumber-123');
  });


  it('should update the opportunityNumber field when the user types in the input', async () => {
    await act(async () => {
      render(
        <ProjectsProjectFundingEdit />
      );
    });

    const opportunityInput = screen.getByLabelText(/labels.opportunity/);
    fireEvent.change(opportunityInput, { target: { value: 'New-opportunity-123' } });

    expect(opportunityInput).toHaveValue('New-opportunity-123');
  });

  it('should display loading message when data is loading', async () => {
    const projectFundingReturn = {
      data: null,
      loading: true,
      error: undefined
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === ProjectFundingDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return projectFundingReturn as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => {
      render(
        <ProjectsProjectFundingEdit />
      );
    });

    expect(screen.getByText('messaging.loading...')).toBeInTheDocument();
  });

  it('should update project data on form submit', async () => {
    const mockUpdateProjectFundingMutation = jest.fn().mockResolvedValue({
      data: { updateProjectFunding: { errors: null } },
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateProjectFundingDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateProjectFundingMutation, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <ProjectsProjectFundingEdit />
      );
    });

    fireEvent.submit(screen.getByRole('button', { name: /buttons.saveChanges/i }));
    expect(mockUpdateProjectFundingMutation).toHaveBeenCalledWith({
      variables: {
        input: {
          projectFundingId: 1,
          status: 'DENIED',
          funderProjectNumber: 'IRL-123-1234',
          grantId: 'https://example.com/awards/IRL-000000X1',
          funderOpportunityNumber: 'NSF-12345-ABC',
        },
      },
    });
  });

  it('should display error messages when mutation throws an error', async () => {
    const mockUpdateProjectFundingMutationError = jest.fn().mockRejectedValueOnce(new Error('Error'));

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateProjectFundingDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateProjectFundingMutationError, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <ProjectsProjectFundingEdit />
      );
    });

    fireEvent.submit(screen.getByRole('button', { name: /buttons.saveChanges/i }));
    expect(await screen.findByText('messages.errors.projectFundingUpdateFailed')).toBeInTheDocument();
    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'updateProjectFundingMutation',
        expect.objectContaining({
          error: expect.anything(),
          url: { path: '/projects/[projectId]/fundings/[projectFundingId]/edit' },
        })
      );
    });
  });

  it('should display error messages when form submission fails', async () => {
    const mockUpdateProjectFundingMutation = jest.fn().mockResolvedValue({
      data: { updateProjectFunding: { errors: { general: 'Update failed' } } },
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateProjectFundingDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateProjectFundingMutation, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <ProjectsProjectFundingEdit />
      );
    });

    fireEvent.submit(screen.getByRole('button', { name: /buttons.saveChanges/i }));
    expect(await screen.findByText('Update failed')).toBeInTheDocument();
  });


  it('should not allow editing of the funderName input field', async () => {
    await act(async () => {
      render(
        <ProjectsProjectFundingEdit />
      );
    });

    const input = screen.getByLabelText(/labels.funderName/);
    expect(input).toBeDisabled();
  });

  it('should redirect user to the Add Funder page when they click the \'Add another\' button', async () => {

    await act(async () => {
      render(
        <ProjectsProjectFundingEdit />
      );
    });

    const addAnotherBtn = screen.getByRole('button', { name: 'buttons.addAnother' });
    fireEvent.click(addAnotherBtn);
    // Verify that router.push was called with "/en-US/projects/1/fundings/add"
    expect(mockRouter.push).toHaveBeenCalledWith('/en-US/projects/1/fundings/add');
  });

  it('should call removeProjectFunding and redirect user when the \'Remove funder\' button is clicked', async () => {

    (removeProjectFundingAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: null,
          status: null,
          affiliationId: null,
          funderOpportunityNumber: null,
          funderProjectNumber: null,
          grantId: null,
          projectId: null
        },
        id: 1
      },
    });
    await act(async () => {
      render(
        <ProjectsProjectFundingEdit />
      );
    });

    const removeAnotherBtn = screen.getByRole('button', { name: 'buttons.removeFunder' });
    fireEvent.click(removeAnotherBtn);
    await waitFor(() => {
      expect(removeProjectFundingAction).toHaveBeenCalledWith({
        projectFundingId: expect.any(Number),
      });
      expect(mockToast.add).toHaveBeenCalledWith('messages.success.removedFunding', { type: 'success' });
      expect(mockRouter.push).toHaveBeenCalledWith('/en-US/projects/1/fundings');
    });
  });

  it('should redirect user if the call to removeProjectFundingAction returns a redirect url', async () => {
    (removeProjectFundingAction as jest.Mock).mockResolvedValue({
      success: true,
      redirect: "/login",
      data: {
        errors: {
          general: null,
          status: null,
          affiliationId: null,
          funderOpportunityNumber: null,
          funderProjectNumber: null,
          grantId: null,
          projectId: null
        },
        id: 1
      },
    });
    await act(async () => {
      render(
        <ProjectsProjectFundingEdit />
      );
    });

    const removeAnotherBtn = screen.getByRole('button', { name: 'buttons.removeFunder' });
    fireEvent.click(removeAnotherBtn);
    await waitFor(() => {
      expect(removeProjectFundingAction).toHaveBeenCalledWith({
        projectFundingId: expect.any(Number),
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  it('should display error message if removeProjectFundingAction returns errors', async () => {

    (removeProjectFundingAction as jest.Mock).mockResolvedValue({
      success: false,
      errors: ["There was a problem"]
    });
    await act(async () => {
      render(
        <ProjectsProjectFundingEdit />
      );
    });

    const removeAnotherBtn = screen.getByRole('button', { name: 'buttons.removeFunder' });
    fireEvent.click(removeAnotherBtn);
    await waitFor(() => {
      expect(removeProjectFundingAction).toHaveBeenCalledWith({
        projectFundingId: expect.any(Number),
      });
      expect(screen.getByText("There was a problem")).toBeInTheDocument();
    });
  });

  it('should display error message if removeProjectFundingAction returns field-level errors', async () => {

    (removeProjectFundingAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: "There was a general error",
          status: null,
          affiliationId: null,
          funderOpportunityNumber: null,
          funderProjectNumber: null,
          grantId: null,
          projectId: null
        },
        id: 1
      },
    });
    await act(async () => {
      render(
        <ProjectsProjectFundingEdit />
      );
    });

    const removeAnotherBtn = screen.getByRole('button', { name: 'buttons.removeFunder' });
    fireEvent.click(removeAnotherBtn);
    await waitFor(() => {
      expect(removeProjectFundingAction).toHaveBeenCalledWith({
        projectFundingId: expect.any(Number),
      });
      expect(screen.getByText("There was a general error")).toBeInTheDocument();
    });
  });

  describe('when isReadOnly is true', () => {
    it('should disable form inputs', async () => {
      setupMocks(true);
      await act(async () => {
        render(<ProjectsProjectFundingEdit />);
      });

      expect(screen.getByLabelText(/labels.fundingStatus/)).toBeDisabled();
      expect(screen.getByLabelText(/labels.grantNumber/)).toBeDisabled();
      expect(screen.getByLabelText(/labels.projectNumber/)).toBeDisabled();
    });

    it('should not display save and delete buttons', async () => {
      setupMocks(true);
      await act(async () => {
        render(<ProjectsProjectFundingEdit />);
      });

      expect(screen.queryByRole('button', { name: /buttons.saveChanges/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /buttons.removeFunder/i })).not.toBeInTheDocument();
    });
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <ProjectsProjectFundingEdit />
    );
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
