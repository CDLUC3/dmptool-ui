import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useQuery } from '@apollo/client/react';
import ProjectOverviewPage from '../page';
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";
import {
  MeDocument,
  PlanDocument,
  ProjectDocument,
  RelatedWorksByProjectStatsDocument
} from "@/generated/graphql";


expect.extend(toHaveNoViolations);

// Mock Apollo Client
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));

const mockUseQuery = jest.mocked(useQuery);

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn()
}));

// Mock useFormatter and useTranslations from next-intl
jest.mock('next-intl', () => ({
  useFormatter: jest.fn(() => ({
    dateTime: jest.fn(() => '01-01-2023'),
  })),
  useTranslations: jest.fn(() => jest.fn((key) => key)), // Mock `useTranslations`,
}));

const mockProjectData = {
  title: "Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations",
  startDate: "2025-09-01",
  endDate: "2028-12-31",
  fundings: [
    {
      id: 1,
      grantId: "https://example.com/awards/IRL-000000X1",
      affiliation: {
        name: "National Science Foundation",
        displayName: "National Science Foundation (nsf.gov)",
        searchName: "National Science Foundation | nsf.gov | NSF "
      }
    }
  ],
  members: [
    {
      givenName: "Jacques",
      surName: "Cousteau",
      memberRoles: [
        {
          description: "An individual conducting a research and investigation process, specifically performing the experiments, or data/evidence collection.",
          displayOrder: 1,
          label: "Principal Investigator (PI)",
          uri: "https://credit.niso.org/contributor-roles/investigation/"
        },
        {
          description: "An individual with management and coordination responsibility for the research activity planning and execution.",
          displayOrder: 2,
          label: "Project Administrator",
          uri: "https://credit.niso.org/contributor-roles/project-administration/"
        }
      ],
      email: "researcher@ucdavis.edu"
    },
    {
      givenName: "Captain",
      surName: "Nemo",
      memberRoles: [
        {
          description: "An individual conducting a research and investigation process, specifically performing the experiments, or data/evidence collection.",
          displayOrder: 1,
          label: "Principal Investigator (PI)",
          uri: "https://credit.niso.org/contributor-roles/investigation/"
        }
      ],
      email: null
    }
  ],
  outputs: [
    {
      title: "Anguilla anguilla observations"
    },
    {
      title: "Gymnothorax javanicus time-lapse series"
    }
  ],
  plans: [
    {
      created: "1740696782000",
      dmpId: "https://doi.org/10.11111/2A3B4C",
      funding: "National Science Foundation",
      id: 1,
      modified: "1740696782000",
      versionedSections: [
        {
          answeredQuestions: 0,
          displayOrder: 1,
          versionedSectionId: 7,
          title: "Roles & Responsibilities",
          totalQuestions: 1,
          customSectionId: null,
          sectionType: "BASE"
        },
        {
          answeredQuestions: 0,
          displayOrder: 2,
          versionedSectionId: null,
          title: "Custom section",
          totalQuestions: 1,
          customSectionId: 2,
          sectionType: "CUSTOM"
        }
      ],
      templateTitle: "NSF DMP Template",
    }
  ],
  readOnly: false,
  collaborators: [
    {
      user: { id: 'default-user-id' },
      accessLevel: 'EDIT'
    }
  ]
};

const setupMocks = (meData: { me: { id: string } } | null = null, projectData: typeof mockProjectData | null = null) => {
  // Create references OUTSIDE mockImplementation to prevent maximum update depth exceeded error
  const projectQueryReturn = {
    data: { project: projectData ?? mockProjectData },
    loading: false,
    error: undefined,
    refetch: jest.fn(),
  };

  const meQueryReturn = {
    data: meData ?? {
      me: {
        id: 'default-user-id',
      },
    },
    loading: false,
    error: null,
    refetch: jest.fn(),
  };

  const relatedWorksStatsQueryReturn = {
    data: {
      relatedWorksByProjectStats: {
        hasPublishedPlan: false,
        pendingCount: 0,
        acceptedCount: 0,
      },
    },
    loading: false,
    error: undefined,
    refetch: jest.fn(),
  };

  mockUseQuery.mockImplementation((document) => {
    if (document === ProjectDocument) {
      return projectQueryReturn;
    }

    if (document === MeDocument) {
      return meQueryReturn;
    }

    if (document === RelatedWorksByProjectStatsDocument) {
      return relatedWorksStatsQueryReturn;
    }

    return {
      data: null,
      loading: false,
      error: undefined,
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } as any;
  });
};


describe('ProjectOverviewPage', () => {
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();

    const mockUseParams = useParams as jest.Mock;
    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ projectId: '123' });
  })

  it('should render the project title', () => {
    render(<ProjectOverviewPage />);
    expect(screen.getByText('project')).toBeInTheDocument();
  });

  it('should not display project start and end dates if one of them is null', () => {
    const mockProjectDataWithoutStartDate = {
      ...mockProjectData,
      startDate: null
    };

    mockUseQuery.mockReturnValue({
      data: { project: mockProjectDataWithoutStartDate },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } as any);

    render(<ProjectOverviewPage />);
    //Should not see end date
    expect(screen.queryByText('2028-12-31')).not.toBeInTheDocument();
  })

  it('should render the project fundings', () => {
    render(<ProjectOverviewPage />);
    expect(screen.getByText('fundings')).toBeInTheDocument();
  });

  it('should render the project members', () => {
    render(<ProjectOverviewPage />);
    expect(screen.getByText('projectMembers')).toBeInTheDocument();
  });

  it('should render the plans', () => {
    render(<ProjectOverviewPage />);
    expect(screen.getByText('plans')).toBeInTheDocument();
  });

  it('should display Loading message ', async () => {

    mockUseQuery.mockReturnValue({
      data: undefined,
      error: undefined,
      loading: true,
      refetch: jest.fn(),
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } as any);

    render(<ProjectOverviewPage />);
    const loadingText = screen.getByText(/messaging.loading/i);
    expect(loadingText).toBeInTheDocument();
  })


  it('should not display related works counts for UNPUBLISHED if \'hasPublishedPlan\' prop is false', async () => {
    const updatedMockPlanData = {
      ...mockProjectData,
    };

    const planQueryReturn = {
      data: { plan: updatedMockPlanData },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const relatedWorksStatsQueryReturn = {
      data: {
        relatedWorksByPlanStats: {
          hasPublishedPlan: false,
          pendingCount: 1,
          acceptedCount: 10,
        }
      },
      loading: false,
      error: undefined,
    };

    // Override mock for this test
    mockUseQuery.mockImplementation((document) => {
      if (document === ProjectDocument) {
        return planQueryReturn;
      }

      if (document === RelatedWorksByProjectStatsDocument) {
        return relatedWorksStatsQueryReturn;
      }

      return {
        data: null,
        loading: false,
        error: undefined,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });


    render(<ProjectOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('relatedWorks.publish')).toBeInTheDocument();
      expect(screen.queryByText('relatedWorks.pendingCount')).not.toBeInTheDocument();
      expect(screen.queryByText('relatedWorks.acceptedCount')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'relatedWorks.edit' })).not.toBeInTheDocument();
    });
  });

  it('should display related works counts if \'hasPublishedPlan\' prop has a value', async () => {
    const updatedMockPlanData = {
      ...mockProjectData,
    };

    const planQueryReturn = {
      data: { plan: updatedMockPlanData },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const relatedWorksStatsQueryReturn = {
      data: {
        relatedWorksByProjectStats: {
          hasPublishedPlan: true,
          pendingCount: 1,
          acceptedCount: 10,
        }
      },
      loading: false,
      error: undefined,
    };

    // Override mock for this test
    mockUseQuery.mockImplementation((document) => {
      if (document === PlanDocument) {
        return planQueryReturn;
      }

      if (document === RelatedWorksByProjectStatsDocument) {
        return relatedWorksStatsQueryReturn;
      }

      return {
        data: null,
        loading: false,
        error: undefined,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });

    render(<ProjectOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('relatedWorks.pendingCount')).toBeInTheDocument();
      expect(screen.getByText('relatedWorks.acceptedCount')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'relatedWorks.edit' })).toBeInTheDocument();
    });
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(<ProjectOverviewPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Read-only mode', () => {
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();

    const mockUseParams = useParams as jest.Mock;
    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ projectId: '123' });
  })

  const readOnlyProjectData = {
    ...mockProjectData,
    readOnly: true,
    collaborators: [{
      user: { id: 'default-user-id' },
      accessLevel: 'COMMENT'
    }],
  };

  beforeEach(() => {
    setupMocks(null, readOnlyProjectData);
  });

  it('should render disabled Upload and Create New buttons when isReadOnly', () => {
    render(<ProjectOverviewPage />);

    const uploadButton = screen.getByRole('button', { name: 'upload' });
    const createNewButton = screen.getByRole('button', { name: 'createNew' });

    expect(uploadButton).toHaveAttribute('aria-disabled', 'true');
    expect(uploadButton).toHaveClass('disabled-button-look');
    expect(createNewButton).toHaveAttribute('aria-disabled', 'true');
    expect(createNewButton).toHaveClass('disabled-button-look');
  });

  it('should show popover message when disabled Upload button is clicked', async () => {
    render(<ProjectOverviewPage />);

    fireEvent.click(screen.getByRole('button', { name: 'upload' }));

    await waitFor(() => {
      expect(screen.getByText('messages.readOnlyLinkMessage')).toBeInTheDocument();
    });
  });

  it('should show popover message when disabled Create New button is clicked', async () => {
    render(<ProjectOverviewPage />);

    fireEvent.click(screen.getByRole('button', { name: 'createNew' }));

    await waitFor(() => {
      expect(screen.getByText('messages.readOnlyLinkMessage')).toBeInTheDocument();
    });
  });

  it('should show "view" on the plan card action when isReadOnly and user is not an edit collaborator', () => {
    // beforeEach already sets a default-user-id that isn't in collaborators
    render(<ProjectOverviewPage />);

    const planActionLink = screen.getByRole('link', { name: 'updatePlan' });
    expect(planActionLink).toHaveTextContent('view');
  });

  it('should show "update" on the plan card action when isReadOnly but user has EDIT collaborator access', async () => {
    setupMocks(
      { me: { id: 'default-user-id' } },
      {
        ...readOnlyProjectData,
        collaborators: [{ user: { id: 'default-user-id' }, accessLevel: 'EDIT' }],
      }
    );

    render(<ProjectOverviewPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'updatePlan' })).toHaveTextContent('update');
    });
  });

  it('should render active Upload and Create New links when isReadOnly is false', () => {
    // Override back to non-readonly project
    setupMocks();

    render(<ProjectOverviewPage />);

    expect(screen.getByRole('link', { name: 'uploadPlan' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'createNewPlan' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'upload' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'createNew' })).not.toBeInTheDocument();
  });
});


