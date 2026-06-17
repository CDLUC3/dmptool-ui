import React from 'react';
import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import {
  ChildResearchDomainsDocument,
  ProjectDocument,
  TopLevelResearchDomainsDocument,
  UpdateProjectDocument
} from '@/generated/graphql';
import logECS from '@/utils/clientLogger';

import ProjectsProjectDetail from '../page';
import { axe, toHaveNoViolations } from 'jest-axe';
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}));

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useLazyQuery: jest.fn(),
}));

const mockRefetch = jest.fn();

// Cast with jest.mocked utility
const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);
const mockUseLazyQuery = jest.mocked(useLazyQuery);

const stableSearchParams = {
  get: (key: string) => {
    const params: Record<string, string> = { fromOverview: 'true' };
    return params[key] || null;
  },
  getAll: () => [],
  has: (key: string) => key in { fromOverview: 'true' },
  keys() { },
  values() { },
  entries() { },
  forEach() { },
  toString() { return ''; },
} as unknown as ReturnType<typeof useSearchParams>;

const setupMocks = () => {
  // Create stable references OUTSIDE mockImplementation
  const stableProjectQueryReturn = {
    data: {
      project: {
        title: 'Test Project',
        abstractText: 'Test Abstract',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        researchDomain: { id: '1' },
        isTestProject: true,
      },
    },
    loading: false,
    refetch: mockRefetch
  };

  const stableTopLevelDomainsReturn = {
    data: {
      topLevelResearchDomains: [
        { id: '1', name: 'Domain 1' },
        { id: '2', name: 'Domain 2' },
      ],
    },
    loading: false,
    error: undefined,
    refetch: mockRefetch
  };

  mockUseQuery.mockImplementation((document) => {
    if (document === ProjectDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return stableProjectQueryReturn as any;
    }

    if (document === TopLevelResearchDomainsDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return stableTopLevelDomainsReturn as any;
    }

    return {
      data: null,
      loading: false,
      error: undefined
    };
  });

  mockUseLazyQuery.mockImplementation((document) => {
    const mockFetch = jest.fn().mockResolvedValue({
      data: {
        childResearchDomains: [
          { id: '1', name: 'Child Domain 1', description: 'Child 1 Desc' },
          { id: '2', name: 'Child Domain 2', description: 'Child 2 Desc' },
        ],
      },
    });

    if (document === ChildResearchDomainsDocument) {
      return [
        mockFetch,
        {
          data: undefined, // Initially undefined until fetch is called
          loading: false,
          error: undefined,
          called: false,
        }
        /* eslint-disable @typescript-eslint/no-explicit-any */
      ] as any;
    }

    return [
      jest.fn(),
      {
        data: undefined,
        loading: false,
        error: undefined,
        called: false,
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
    ] as any;
  });

  const mockMutationFn = jest.fn().mockResolvedValue({
    data: {
      key: 'value'
    },
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === UpdateProjectDocument) {
      return [
        mockMutationFn,
        { loading: false, error: undefined }
        /* eslint-disable @typescript-eslint/no-explicit-any */
      ] as any;
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return [jest.fn(), { loading: false, error: undefined }] as any;
  });
};

describe('ProjectsProjectDetail', () => {
  let mockRouter;
  const mockUseParams = useParams as jest.Mock;

  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
    mockUseParams.mockReturnValue({ projectId: '1' });

    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockReturnValue(stableSearchParams);

  });

  it('should render the project details form', () => {

    render(<ProjectsProjectDetail />);

    expect(screen.getByLabelText(/labels.projectName/)).toBeInTheDocument();
    expect(screen.getByLabelText(/labels.projectAbstract/)).toBeInTheDocument();
    expect(screen.getByText('labels.startDate')).toBeInTheDocument();
    expect(screen.getByText('labels.endDate')).toBeInTheDocument();
    expect(screen.getByLabelText(/labels.researchDomain/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /title/i })).toBeInTheDocument();
  });

  it('should display loading message when data is loading', () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === ProjectDocument) {
        return {
          data: undefined,
          loading: true,  // ← Set loading to true
          error: undefined,
          refetch: jest.fn()
          /* eslint-disable @typescript-eslint/no-explicit-any */
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });

    render(<ProjectsProjectDetail />);
    expect(screen.getByText('messaging.loading...')).toBeInTheDocument();
  });

  it('should display error when useProjectsQuery returns a query error', () => {
    const stableProjectQueryReturn = {
      data: undefined,
      loading: false,
      error: { message: 'query failed' },
      refetch: mockRefetch
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === ProjectDocument) {
        return stableProjectQueryReturn as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });

    render(<ProjectsProjectDetail />);
    expect(screen.getByText('query failed')).toBeInTheDocument();
  });


  it('should display error messages when form validation fails', async () => {

    const mockMutationFn = jest.fn().mockResolvedValue({ data: null });

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateProjectDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockMutationFn, { loading: false, error: { message: 'There was an error' } }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    render(<ProjectsProjectDetail />);
    fireEvent.change(screen.getByLabelText(/labels.projectName/), { target: { value: '' } });
    fireEvent.submit(screen.getByRole('button', { name: /save/i }));
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(within(alert).getByText('messages.errors.projectName')).toBeInTheDocument();
  });

  it('should update project data on form submit', async () => {
    const mockUpdateProjectMutation = jest.fn().mockResolvedValue({
      data: { updateProject: { errors: null } },
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateProjectDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateProjectMutation, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    render(<ProjectsProjectDetail />);
    fireEvent.change(screen.getByLabelText(/labels.projectName/), { target: { value: 'Updated Project' } });
    await waitFor(() => {
      fireEvent.submit(screen.getByRole('button', { name: /save/i }));
    })

    // Verify that router.push was called with "/login"
    expect(mockRouter.push).toHaveBeenCalledWith('/en-US/projects/1');
    expect(mockUpdateProjectMutation).toHaveBeenCalledWith({
      variables: {
        input: {
          id: 1,
          title: 'Updated Project',
          abstractText: 'Test Abstract',
          researchDomainId: 1,
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          isTestProject: true,
        },
      },
    });
  });

  it('should call logECS to log error if updateProject mutation throws an error', async () => {

    const mockUpdateProjectFundingMutationError = jest.fn().mockRejectedValueOnce(new Error('Error'));

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateProjectDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateProjectFundingMutationError, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    render(<ProjectsProjectDetail />);
    fireEvent.change(screen.getByLabelText(/labels.projectName/), { target: { value: 'Updated Project' } });
    fireEvent.submit(screen.getByRole('button', { name: /save/i }));

    // //Check that error logged
    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'updateProjectMutation',
        expect.objectContaining({
          error: expect.anything(),
          url: { path: '/projects/1/project' },
        })
      )
    })
    expect(screen.getByText('messages.errors.projectUpdateFailed')).toBeInTheDocument();
  });

  it('should updateProjectMutation response includes data.errors', async () => {

    const mockUpdateProjectMutation = jest.fn().mockResolvedValue({
      data: {
        updateProject: {
          errors: {
            general: "Could not update project"
          }
        }
      },
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateProjectDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateProjectMutation, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    render(<ProjectsProjectDetail />);

    act(() => {
      fireEvent.change(screen.getByLabelText(/labels.projectName/), { target: { value: 'Updated Project' } });
      fireEvent.submit(screen.getByRole('button', { name: /save/i }));
    })

    await waitFor(() => {
      expect(screen.getByText('Could not update project')).toBeInTheDocument();
    }
    );
  });

  it('should handle radio button change', () => {

    render(<ProjectsProjectDetail />);
    fireEvent.click(screen.getByLabelText('labels.realProject'));
    expect(screen.getByLabelText('labels.realProject')).toBeChecked();
  });

  it('should redirect to project search page when Search button is clicked', () => {
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockReturnValue({
      get: (key: string) => {
        const params: Record<string, string> = {
          fromOverview: 'true',
          projectFundingId: '99',
        };
        return params[key] || null;
      },
    } as unknown as ReturnType<typeof useSearchParams>);

    const stableProjectReturn = {
      data: {
        project: {
          title: 'Test Project',
          abstractText: 'Test Abstract',
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          researchDomain: { id: '1' },
          isTestProject: true,
          readOnly: false,
          fundings: [{ id: '99', affiliation: { apiTarget: 'someTarget' } }],
        },
      },
      loading: false,
      refetch: mockRefetch,
    };

    const stableTopLevelDomainsReturn = {
      data: {
        topLevelResearchDomains: [
          { id: '1', name: 'Domain 1' },
          { id: '2', name: 'Domain 2' },
        ],
      },
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === ProjectDocument) {
        return stableProjectReturn as any;
      }
      if (document === TopLevelResearchDomainsDocument) {
        return stableTopLevelDomainsReturn as any;
      }
      return { data: null, loading: false, error: undefined } as any;
    });

    render(<ProjectsProjectDetail />);
    const searchBtn = screen.getByTestId('search-projects-button');
    fireEvent.click(searchBtn);
    expect(mockRouter.push).toHaveBeenCalledWith('/en-US/projects/1/projects-search');
  });

  it('should hide search projects button when project has no fundings', () => {
    render(<ProjectsProjectDetail />);
    expect(screen.queryByTestId('search-projects-button')).not.toBeInTheDocument();
  });

  it('should hide search projects button when funder has no apiTarget', () => {
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockReturnValue({
      get: (key: string) => {
        const params: Record<string, string> = {
          fromOverview: 'true',
          projectFundingId: '99',
        };
        return params[key] || null;
      },
    } as unknown as ReturnType<typeof useSearchParams>);

    const stableProjectReturn = {
      data: {
        project: {
          title: 'Test Project',
          abstractText: 'Test Abstract',
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          researchDomain: { id: '1' },
          isTestProject: true,
          readOnly: false,
          fundings: [{ id: '99', affiliation: { apiTarget: null } }],
        },
      },
      loading: false,
      refetch: mockRefetch,
    };

    const stableTopLevelDomainsReturn = {
      data: {
        topLevelResearchDomains: [
          { id: '1', name: 'Domain 1' },
          { id: '2', name: 'Domain 2' },
        ],
      },
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === ProjectDocument) {
        return stableProjectReturn as any;
      }
      if (document === TopLevelResearchDomainsDocument) {
        return stableTopLevelDomainsReturn as any;
      }
      return { data: null, loading: false, error: undefined } as any;
    });

    render(<ProjectsProjectDetail />);
    expect(screen.queryByTestId('search-projects-button')).not.toBeInTheDocument();
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <ProjectsProjectDetail />
    );
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

describe('when isReadOnly is true', () => {
  let mockRouter;
  const mockUseParams = useParams as jest.Mock;
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
    mockUseParams.mockReturnValue({ projectId: '1' });

    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockReturnValue(stableSearchParams);
    const stableReadOnlyProjectQueryReturn = {
      data: {
        project: {
          title: 'Test Project',
          abstractText: 'Test Abstract',
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          researchDomain: { id: '1' },
          isTestProject: true,
          readOnly: true,
        },
      },
      loading: false,
      refetch: mockRefetch,
    };

    const stableReadOnlyTopLevelDomainsReturn = {
      data: {
        topLevelResearchDomains: [
          { id: '1', name: 'Domain 1' },
          { id: '2', name: 'Domain 2' },
        ],
      },
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === ProjectDocument) {
        return stableReadOnlyProjectQueryReturn as any;
      }
      if (document === TopLevelResearchDomainsDocument) {
        return stableReadOnlyTopLevelDomainsReturn as any;
      }
      return { data: null, loading: false, error: undefined } as any;
    });
  });

  it('should disable all form fields when isReadOnly is true', () => {
    render(<ProjectsProjectDetail />);

    expect(screen.getByLabelText(/labels.projectName/)).toBeDisabled();
    expect(screen.getByLabelText(/labels.projectAbstract/)).toBeDisabled();
  });

  it('should render a non-interactive save button with aria-disabled when isReadOnly is true', () => {
    render(<ProjectsProjectDetail />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toHaveAttribute('aria-disabled', 'true');
    expect(saveButton).not.toHaveAttribute('type', 'submit');
  });

  it('should show a read-only popover message when the disabled save button is clicked', async () => {
    render(<ProjectsProjectDetail />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('messages.readOnlyLinkMessage')).toBeInTheDocument();
    });
  });

  it('should not submit the mutation when the disabled save button is clicked', async () => {
    const mockUpdateProjectMutation = jest.fn();
    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateProjectDocument) {
        return [mockUpdateProjectMutation, { loading: false, error: undefined }] as any;
      }
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    render(<ProjectsProjectDetail />);

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockUpdateProjectMutation).not.toHaveBeenCalled();
    });
  });

  it('should hide the search projects signpost section when isReadOnly is true', () => {
    render(<ProjectsProjectDetail />);

    expect(screen.queryByTestId('search-projects-button')).not.toBeInTheDocument();
  });
});