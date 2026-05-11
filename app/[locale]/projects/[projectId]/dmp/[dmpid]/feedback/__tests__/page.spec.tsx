import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  MeDocument,
  PlanFeedbackStatusDocument,
  ProjectCollaboratorsDocument,
  RequestFeedbackDocument,
} from '@/generated/graphql';

import ProjectsProjectPlanFeedback from '../page';
import { mockScrollIntoView, mockScrollTo } from '@/__mocks__/common';

expect.extend(toHaveNoViolations);

// Mock Apollo Client
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({
    projectId: 'test-project-id',
    dmpid: '1',
  })),
}));

// Mock PageHeader
jest.mock('@/components/PageHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-page-header" />,
}));

// Mock ExpandableContentSection
jest.mock('@/components/ExpandableContentSection', () => ({
  __esModule: true,
  default: ({ children, heading }: { children: React.ReactNode; heading: string }) => (
    <div data-testid="expandable-section">
      <h3>{heading}</h3>
      {children}
    </div>
  ),
}));

// Mock Loading
jest.mock('@/components/Loading', () => ({
  __esModule: true,
  default: ({ message }: { message: string }) => <div data-testid="loading">{message}</div>,
}));

// Mock SanitizeHTML
jest.mock('@/utils/sanitize', () => ({
  SanitizeHTML: ({ html }: { html: string }) => (
    <div data-testid="sanitize-html" dangerouslySetInnerHTML={{ __html: html }} />
  ),
}));

// Mock routePath
jest.mock('@/utils/routes', () => ({
  routePath: jest.fn((route, params) => `/${route}/${params?.projectId || ''}/${params?.dmpId || ''}`),
}));

// Mock logECS
jest.mock('@/utils/clientLogger', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock useToast
const mockToastAdd = jest.fn();
jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ add: mockToastAdd }),
}));

// Shared mock data
const mockMeData = {
  me: {
    __typename: 'User',
    id: 2,
    givenName: 'Test',
    surName: 'Admin',
    languageId: 'en-US',
    role: 'ADMIN',
    emails: [
      {
        __typename: 'UserEmail',
        id: 2,
        email: 'admin@example.com',
        isPrimary: true,
        isConfirmed: true,
      },
    ],
    errors: {
      __typename: 'UserErrors',
      general: null,
      email: null,
      password: null,
      role: null,
    },
    affiliation: {
      __typename: 'Affiliation',
      id: 1,
      name: 'California Digital Library',
      displayName: 'California Digital Library (cdlib.org)',
      feedbackEmails: ['uc3@cdlib.org'],
      feedbackEnabled: false,
      feedbackMessage: '<p>Dear Test,</p><p>Your plan has been sent for feedback.</p>',
    },
  },
};

const mockRequestFeedbackMutation = jest.fn();

type FeedbackStatusType = string | { status: string; id: number };
const setupMocks = ({
  feedbackStatus = 'NONE',
  meLoading = false,
  feedbackLoading = false,
  collaboratorsLoading = false,
  meError = undefined,
  feedbackError = undefined,
  collaboratorsError = undefined,
  collaborators = [{ accessLevel: 'PRIMARY', user: { id: mockMeData.me.id } }], // default: current user is PRIMARY
}: {
  feedbackStatus?: FeedbackStatusType;
  meLoading?: boolean;
  feedbackLoading?: boolean;
  collaboratorsLoading?: boolean;
  meError?: { message: string };
  feedbackError?: { message: string };
  collaboratorsError?: { message: string };
  collaborators?: { accessLevel: string; user: { id: number } }[];
} = {}) => {
  const meQueryReturn = {
    data: meLoading ? null : { me: mockMeData.me },
    loading: meLoading,
    error: meError,
  };

  const feedbackQueryReturn = {
    data: feedbackLoading ? null : { planFeedbackStatus: feedbackStatus },
    loading: feedbackLoading,
    error: feedbackError,
    refetch: jest.fn().mockResolvedValue({
      data: { planFeedbackStatus: 'REQUESTED' },
    }),
  };

  const collaboratorsQueryReturn = {
    data: collaboratorsLoading ? null : { projectCollaborators: collaborators },
    loading: collaboratorsLoading,
    error: collaboratorsError,
  };


  const defaultQueryReturn: ReturnType<typeof useQuery> = {
    data: null,
    loading: false,
    error: undefined
    /*eslint-disable @typescript-eslint/no-explicit-any */
  } as any;


  mockUseQuery.mockImplementation((document) => {
    if (document === MeDocument) {
      return meQueryReturn as ReturnType<typeof useQuery>;
    }
    if (document === PlanFeedbackStatusDocument) {
      /*eslint-disable @typescript-eslint/no-explicit-any */
      return feedbackQueryReturn as any;
    }

    if (document === ProjectCollaboratorsDocument) {
      return collaboratorsQueryReturn as any;
    }

    return defaultQueryReturn;
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === RequestFeedbackDocument) {
      /*eslint-disable @typescript-eslint/no-explicit-any */

      return [mockRequestFeedbackMutation, { loading: false }] as any;
    }
    /*eslint-disable @typescript-eslint/no-explicit-any */

    return [jest.fn(), { loading: false }] as any;
  });
};

describe('ProjectsProjectPlanFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
  });

  it('should show loading state while queries are in flight', () => {
    setupMocks({ meLoading: true, feedbackLoading: true, collaboratorsLoading: true });
    render(<ProjectsProjectPlanFeedback />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should render the page after data loads', () => {
    render(<ProjectsProjectPlanFeedback />);

    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-page-header')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'form.label' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'form.submitButton' })).toBeInTheDocument();
  });

  it('should display user greeting and affiliation feedback message', () => {
    render(<ProjectsProjectPlanFeedback />);

    expect(screen.getByText('Hello Test')).toBeInTheDocument();
    expect(screen.getByTestId('sanitize-html')).toBeInTheDocument();
  });

  it('should hide form and show success message when feedback already requested', () => {
    setupMocks({ feedbackStatus: { status: 'REQUESTED', id: 1 } });
    render(<ProjectsProjectPlanFeedback />);

    expect(screen.queryByRole('textbox', { name: 'form.label' })).not.toBeInTheDocument();
    expect(screen.getByText('form.successMessage')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'form.submitButton' })).toBeDisabled();
  });

  it('should successfully submit feedback and show success message', async () => {
    mockRequestFeedbackMutation.mockResolvedValue({
      data: {
        requestFeedback: {
          id: 2,
          completed: null,
          completedBy: null,
          messageToOrg: 'Test feedback message',
          feedbackComments: [],
          errors: {
            __typename: 'PlanFeedbackErrors',
            feedbackComments: null,
            general: null,
            planId: null,
          },
        },
      },
    });

    render(<ProjectsProjectPlanFeedback />);

    const textarea = screen.getByRole('textbox', { name: 'form.label' });
    fireEvent.change(textarea, { target: { value: 'Test feedback message' } });

    fireEvent.click(screen.getByRole('button', { name: 'form.submitButton' }));

    await waitFor(() => {
      expect(mockRequestFeedbackMutation).toHaveBeenCalledWith({
        variables: {
          planId: 1,
          messageToOrg: 'Test feedback message',
        },
      });
      expect(mockToastAdd).toHaveBeenCalledWith(
        'messages.success.feedbackRequested',
        { type: 'success' }
      );
    });
  });

  it('should display error messages when mutation returns errors', async () => {
    mockRequestFeedbackMutation.mockResolvedValue({
      data: {
        requestFeedback: {
          id: null,
          completed: null,
          completedBy: null,
          messageToOrg: null,
          feedbackComments: [],
          errors: {
            __typename: 'PlanFeedbackErrors',
            feedbackComments: null,
            general: 'Something went wrong',
            planId: null,
          },
        },
      },
    });

    render(<ProjectsProjectPlanFeedback />);

    const textarea = screen.getByRole('textbox', { name: 'form.label' });
    fireEvent.change(textarea, { target: { value: 'Test feedback message' } });

    fireEvent.click(screen.getByRole('button', { name: 'form.submitButton' }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('should display error message when mutation throws a network error', async () => {
    mockRequestFeedbackMutation.mockRejectedValue(new Error('Network error'));

    render(<ProjectsProjectPlanFeedback />);

    const textarea = screen.getByRole('textbox', { name: 'form.label' });
    fireEvent.change(textarea, { target: { value: 'Test feedback message' } });

    fireEvent.click(screen.getByRole('button', { name: 'form.submitButton' }));

    await waitFor(() => {
      expect(screen.getByText('messaging.somethingWentWrong')).toBeInTheDocument();
    });
  });

  it('should display error message when meQuery fails', () => {
    setupMocks({ meError: { message: 'Failed to load user data' } });
    render(<ProjectsProjectPlanFeedback />);

    expect(screen.getByText('Failed to load user data')).toBeInTheDocument();
  });

  it('should display error message when feedbackQuery fails', () => {
    setupMocks({ feedbackError: { message: 'Failed to load feedback status' } });
    render(<ProjectsProjectPlanFeedback />);

    expect(screen.getByText('Failed to load feedback status')).toBeInTheDocument();
  });

  it('should display sidebar content', () => {
    render(<ProjectsProjectPlanFeedback />);

    expect(screen.getByText('sidebar.universitySupport.title')).toBeInTheDocument();
    expect(screen.getByText('sidebar.teamMembers.title')).toBeInTheDocument();
  });

  it('should display team feedback section', () => {
    render(<ProjectsProjectPlanFeedback />);

    expect(screen.getByText('teamFeedback.title')).toBeInTheDocument();
    expect(screen.getByText('teamFeedback.description')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'teamFeedback.updateAccessButton' })).toBeInTheDocument();
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(<ProjectsProjectPlanFeedback />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render active submit button when current user is a PRIMARY collaborator', () => {
    setupMocks({
      collaborators: [{ accessLevel: 'PRIMARY', user: { id: mockMeData.me.id } }],
    });
    render(<ProjectsProjectPlanFeedback />);

    const submitButton = screen.getByRole('button', { name: 'form.submitButton' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('should render disabled submit button when current user is NOT a PRIMARY collaborator', () => {
    setupMocks({
      collaborators: [
        { accessLevel: 'OWN', user: { id: mockMeData.me.id } },
        { accessLevel: 'PRIMARY', user: { id: 999 } },
      ],
    });
    render(<ProjectsProjectPlanFeedback />);

    const submitButton = screen.getByRole('button', { name: 'form.submitButton' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('should disable the textarea when current user is NOT a PRIMARY collaborator', () => {
    setupMocks({
      collaborators: [{ accessLevel: 'OWN', user: { id: mockMeData.me.id } }],
    });
    render(<ProjectsProjectPlanFeedback />);

    const textarea = screen.getByRole('textbox', { name: 'form.label' });
    expect(textarea).toBeDisabled();
  });

  it('should display error message when collaborators query fails', () => {
    setupMocks({ collaboratorsError: { message: 'Failed to load collaborators' } });
    render(<ProjectsProjectPlanFeedback />);

    expect(screen.getByText('Failed to load collaborators')).toBeInTheDocument();
  });
});