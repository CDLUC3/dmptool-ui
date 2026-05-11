import React, { ReactNode } from 'react';
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useParams, useRouter } from 'next/navigation';
import { RichTranslationValues } from 'next-intl';
import { cookies } from "next/headers";
import {
  publishPlanAction,
  updatePlanStatusAction,
  updatePlanTitleAction
} from '../actions';
import {
  PlanDocument,
  PlanFeedbackStatusDocument,
  RelatedWorksByPlanStatsDocument,
  MeDocument,
  UserRole,
} from '@/generated/graphql';
import { useToast } from '@/context/ToastContext';

// --- Apollo Client Mocks ---
let mockUseMutation: jest.Mock;
const mockUseQuery = jest.fn();

jest.mock('@apollo/client/react', () => {
  return {
    ...jest.requireActual('@apollo/client/react'),
    /* eslint-disable @typescript-eslint/no-explicit-any */
    useQuery: (...args: any[]) => mockUseQuery(...args),
    /* eslint-disable @typescript-eslint/no-explicit-any */
    useMutation: (...args: any[]) => mockUseMutation(...args),
  };
});

jest.mock('../actions/index', () => ({
  publishPlanAction: jest.fn(),
  updatePlanStatusAction: jest.fn(),
  updatePlanTitleAction: jest.fn(),
}));

type MockUseTranslations = {
  (key: string, ...args: unknown[]): string;
  rich: (key: string, values?: RichTranslationValues) => ReactNode;
};


// Mock useFormatter from next-intl
jest.mock('next-intl', () => ({
  useFormatter: jest.fn(() => ({
    dateTime: jest.fn(() => '01-01-2023'),
  })),
  useTranslations: jest.fn(() => {
    const mockUseTranslations: MockUseTranslations = ((key: string) => key) as MockUseTranslations;

    mockUseTranslations.rich = (key, values) => {
      const p = values?.p;
      if (typeof p === 'function') {
        return p(key); // Can return JSX
      }
      return key; // fallback
    };

    return mockUseTranslations;
  }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode;[key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));


// Mock the graphql hooks
jest.mock("@/generated/graphql", () => ({
  ...jest.requireActual("@/generated/graphql"),
  PlanStatus: {
    Archived: 'ARCHIVED',
    Complete: 'COMPLETE',
    Draft: 'DRAFT',
  },
  PlanVisibility: {
    Public: 'PUBLIC',
    Private: 'PRIVATE',
    Organizational: 'ORGANIZATIONAL',
  },
}));

import {
  mockScrollIntoView,
  mockScrollTo
} from "@/__mocks__/common";
import PlanOverviewPage from "../page";
import { mockPlanData } from "../__mocks__/planQueryMock";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));


jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn()
}));

const mockRouter = {
  push: jest.fn(),
};

const mockToast = {
  add: jest.fn(),
};

expect.extend(toHaveNoViolations);

const setupMocks = (meData = null) => {
  // Create references OUTSIDE mockImplementation to prevent maximum update depth exceeded error
  const planQueryReturn = {
    data: {
      plan: {
        ...mockPlanData.plan,
        project: {
          collaborators: [
            {
              accessLevel: 'PRIMARY',
              user: { id: 1 }, // matches default me.id above
            },
          ],
        },
      },
    },
    loading: false,
    error: null,
    refetch: jest.fn(),
  };


  const feedbackQueryReturn = {
    data: null,
    loading: false,
    error: undefined,
  };

  const meQueryReturn = {
    data: meData ?? {
      me: {
        id: 1,
        affiliation: { uri: 'mock-org-id' },
        role: UserRole.Admin,
      }
    },
    loading: false,
    error: null,
    refetch: jest.fn(),
  };

  const relatedWorksStatsQueryReturn = {
    data: {
      relatedWorksByPlanStats: {
        pendingCount: 1,
        acceptedCount: 10,
      }
    },
    loading: false,
    error: undefined,
    refetch: jest.fn(),
  };

  // Mock useQuery to return different data based on which document is queried
  mockUseQuery.mockImplementation((document) => {
    if (document === PlanDocument) {
      return planQueryReturn;
    }

    if (document === PlanFeedbackStatusDocument) {
      return feedbackQueryReturn;
    }

    if (document === RelatedWorksByPlanStatsDocument) {
      return relatedWorksStatsQueryReturn;
    }

    if (document === MeDocument) {
      return meQueryReturn;
    }

    return {
      data: null,
      loading: false,
      error: undefined,
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } as any;
  });
};

const adminMe = {
  me: {
    affiliation: { uri: 'mock-org-id' },
    role: UserRole.Admin,
  },
};

describe('PlanOverviewPage', () => {

  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();

    const mockUseParams = useParams as jest.Mock;
    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ projectId: 1, dmpid: 1 });

    // Mock Toast
    (useToast as jest.Mock).mockReturnValue(mockToast);

    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Default useMutation mock returns a no-op function and empty object
    mockUseMutation = jest.fn(() => [jest.fn(), {}]);
    // Reset useQuery mock
    mockUseQuery.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  it('should render NotificationHeader when planFeedbackStatus.status is REQUESTED', async () => {
    const planQueryReturn = {
      data: {
        plan: {
          ...mockPlanData.plan,
          feedbackStatus: { status: 'REQUESTED' },
          planCreator: { ...mockPlanData.plan?.planCreator, affiliation: { uri: 'mock-org-id' } },
        },
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };
    const feedbackQueryReturn = {
      data: { planFeedbackStatus: { status: 'REQUESTED', id: 123 } },
      loading: false,
      error: undefined,
    };
    const meQueryReturn = {
      data: adminMe,
      loading: false,
      error: null,
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === PlanDocument) return planQueryReturn;
      if (document === PlanFeedbackStatusDocument) return feedbackQueryReturn;
      if (document === MeDocument) return meQueryReturn;
      return { data: null, loading: false, error: undefined } as any;
    });

    render(<PlanOverviewPage />);
    await waitFor(() => {
      expect(screen.getByText('feedbackNotification.title')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'feedbackNotification.markAsDone' })).toBeInTheDocument();
    });
  });


  it('should call completeFeedbackMutation and show toast when mark as done is confirmed', async () => {
    const planQueryReturn = {
      data: {
        plan: {
          ...mockPlanData.plan,
          feedbackStatus: { status: 'REQUESTED' },
          planCreator: { ...mockPlanData.plan?.planCreator, affiliation: { uri: 'mock-org-id' } },
        },
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };
    const mockRefetchFeedbackStatus = jest.fn().mockResolvedValue({});
    const feedbackQueryReturn = {
      data: { planFeedbackStatus: { status: 'REQUESTED', id: 123 } },
      loading: false,
      error: undefined,
      refetch: mockRefetchFeedbackStatus,
    };
    const meQueryReturn = {
      data: adminMe,
      loading: false,
      error: null,
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === PlanDocument) return planQueryReturn;
      if (document === PlanFeedbackStatusDocument) return feedbackQueryReturn;
      if (document === MeDocument) return meQueryReturn;
      return { data: null, loading: false, error: undefined } as any;
    });

    const mockCompleteFeedback = jest.fn().mockResolvedValue({});
    mockUseMutation = jest.fn(() => [mockCompleteFeedback, {}]);

    render(<PlanOverviewPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'feedbackNotification.markAsDone' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'feedbackNotification.markAsDone' }));

    const confirmButton = await screen.findByRole('button', { name: 'feedbackNotification.markAsDone' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockCompleteFeedback).toHaveBeenCalled();
      expect(mockRefetchFeedbackStatus).toHaveBeenCalled();
      expect(mockToast.add).toHaveBeenCalledWith('feedbackNotification.markAsDoneSuccess', { type: 'success' });
    });
  });

  it('should render loading state', () => {
    // Override mock for this test
    mockUseQuery.mockImplementation((document) => {
      if (document === PlanDocument) {
        return {
          data: null,
          loading: true,
          error: undefined,
          refetch: jest.fn(),
          /* eslint-disable @typescript-eslint/no-explicit-any */
        } as any;
      }

      if (document === PlanFeedbackStatusDocument) {
        return {
          data: null,
          loading: false,
          error: undefined,
          /* eslint-disable @typescript-eslint/no-explicit-any */
        } as any;
      }

      return {
        data: null,
        loading: true,
        error: undefined,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });

    render(<PlanOverviewPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render error state', () => {
    // Create error object outside so it has stable reference
    const mockError = { message: 'Error loading plan' };

    // Override mock for this test
    mockUseQuery.mockImplementation((document) => {
      if (document === PlanDocument) {
        return {
          data: null,
          loading: false,
          error: mockError,
          refetch: jest.fn(),
          /* eslint-disable @typescript-eslint/no-explicit-any */
        } as any;
      }

      if (document === PlanFeedbackStatusDocument) {
        return {
          data: null,
          loading: false,
          error: undefined,
          /* eslint-disable @typescript-eslint/no-explicit-any */
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });

    render(<PlanOverviewPage />);

    // Wait for error to appear since it's set via useEffect
    expect(screen.getByText(/Error loading plan/i)).toBeInTheDocument();
  });

  it('should render plan data', async () => {
    render(<PlanOverviewPage />);

    expect(screen.getByRole('heading', { name: 'Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations' })).toBeInTheDocument();
    expect(screen.getByText('National Science Foundation (nsf.gov), Irish Research Council (research.ie)')).toBeInTheDocument();
    expect(screen.getByText('description - version: v2, published: 01-01-2023')).toBeInTheDocument();
    expect(screen.getByText('members.title')).toBeInTheDocument();
    expect(screen.getByText('members.info')).toBeInTheDocument();
    expect(screen.getByText('members.edit')).toBeInTheDocument();
    expect(screen.getByText('relatedWorks.title')).toBeInTheDocument();
    expect(screen.getByText('relatedWorks.publish')).toBeInTheDocument();

    // Check that sections rendered
    expect(screen.getByRole('heading', { name: 'Roles & Responsibilities' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Metadata' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sharing/Copyright Issues' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Long Term Storage' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Research Products' })).toBeInTheDocument();

    // // Check sidebar items
    const sidebar = screen.getByTestId('sidebar-panel');
    expect(sidebar).toBeInTheDocument();
    expect(within(sidebar).getByRole('link', { name: 'buttons.preview' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: 'buttons.publish' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('heading', { name: 'status.feedback.title' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('link', { name: 'links.request' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('heading', { name: 'status.title' })).toBeInTheDocument();
    expect(within(sidebar).getByText('Draft')).toBeInTheDocument();
    expect(within(sidebar).getByText('buttons.linkUpdate')).toBeInTheDocument();
    expect(within(sidebar).getByRole('heading', { name: 'status.publish.title' })).toBeInTheDocument();
    expect(within(sidebar).getByText('status.publish.label')).toBeInTheDocument();
    expect(within(sidebar).getByRole('heading', { name: 'status.download.title' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('link', { name: 'download' })).toBeInTheDocument();
  });

  it('should function as expected if plan data is missing id, dmpId, registered, title, and status', async () => {
    const updatedMockPlanData = {
      ...mockPlanData.plan,
      id: null,
      dmpId: null,
      registered: null,
      title: null,
      status: null
    };

    // Create references OUTSIDE mockImplementation to prevent maximum update depth exceeded error
    const planQueryReturn = {
      data: { plan: updatedMockPlanData },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const feedbackQueryReturn = {
      data: null,
      loading: false,
      error: undefined,
    };

    // Override mock for this test
    mockUseQuery.mockImplementation((document) => {
      if (document === PlanDocument) {
        return planQueryReturn;
      }

      if (document === PlanFeedbackStatusDocument) {
        return feedbackQueryReturn;
      }

      return {
        data: null,
        loading: false,
        error: undefined,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });

    render(<PlanOverviewPage />);

    expect(screen.queryByRole('heading', { name: 'Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations' })).not.toBeInTheDocument();
    expect(screen.getByText('National Science Foundation (nsf.gov), Irish Research Council (research.ie)')).toBeInTheDocument();
    expect(screen.getByText('members.title')).toBeInTheDocument();
    expect(screen.getByText('members.info')).toBeInTheDocument();
    expect(screen.getByText('members.edit')).toBeInTheDocument();
    expect(screen.getByText('relatedWorks.title')).toBeInTheDocument();
    expect(screen.getByText('relatedWorks.publish')).toBeInTheDocument();

    // Check that sections rendered
    expect(screen.getByRole('heading', { name: 'Roles & Responsibilities' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Metadata' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sharing/Copyright Issues' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Long Term Storage' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Research Products' })).toBeInTheDocument();

    // Check sidebar items
    const sidebar = screen.getByTestId('sidebar-panel');
    expect(sidebar).toBeInTheDocument();
    expect(within(sidebar).queryByRole('link', { name: 'buttons.preview' })).not.toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: 'buttons.publish' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('heading', { name: 'status.feedback.title' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: 'links.request' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('heading', { name: 'status.title' })).toBeInTheDocument();
    expect(within(sidebar).queryByText('Draft')).not.toBeInTheDocument();
    expect(within(sidebar).getByText('buttons.linkUpdate')).toBeInTheDocument();
    expect(within(sidebar).getByRole('heading', { name: 'status.publish.title' })).toBeInTheDocument();
    expect(within(sidebar).getByText('status.publish.label')).toBeInTheDocument();
    expect(within(sidebar).getByRole('heading', { name: 'status.download.title' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('link', { name: 'download' })).toBeInTheDocument();
  });

  it('should display plan status PUBLISHED if \'registered\' prop has a value', async () => {

    const updatedMockPlanData = {
      ...mockPlanData.plan,
      registered: '2023-10-01T00:00:00Z',
    };


    // Create references OUTSIDE mockImplementation to prevent maximum update depth exceeded error
    const planQueryReturn = {
      data: { plan: updatedMockPlanData },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const feedbackQueryReturn = {
      data: null,
      loading: false,
      error: undefined,
    };


    // Override mock for this test
    mockUseQuery.mockImplementation((document) => {
      if (document === PlanDocument) {
        return planQueryReturn;
      }

      if (document === PlanFeedbackStatusDocument) {
        return feedbackQueryReturn;
      }

      return {
        data: null,
        loading: false,
        error: undefined,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });


    render(<PlanOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Published')).toBeInTheDocument();
    });
  });

  it('should display plan status UNPUBLISHED if \'registered\' prop has a value of null', async () => {

    // Create references OUTSIDE mockImplementation to prevent maximum update depth exceeded error
    const planQueryReturn = {
      data: { plan: mockPlanData.plan },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const feedbackQueryReturn = {
      data: null,
      loading: false,
      error: undefined,
    };


    // Override mock for this test
    mockUseQuery.mockImplementation((document) => {
      if (document === PlanDocument) {
        return planQueryReturn;
      }

      if (document === PlanFeedbackStatusDocument) {
        return feedbackQueryReturn;
      }

      return {
        data: null,
        loading: false,
        error: undefined,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });

    render(<PlanOverviewPage />);
    await waitFor(() => {
      expect(screen.getByText('Unpublished')).toBeInTheDocument();
    });
  });

  it('should display related works counts if \'hasPublishedPlan\' prop has a value', async () => {
    const updatedMockPlanData = {
      ...mockPlanData.plan,
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

      if (document === RelatedWorksByPlanStatsDocument) {
        return relatedWorksStatsQueryReturn;
      }

      return {
        data: null,
        loading: false,
        error: undefined,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });


    render(<PlanOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('relatedWorks.pendingCount')).toBeInTheDocument();
      expect(screen.getByText('relatedWorks.acceptedCount')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'relatedWorks.edit' })).toBeInTheDocument();
    });
  });

  it('should not display related works counts for UNPUBLISHED if \'hasPublishedPlan\' prop is false', async () => {
    const updatedMockPlanData = {
      ...mockPlanData.plan,
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
      if (document === PlanDocument) {
        return planQueryReturn;
      }

      if (document === RelatedWorksByPlanStatsDocument) {
        return relatedWorksStatsQueryReturn;
      }

      return {
        data: null,
        loading: false,
        error: undefined,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });


    render(<PlanOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('relatedWorks.publish')).toBeInTheDocument();
      expect(screen.queryByText('relatedWorks.pendingCount')).not.toBeInTheDocument();
      expect(screen.queryByText('relatedWorks.acceptedCount')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'relatedWorks.edit' })).not.toBeInTheDocument();
    });
  });

  it('should display zero percentageAnswered when there are no sections', async () => {

    const mockPlanDataWithNoSections = {
      ...mockPlanData.plan,
      sections: [],
    };

    // Create references OUTSIDE mockImplementation to prevent maximum update depth exceeded error
    const planQueryReturn = {
      data: { plan: mockPlanDataWithNoSections },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const feedbackQueryReturn = {
      data: null,
      loading: false,
      error: undefined,
    };


    // Override mock for this test
    mockUseQuery.mockImplementation((document) => {
      if (document === PlanDocument) {
        return planQueryReturn;
      }

      if (document === PlanFeedbackStatusDocument) {
        return feedbackQueryReturn;
      }

      return {
        data: null,
        loading: false,
        error: undefined,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });


    render(<PlanOverviewPage />);

    // Click the Publish button to open the modal
    const publishButton = screen.getByText(/buttons.publish/i);
    fireEvent.click(publishButton);
    const checklist = screen.getByTestId('checklist');

    await waitFor(() => {
      expect(within(checklist).getByText('publishModal.publish.checklistItem.percentageAnswered')).toBeInTheDocument();
    });
  });

  it('should use \'Start\' for section buttons if no questions in that section have been answered, otherwise it should use \'Update\'', async () => {
    const { container } = render(<PlanOverviewPage />);

    const sectionWithSomeAnswers = container.querySelector('section[aria-labelledby="section-title-8"]') as HTMLElement;
    if (sectionWithSomeAnswers) {
      const button = within(sectionWithSomeAnswers).getByText('sections.update');
      expect(button).toBeInTheDocument();
    }

    const sectionWithNoAnswers = container.querySelector('section[aria-labelledby="section-title-11"]') as HTMLElement;
    if (sectionWithNoAnswers) {
      const button = within(sectionWithNoAnswers).getByText('sections.start');
      expect(button).toBeInTheDocument();
    }
  });

  it('should open and close modal', async () => {
    render(<PlanOverviewPage />);
    const publishButton = screen.getByText(/buttons.publish/i);
    fireEvent.click(publishButton);

    expect(screen.getByTestId('modal')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  it('should have correct info in first page of Publish modal', async () => {
    render(<PlanOverviewPage />);

    // Click the Publish button to open the modal
    const publishButton = screen.getByText(/buttons.publish/i);
    fireEvent.click(publishButton);

    await waitFor(() => {
      const checklist = screen.getByTestId('checklist');
      expect(checklist).toBeInTheDocument();
      expect(within(checklist).getByText('publishModal.publish.checklistItem.primaryContact')).toBeInTheDocument();
      const linkPrimaryContact = within(checklist).getByRole('link', { name: 'Captain Nemo' });
      expect(linkPrimaryContact).toBeInTheDocument();
      expect(within(checklist).getByText(/publishModal\.publish\.checklistItem\.fundingText\s*\(/i)).toBeInTheDocument();
      const linkFunding = within(checklist).getByRole('link', { name: 'publishModal.publish.checklistItem.funding' });
      expect(linkFunding).toBeInTheDocument();
      expect(within(checklist).getByText('publishModal.publish.checklistItem.orcidText')).toBeInTheDocument();
      const linkOrcid = within(checklist).getByRole('link', { name: 'publishModal.publish.checklistItem.projectMembers' });
      expect(linkOrcid).toBeInTheDocument();
      expect(within(checklist).getByText('publishModal.publish.checklistItem.complete')).toBeInTheDocument();
      expect(within(checklist).getByText('publishModal.publish.checklistItem.percentageAnswered')).toBeInTheDocument();
      expect(within(checklist).getByText('publishModal.publish.checklistItem.requiredFields')).toBeInTheDocument();
      const requiredFields = screen.getByText((content) =>
        content.includes('3') && content.includes('publishModal.publish.checklistInfo')
      );
      expect(requiredFields).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'buttons.close' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'publishModal.publish.buttonNext >' })).toBeInTheDocument();
    });
  });

  it('should have correct info in second page of Publish modal', async () => {
    render(<PlanOverviewPage />);

    // Click the Publish button to open the modal
    const publishButton = screen.getByText(/buttons.publish/i);
    fireEvent.click(publishButton);

    const nextButton = screen.getByRole('button', { name: 'publishModal.publish.buttonNext >' });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'publishModal.publish.visibilityTitle' })).toBeInTheDocument();
      expect(screen.getByText('publishModal.publish.visibilityDescription')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'publishModal.publish.visibilityOptionsTitle' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /private/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /public/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /organization/i })).toBeInTheDocument();
      expect(screen.getByText('publishModal.publish.visibilityOptions.public.label')).toBeInTheDocument();
      expect(screen.getByText('publishModal.publish.visibilityOptions.public.description')).toBeInTheDocument();
      expect(screen.getByText('publishModal.publish.visibilityOptions.organization.label')).toBeInTheDocument();
      expect(screen.getByText('publishModal.publish.visibilityOptions.organization.description')).toBeInTheDocument();
      expect(screen.getByText('publishModal.publish.visibilityOptions.private.label')).toBeInTheDocument();
      expect(screen.getByText('publishModal.publish.visibilityOptions.private.description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'buttons.close' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'publishModal.publish.title' })).toBeInTheDocument();
    });
  });

  it('should set correct visibility radio button value when clicked ', async () => {
    render(<PlanOverviewPage />);

    // Click the Publish button to open the modal
    const publishButton = screen.getByText(/buttons.publish/i);
    fireEvent.click(publishButton);

    const nextButton = screen.getByRole('button', { name: 'publishModal.publish.buttonNext >' });
    fireEvent.click(nextButton);

    await waitFor(() => {
      const privateRadio = screen.getByRole('radio', { name: /private/i });
      const publicRadio = screen.getByRole('radio', { name: /public/i });
      const organizationalRadio = screen.getByRole('radio', { name: /organization/i });

      // Check initial state (none selected by default)
      expect(privateRadio).not.toBeChecked();
      expect(publicRadio).toBeChecked();
      expect(organizationalRadio).not.toBeChecked();

      // Select the "Public" radio button
      fireEvent.click(publicRadio);
      expect(publicRadio).toBeChecked();
      expect(privateRadio).not.toBeChecked();
      expect(organizationalRadio).not.toBeChecked();

      // Select the "Private" radio button
      fireEvent.click(privateRadio);
      expect(privateRadio).toBeChecked();
      expect(publicRadio).not.toBeChecked();
      expect(organizationalRadio).not.toBeChecked();
    });
  });

  it('should call publishPlanAction mutation with correct info when user clicks Publish button', async () => {
    // Mock the cookies function
    const mockCookies = {
      toString: jest.fn().mockReturnValue("mockedCookie=value"),
    };
    (cookies as jest.Mock).mockReturnValue(mockCookies);


    (publishPlanAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: null,
          status: null,
          visibility: null
        },
        visibility: 'PUBLIC',
        status: 'COMPLETE'
      },
    });

    render(<PlanOverviewPage />);

    // Click the Publish button to open the modal
    const publishButton = screen.getByText(/buttons.publish/i);
    fireEvent.click(publishButton);

    const nextButton = screen.getByRole('button', { name: 'publishModal.publish.buttonNext >' });
    fireEvent.click(nextButton);

    // Select the visibility option
    const publicRadio = screen.getByRole('radio', { name: /public/i });
    fireEvent.click(publicRadio);

    // Click the Publish button in the modal
    const publishPlanButton = screen.getByRole('button', { name: 'publishModal.publish.title' });
    fireEvent.click(publishPlanButton);

    await waitFor(() => {
      expect(publishPlanAction).toHaveBeenCalledWith({
        planId: expect.any(Number),
        visibility: "PUBLIC",
      });
    });
    expect(mockToast.add).toHaveBeenCalledWith('messages.success.successfullyPublished', { type: 'success' });
  });

  it('should display error when publishPlanAction mutation returns field-level errors', async () => {
    // Mock the cookies function
    const mockCookies = {
      toString: jest.fn().mockReturnValue("mockedCookie=value"),
    };
    (cookies as jest.Mock).mockReturnValue(mockCookies);


    (publishPlanAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: 'There was a problem publishing the plan',
          status: null,
          visibility: null
        },
        visibility: 'PUBLIC',
        status: 'COMPLETE'
      },
    });

    render(<PlanOverviewPage />);

    // Click the Publish button to open the modal
    const publishButton = screen.getByText(/buttons.publish/i);
    fireEvent.click(publishButton);

    const nextButton = screen.getByRole('button', { name: 'publishModal.publish.buttonNext >' });
    fireEvent.click(nextButton);

    // Select the visibility option
    const publicRadio = screen.getByRole('radio', { name: /public/i });
    fireEvent.click(publicRadio);

    // Click the Publish button in the modal
    const publishPlanButton = screen.getByRole('button', { name: 'publishModal.publish.title' });
    fireEvent.click(publishPlanButton);

    await waitFor(() => {
      expect(publishPlanAction).toHaveBeenCalledWith({
        planId: expect.any(Number),
        visibility: "PUBLIC",
      });
      expect(screen.getByText('There was a problem publishing the plan')).toBeInTheDocument();
    });

  });

  it('should redirect if publishPlanAction mutation returns a redirect prop in its response', async () => {
    // Mock the cookies function
    const mockCookies = {
      toString: jest.fn().mockReturnValue("mockedCookie=value"),
    };
    (cookies as jest.Mock).mockReturnValue(mockCookies);


    (publishPlanAction as jest.Mock).mockResolvedValue({
      success: false,
      redirect: '/login',
    });

    render(<PlanOverviewPage />);

    // Click the Publish button to open the modal
    const publishButton = screen.getByText("buttons.publish");
    fireEvent.click(publishButton);

    const nextButton = screen.getByRole('button', { name: 'publishModal.publish.buttonNext >' });
    fireEvent.click(nextButton);

    // Select the visibility option
    const publicRadio = screen.getByRole('radio', { name: /public/i });
    fireEvent.click(publicRadio);

    // Click the Publish button in the modal
    const publishPlanButton = screen.getByRole('button', { name: 'publishModal.publish.title' });
    fireEvent.click(publishPlanButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  it('should call updatePlanStatusAction mutation with correct info when user changes', async () => {
    // Mock the cookies function
    const mockCookies = {
      toString: jest.fn().mockReturnValue("mockedCookie=value"),
    };
    (cookies as jest.Mock).mockReturnValue(mockCookies);

    (updatePlanStatusAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: null,
          status: null
        },
        id: 6,
        status: 'COMPLETE',
        visibility: 'PRIVATE',
      },
    });

    render(<PlanOverviewPage />);

    // First check that inital Plan Status is DRAFT
    expect(screen.getByText('Draft')).toBeInTheDocument();

    // Click the Update link next to Plan Status to reveal the select dropdown
    const updateLink = screen.getByTestId('updateLink');
    await act(async () => {
      fireEvent.click(updateLink);
    });

    // Find the dropdown button using its aria-label
    const dropdownButton = screen.getByRole('button', { name: /draft/i });
    await act(async () => {
      fireEvent.click(dropdownButton);
    });

    // Find the dropdown container (role="listbox")
    const listbox = screen.getByRole('listbox');

    // Find the "Complete" option (role="option") within the listbox
    const option = within(listbox).getByRole('option', { name: /Complete/i });

    // Click the "Complete" option
    await act(async () => {
      fireEvent.click(option);
    });

    const saveButton = screen.getByRole('button', { name: /buttons.save/i });

    // Click the save button
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(updatePlanStatusAction).toHaveBeenCalledWith({
        planId: expect.any(Number),
        status: "COMPLETE",
      });
      expect(mockToast.add).toHaveBeenCalledWith('messages.success.successfullyUpdatedStatus', { type: 'success' });

    });
  });

  it('should redirect if updatePlanStatusAction returns a redirect in response', async () => {
    (updatePlanStatusAction as jest.Mock).mockResolvedValue({
      success: false,
      redirect: '/login'
    });

    render(<PlanOverviewPage />);

    // First check that inital Plan Status is DRAFT
    expect(screen.getByText('Draft')).toBeInTheDocument();

    // Click the Update link next to Plan Status to reveal the select dropdown
    const updateLink = screen.getByTestId('updateLink');
    await act(async () => {
      fireEvent.click(updateLink);
    });

    // Find the dropdown button using its aria-label
    const dropdownButton = screen.getByRole('button', { name: /draft/i });
    await act(async () => {
      fireEvent.click(dropdownButton);
    });

    // Find the dropdown container (role="listbox")
    const listbox = screen.getByRole('listbox');

    // Find the "Complete" option (role="option") within the listbox
    const option = within(listbox).getByRole('option', { name: /Complete/i });

    // Click the "Complete" option
    await act(async () => {
      fireEvent.click(option);
    });

    const saveButton = screen.getByRole('button', { name: /buttons.save/i });

    // Click the save button
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  it('should display error message when updatePlanStatusAction mutation is not successful', async () => {
    // Mock the cookies function
    const mockCookies = {
      toString: jest.fn().mockReturnValue("mockedCookie=value"),
    };
    (cookies as jest.Mock).mockReturnValue(mockCookies);


    (updatePlanStatusAction as jest.Mock).mockResolvedValue({
      success: false,
      errors: ['There was a problem connecting to the server. Please try again.'],
    });

    render(<PlanOverviewPage />);

    // First check that inital Plan Status is DRAFT
    expect(screen.getByText('Draft')).toBeInTheDocument();

    // Click the Update link next to Plan Status to reveal the select dropdown
    const updateLink = screen.getByTestId('updateLink');
    await act(async () => {
      fireEvent.click(updateLink);
    });

    // Find the dropdown button using its aria-label
    const dropdownButton = screen.getByRole('button', { name: /draft/i });
    await act(async () => {
      fireEvent.click(dropdownButton);
    });

    // Find the dropdown container (role="listbox")
    const listbox = screen.getByRole('listbox');

    // Find the "Complete" option (role="option") within the listbox
    const option = within(listbox).getByRole('option', { name: /Complete/i });

    // Click the "Complete" option
    await act(async () => {
      fireEvent.click(option);
    });

    const saveButton = screen.getByRole('button', { name: /buttons.save/i });

    // Click the save button
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText('There was a problem connecting to the server. Please try again.')).toBeInTheDocument();
    });
  });

  it('should set general error message when call updatePlanStatus mutation is successful and returns a general error', async () => {
    // Mock the cookies function
    const mockCookies = {
      toString: jest.fn().mockReturnValue("mockedCookie=value"),
    };
    (cookies as jest.Mock).mockReturnValue(mockCookies);


    (updatePlanStatusAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: 'There was a problem updating the plan status.',
          status: null
        },
        id: 6,
        status: 'COMPLETE',
        visibility: 'PRIVATE',
      },
    });

    render(<PlanOverviewPage />);

    // First check that inital Plan Status is DRAFT
    expect(screen.getByText('Draft')).toBeInTheDocument();

    // Click the Update link next to Plan Status to reveal the select dropdown
    const updateLink = screen.getByTestId('updateLink');
    await act(async () => {
      fireEvent.click(updateLink);
    });

    // Find the dropdown button using its aria-label
    const dropdownButton = screen.getByRole('button', { name: /draft/i });
    await act(async () => {
      fireEvent.click(dropdownButton);
    });

    // Find the dropdown container (role="listbox")
    const listbox = screen.getByRole('listbox');

    // Find the "Complete" option (role="option") within the listbox
    const option = within(listbox).getByRole('option', { name: /Complete/i });

    // Click the "Complete" option
    await act(async () => {
      fireEvent.click(option);
    });

    const saveButton = screen.getByRole('button', { name: /buttons.save/i });

    // Click the save button
    await act(async () => {
      fireEvent.click(saveButton);
    });


    await waitFor(() => {
      expect(screen.getByText('There was a problem updating the plan status.')).toBeInTheDocument();
    });
  });

  it('should set error message when call updatePlanStatus mutation is successful and returns an error that is not general', async () => {
    // Mock the cookies function
    const mockCookies = {
      toString: jest.fn().mockReturnValue("mockedCookie=value"),
    };
    (cookies as jest.Mock).mockReturnValue(mockCookies);


    (updatePlanStatusAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: null,
          status: 'Status cannot be updated to COMPLETE.',
        },
        id: 6,
        status: 'COMPLETE',
        visibility: 'PRIVATE',
      },
    });

    render(<PlanOverviewPage />);

    // First check that inital Plan Status is DRAFT
    expect(screen.getByText('Draft')).toBeInTheDocument();

    // Click the Update link next to Plan Status to reveal the select dropdown
    const updateLink = screen.getByTestId('updateLink');
    await act(async () => {
      fireEvent.click(updateLink);
    });

    // Find the dropdown button using its aria-label
    const dropdownButton = screen.getByRole('button', { name: /draft/i });
    await act(async () => {
      fireEvent.click(dropdownButton);
    });

    // Find the dropdown container (role="listbox")
    const listbox = screen.getByRole('listbox');

    // Find the "Complete" option (role="option") within the listbox
    const option = within(listbox).getByRole('option', { name: /Complete/i });

    // Click the "Complete" option
    await act(async () => {
      fireEvent.click(option);
    });

    const saveButton = screen.getByRole('button', { name: /buttons.save/i });

    // Click the save button
    await act(async () => {
      fireEvent.click(saveButton);
    });


    await waitFor(() => {
      expect(screen.getByText('Status cannot be updated to COMPLETE.')).toBeInTheDocument();
    });
  });

  it('should call updatePlanTitleAction when user enters a new title and clicks save', async () => {

    (updatePlanTitleAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: null,
          email: null,
        },
        id: 1,
        title: 'Changed title',
      },
    });

    render(<PlanOverviewPage />);

    const editButton = screen.getByRole('button', { name: 'links.editTitle' });

    await act(async () => {
      fireEvent.click(editButton);
    })

    const input = screen.getByPlaceholderText('page.planTitlePlaceholder');
    fireEvent.change(input, { target: { value: 'New plan title' } });

    const saveButton = screen.getByTestId('save-button');
    await act(async () => {
      fireEvent.click(saveButton);
    })

    // Wait for the updatePlanTitleAction to be called
    await waitFor(() => {
      expect(updatePlanTitleAction).toHaveBeenCalledWith({
        planId: 1,
        title: 'New plan title',
      });
    });
  });

  it('should set errors when handleTitleChange is called and returns a general error', async () => {

    (updatePlanTitleAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: 'There was an error changing title',
          email: null,
        },
        id: 15,
        title: 'Changed title',
      },
    });


    render(<PlanOverviewPage />);

    const editButton = screen.getByRole('button', { name: 'links.editTitle' });

    await act(async () => {
      fireEvent.click(editButton);
    })

    const input = screen.getByPlaceholderText('page.planTitlePlaceholder');
    fireEvent.change(input, { target: { value: 'New plan title' } });

    const saveButton = screen.getByTestId('save-button');
    await act(async () => {
      fireEvent.click(saveButton);
    })

    expect(screen.getByText('There was an error changing title')).toBeInTheDocument();
  });

  it('should include correct link href for Preview button', async () => {
    const updatedMockPlanData = {
      ...mockPlanData.plan,
      id: null,
      dmpId: "https://doi.org/10.2312/123",
      registered: null,
      title: null,
      status: null
    };

    // Create references OUTSIDE mockImplementation to prevent maximum update depth exceeded error
    const planQueryReturn = {
      data: { plan: updatedMockPlanData },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const feedbackQueryReturn = {
      data: null,
      loading: false,
      error: undefined,
    };


    // Override mock for this test
    mockUseQuery.mockImplementation((document) => {
      if (document === PlanDocument) {
        return planQueryReturn;
      }

      if (document === PlanFeedbackStatusDocument) {
        return feedbackQueryReturn;
      }

      return {
        data: null,
        loading: false,
        error: undefined,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });

    render(<PlanOverviewPage />);

    // Check sidebar items
    const sidebar = screen.getByTestId('sidebar-panel');
    expect(sidebar).toBeInTheDocument();
    const previewLink = within(sidebar).getByRole('link', { name: 'buttons.preview' });
    expect(previewLink).toBeInTheDocument();
    expect(previewLink).toHaveAttribute('href', 'http://localhost:3030/dmps/10.2312/123/narrative.html?includeCoverSheet=false&includeResearchOutputs=false&includeRelatedWorks=false');
  });

  it('should include correct link href for Preview button when DOI is not in a common format', async () => {
    const updatedMockPlanData = {
      ...mockPlanData.plan,
      id: null,
      dmpId: "doi:10.1234/abcd",
      registered: null,
      title: null,
      status: null
    };

    // Create references OUTSIDE mockImplementation to prevent maximum update depth exceeded error
    const planQueryReturn = {
      data: { plan: updatedMockPlanData },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const feedbackQueryReturn = {
      data: null,
      loading: false,
      error: undefined,
    };


    // Override mock for this test
    mockUseQuery.mockImplementation((document) => {
      if (document === PlanDocument) {
        return planQueryReturn;
      }

      if (document === PlanFeedbackStatusDocument) {
        return feedbackQueryReturn;
      }

      return {
        data: null,
        loading: false,
        error: undefined,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });

    render(<PlanOverviewPage />);

    // Check sidebar items
    const sidebar = screen.getByTestId('sidebar-panel');
    expect(sidebar).toBeInTheDocument();
    const previewLink = within(sidebar).getByRole('link', { name: 'buttons.preview' });
    expect(previewLink).toBeInTheDocument();
    expect(previewLink).toHaveAttribute('href', 'http://localhost:3030/dmps/10.1234/abcd/narrative.html?includeCoverSheet=false&includeResearchOutputs=false&includeRelatedWorks=false');
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(<PlanOverviewPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should display 'No feedback' when planFeedbackStatus is NONE", async () => {
    // Create references OUTSIDE mockImplementation to prevent maximum update depth exceeded error
    const planQueryReturn = {
      data: { plan: mockPlanData },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const feedbackQueryReturn = {
      data: { planFeedbackStatus: { status: 'NONE', id: 1 } },
      loading: false,
      error: undefined,
    };


    // Override mock for this test
    mockUseQuery.mockImplementation((document) => {
      if (document === PlanDocument) {
        return planQueryReturn;
      }

      if (document === PlanFeedbackStatusDocument) {
        return feedbackQueryReturn;
      }

      return {
        data: null,
        loading: false,
        error: undefined,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });

    render(<PlanOverviewPage />);

    const sidebar = screen.getByTestId('sidebar-panel');
    await waitFor(() => {
      // translations are mocked, so we check for the translation key
      expect(within(sidebar).getByText('status.feedback.none')).toBeInTheDocument();
    });
  });

  it("should display 'Feedback requested' when planFeedbackStatus is REQUEST", async () => {

    // Create references OUTSIDE mockImplementation to prevent maximum update depth exceeded error
    const planQueryReturn = {
      data: { plan: mockPlanData },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const feedbackQueryReturn = {
      data: { planFeedbackStatus: { status: 'REQUEST', id: 2 } },
      loading: false,
      error: undefined,
    };


    // Override mock for this test
    mockUseQuery.mockImplementation((document) => {
      if (document === PlanDocument) {
        return planQueryReturn;
      }

      if (document === PlanFeedbackStatusDocument) {
        return feedbackQueryReturn;
      }

      return {
        data: null,
        loading: false,
        error: undefined,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });

    render(<PlanOverviewPage />);

    const sidebar = screen.getByTestId('sidebar-panel');
    await waitFor(() => {
      // translations are mocked, so we check for the translation key
      expect(within(sidebar).getByText('status.feedback.request')).toBeInTheDocument();
    });
  });

  it("should display 'Feedback received' when planFeedbackStatus is COMPLETE", async () => {

    // Create references OUTSIDE mockImplementation to prevent maximum update depth exceeded error
    const planQueryReturn = {
      data: { plan: mockPlanData },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };

    const feedbackQueryReturn = {
      data: { planFeedbackStatus: { status: 'COMPLETE', id: 3 } },
      loading: false,
      error: undefined,
    };


    // Override mock for this test
    mockUseQuery.mockImplementation((document) => {
      if (document === PlanDocument) {
        return planQueryReturn;
      }

      if (document === PlanFeedbackStatusDocument) {
        return feedbackQueryReturn;
      }

      return {
        data: null,
        loading: false,
        error: undefined,
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    });

    render(<PlanOverviewPage />);

    const sidebar = screen.getByTestId('sidebar-panel');
    await waitFor(() => {
      // translations are mocked, so we check for the translation key
      expect(within(sidebar).getByText('status.feedback.complete')).toBeInTheDocument();
    });
  });

  it('should render feedback as a clickable link when current user is a PRIMARY collaborator', async () => {
    const meId = 42;

    // Create references OUTSIDE mockImplementation
    const planQueryReturn = {
      data: {
        plan: {
          ...mockPlanData.plan,
          project: {
            collaborators: [{ accessLevel: 'PRIMARY', user: { id: meId } }],
          },
        },
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };
    const meQueryReturn = {
      data: { me: { id: meId, affiliation: { uri: 'mock-org-id' }, role: UserRole.Admin } },
      loading: false,
      error: null,
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === PlanDocument) return planQueryReturn;
      if (document === MeDocument) return meQueryReturn;
      return { data: null, loading: false, error: undefined } as any;
    });

    render(<PlanOverviewPage />);

    const sidebar = screen.getByTestId('sidebar-panel');
    await waitFor(() => {
      expect(within(sidebar).getByRole('link', { name: 'links.request' })).toBeInTheDocument();
    });
  });

  it('should render feedback as a disabled button with tooltip when current user is NOT a PRIMARY collaborator', async () => {
    const meId = 99;

    const planQueryReturn = {
      data: {
        plan: {
          ...mockPlanData.plan,
          project: {
            collaborators: [
              { accessLevel: 'OWN', user: { id: meId } },
              { accessLevel: 'PRIMARY', user: { id: 1 } },
            ],
          },
        },
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    };
    const meQueryReturn = {
      data: { me: { id: meId, affiliation: { uri: 'mock-org-id' }, role: UserRole.Admin } },
      loading: false,
      error: null,
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === PlanDocument) return planQueryReturn;
      if (document === MeDocument) return meQueryReturn;
      return { data: null, loading: false, error: undefined } as any;
    });

    render(<PlanOverviewPage />);

    const sidebar = screen.getByTestId('sidebar-panel');

    await waitFor(() => {
      // Link should not be present
      expect(within(sidebar).queryByRole('link', { name: 'links.request' })).not.toBeInTheDocument();

      // Should be a disabled button instead
      const disabledButton = within(sidebar).getByRole('button', { name: 'links.request' });
      expect(disabledButton).toBeInTheDocument();
      expect(disabledButton).toHaveAttribute('aria-disabled', 'true');
    });
  });
});
