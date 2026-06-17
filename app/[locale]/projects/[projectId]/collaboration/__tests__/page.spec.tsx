import React from 'react';
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MockedProvider } from '@apollo/client/testing/react';
import { useParams, useRouter } from 'next/navigation';
import { removeProjectCollaboratorAction, updateProjectCollaboratorAction, resendInviteToProjectCollaboratorAction } from '../actions';
import { mockScrollIntoView } from "@/__mocks__/common";

import {
  MeDocument,
  ProjectCollaboratorAccessLevel,
  ProjectDocument,
} from '@/generated/graphql';

expect.extend(toHaveNoViolations);
import ProjectsProjectCollaboration from "../page";


expect.extend(toHaveNoViolations);

jest.mock('../actions', () => ({
  removeProjectCollaboratorAction: jest.fn().mockResolvedValue({
    success: true,
    errors: [],
    data: {}
  }),
  updateProjectCollaboratorAction: jest.fn().mockResolvedValue({
    success: true,
    errors: [],
    data: {},
    redirect: undefined
  }),
  resendInviteToProjectCollaboratorAction: jest.fn().mockResolvedValue({
    success: true,
    errors: [],
    data: {}
  }),
}));

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => jest.fn((key) => key)), // Mock `useTranslations`,
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn()
}));

const mockRouter = {
  push: jest.fn(),
};
const projectMock = {
  readOnly: false,
  collaborators: [
    {
      __typename: "ProjectCollaborator",
      id: 21,
      errors: {
        __typename: "ProjectCollaboratorErrors",
        accessLevel: null,
        email: null,
        general: null,
        invitedById: null,
        planId: null,
        userId: null
      },
      accessLevel: "OWN",
      created: "2025-09-10 19:36:06",
      email: "user1@example.com",
      user: {
        __typename: "User",
        givenName: "User",
        surName: "One",
        email: "user1@example.com"
      }
    },
    {
      __typename: "ProjectCollaborator",
      id: 20,
      errors: {
        __typename: "ProjectCollaboratorErrors",
        accessLevel: null,
        email: null,
        general: null,
        invitedById: null,
        planId: null,
        userId: null
      },
      accessLevel: "OWN",
      created: "2025-09-10 17:44:40",
      email: "user2@example.com",
      user: null
    },
    {
      __typename: "ProjectCollaborator",
      id: 22,
      errors: {
        __typename: "ProjectCollaboratorErrors",
        accessLevel: null,
        email: null,
        general: null,
        invitedById: null,
        planId: null,
        userId: null
      },
      accessLevel: "OWN",
      created: "2025-09-10 19:36:26",
      email: "user3@example.com",
      user: {
        __typename: "User",
        givenName: "User",
        surName: "Three",
        email: "user3@example.com"
      }
    },
    {
      __typename: "ProjectCollaborator",
      id: 18,
      errors: {
        __typename: "ProjectCollaboratorErrors",
        accessLevel: null,
        email: null,
        general: null,
        invitedById: null,
        planId: null,
        userId: null
      },
      accessLevel: "EDIT",
      created: "2025-09-10 17:25:37",
      email: "user4@example.com",
      user: {
        __typename: "User",
        givenName: "User",
        surName: "Four",
        email: "user4@Example.com"
      }
    }
  ]
};

const meMock = {
  request: {
    query: MeDocument,
    variables: {},
  },
  result: {
    data: {
      me: {
        __typename: 'User',
        id: 1,
        givenName: 'Test',
        surName: 'User',
        languageId: null,
        role: 'RESEARCHER',
        emails: [],
        errors: {
          __typename: 'UserErrors',
          general: null,
          email: null,
          password: null,
          role: null,
        },
        affiliation: null,
      },
    },
  },
};

const projectCollaboratorsMockQuery = {
  request: {
    query: ProjectDocument,
    variables: {
      projectId: 1
    },
  },
  result: {
    data: {
      project: projectMock,
    },
  },
};

const MOCKS = [
  // Initial load
  projectCollaboratorsMockQuery,
  // Refetch after successful update
  projectCollaboratorsMockQuery,
  meMock,
];

const ERROR_MOCKS = [
  {
    request: {
      query: ProjectDocument,
      variables: {
        projectId: 1
      },
    },
    error: new Error('Server Error')
  },
  meMock,
]

const readOnlyProjectMock = {
  ...projectMock,
  readOnly: true,
};

const readOnlyProjectCollaboratorsMockQuery = {
  request: {
    query: ProjectDocument,
    variables: { projectId: 1 },
  },
  result: {
    data: {
      project: readOnlyProjectMock,
    },
  },
};

const READ_ONLY_MOCKS = [
  readOnlyProjectCollaboratorsMockQuery,
  readOnlyProjectCollaboratorsMockQuery,
  meMock,
];



describe('ProjectsProjectCollaborationPage', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

    const mockUseParams = useParams as jest.Mock;
    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ projectId: "1" });

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  })

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call handleRevoke when the revoke button is clicked, and \'delete\' button is clicked', async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={MOCKS}>
          <ProjectsProjectCollaboration />
        </MockedProvider>
      );
    });

    // Wait until data has been rendered
    const inviteButton = await screen.findByRole('link', { name: "links.inviteAPerson" });
    expect(inviteButton).toBeInTheDocument();

    const revokeButton = await screen.queryAllByRole('button', { name: /revokeAccessFor/i });
    fireEvent.click(revokeButton[0]);


    // Confirm confirm modal opened
    const confirmRevokeButton = await screen.findByRole('button', { name: "deleteCollaborator" });
    fireEvent.click(confirmRevokeButton);

    await waitFor(() => {
      expect(removeProjectCollaboratorAction).toHaveBeenCalledWith({
        projectCollaboratorId: 21,
      });
    });
  });

  it('should handle failure when revoke fails', async () => {
    // Override the default mock for this test only
    (removeProjectCollaboratorAction as jest.Mock).mockResolvedValueOnce({
      success: false,
      errors: ['Something went wrong'],
      data: {}
    });

    await act(async () => {
      render(
        <MockedProvider mocks={MOCKS}>
          <ProjectsProjectCollaboration />
        </MockedProvider>
      );
    });

    // Wait until data has been rendered
    const inviteButton = await screen.findByRole('link', { name: "links.inviteAPerson" });
    expect(inviteButton).toBeInTheDocument();

    const revokeButton = await screen.queryAllByRole('button', { name: /revokeAccessFor/i });
    fireEvent.click(revokeButton[0]);

    const confirmRevokeButton = await screen.findByRole('button', { name: "deleteCollaborator" });
    fireEvent.click(confirmRevokeButton);

    await waitFor(() => {
      expect(removeProjectCollaboratorAction).toHaveBeenCalledWith({
        projectCollaboratorId: 21,
      });
    });

    // Should display error message
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('should display any field-level errors returned from handleRevoke', async () => {
    // Override the default mock for this test only
    (removeProjectCollaboratorAction as jest.Mock).mockResolvedValueOnce({
      success: true,
      errors: null,
      data: {
        errors: {
          general: 'Something went wrong with the handleRevoke action'
        }
      }
    });

    await act(async () => {
      render(
        <MockedProvider mocks={MOCKS}>
          <ProjectsProjectCollaboration />
        </MockedProvider>
      );
    });

    // Wait until data has been rendered
    const inviteButton = await screen.findByRole('link', { name: "links.inviteAPerson" });
    expect(inviteButton).toBeInTheDocument();

    const revokeButton = await screen.queryAllByRole('button', { name: /revokeAccessFor/i });
    fireEvent.click(revokeButton[0]);


    const confirmRevokeButton = await screen.findByRole('button', { name: "deleteCollaborator" });
    fireEvent.click(confirmRevokeButton);

    await waitFor(() => {
      expect(removeProjectCollaboratorAction).toHaveBeenCalledWith({
        projectCollaboratorId: 21,
      });
    });

    // Should display error message
    expect(await screen.findByText(/Something went wrong with the handleRevoke action/i)).toBeInTheDocument();
  });

  it('should call redirect if removeProjectCollaboratorAction response includes a redirect', async () => {
    // Override the default mock for this test only
    (removeProjectCollaboratorAction as jest.Mock).mockResolvedValueOnce({
      success: true,
      errors: null,
      data: {},
      redirect: '/en-US/login'
    });

    await act(async () => {
      render(
        <MockedProvider mocks={MOCKS}>
          <ProjectsProjectCollaboration />
        </MockedProvider>
      );
    });

    // Wait until data has been rendered
    const inviteButton = await screen.findByRole('link', { name: "links.inviteAPerson" });
    expect(inviteButton).toBeInTheDocument();

    const revokeButton = await screen.queryAllByRole('button', { name: /revokeAccessFor/i });
    fireEvent.click(revokeButton[0]);


    const confirmRevokeButton = await screen.findByRole('button', { name: "deleteCollaborator" });
    fireEvent.click(confirmRevokeButton);

    await waitFor(() => {
      expect(removeProjectCollaboratorAction).toHaveBeenCalledWith({
        projectCollaboratorId: 21,
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/en-US/login');
    });
  });

  it('should NOT call handleRevoke when the revoke button is clicked, and \'cancel\' button is clicked', async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={MOCKS}>
          <ProjectsProjectCollaboration />
        </MockedProvider>
      );
    });

    // Wait until data has been rendered
    const inviteButton = await screen.findByRole('link', { name: "links.inviteAPerson" });
    expect(inviteButton).toBeInTheDocument();

    const revokeButton = await screen.queryAllByRole('button', { name: /revokeAccessFor/i });
    fireEvent.click(revokeButton[0]);


    // Confirm confirm modal opened
    const confirmRevokeButton = await screen.findByRole('button', { name: "cancelRemoval" });
    fireEvent.click(confirmRevokeButton);

    await waitFor(() => {
      expect(removeProjectCollaboratorAction).not.toHaveBeenCalledWith();
    });
  });

  it('should call handleRadioChange when the the access level is changed for a user', async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={MOCKS}>
          <ProjectsProjectCollaboration />
        </MockedProvider>
      );
    });

    // Wait until data has been rendered
    const inviteButton = await screen.findByRole('link', { name: "links.inviteAPerson" });
    expect(inviteButton).toBeInTheDocument();

    // Find the specific label by testid
    const label = screen.getByTestId('edit-User One');
    // Within that label, grab the radio by aria label
    const input = within(label).getByLabelText('canEditPlanFor');

    // Click and assert
    fireEvent.click(input);
    expect(input).toBeChecked();

    // Click Save to trigger the update action (radio only stages a pending change)
    const userOneItem = screen.getByRole('listitem', { name: /Project member: User One/i });
    const saveButton = within(userOneItem).getByRole('button', { name: /saveAccessFor/i });
    fireEvent.click(saveButton);

    // Confirm in the save modal
    const confirmButton = await screen.findByRole('button', { name: /saveCollaboratorAccess/i });
    fireEvent.click(confirmButton);

    // Confirm
    await waitFor(() => {
      expect(updateProjectCollaboratorAction).toHaveBeenCalledWith({
        projectCollaboratorId: 21,
        accessLevel: ProjectCollaboratorAccessLevel.Edit
      });
    });
  });

  it('should NOT call handleRadioChange when the the access level is the same as before when user clicks the radio button', async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={MOCKS}>
          <ProjectsProjectCollaboration />
        </MockedProvider>
      );
    });

    // Wait until data has been rendered
    const inviteButton = await screen.findByRole('link', { name: "links.inviteAPerson" });
    expect(inviteButton).toBeInTheDocument();

    // Find the specific label by testid
    const label = screen.getByTestId('own-User One');
    // Within that label, grab the radio by aria label
    const input = within(label).getByLabelText('canCoOwnPlanFor');

    // Click and assert (User One already has OWN — same value)
    fireEvent.click(input);
    expect(input).toBeChecked();

    // Click Save to trigger the update action (radio only stages a pending change)
    const userOneItem = screen.getByRole('listitem', { name: /Project member: User One/i });
    const saveButton = within(userOneItem).getByRole('button', { name: /saveAccessFor/i });
    fireEvent.click(saveButton);

    // Confirm in the save modal
    const confirmButton = await screen.findByRole('button', { name: /saveCollaboratorAccess/i });
    fireEvent.click(confirmButton);

    // Should not call update action as the access level is the same
    await waitFor(() => {
      expect(updateProjectCollaboratorAction).not.toHaveBeenCalled();
    });
  });

  it('should handle response correctly when updateProjectCollaboratorsAction fails', async () => {
    // Override the default mock for this test only
    (updateProjectCollaboratorAction as jest.Mock).mockResolvedValueOnce({
      success: false,
      errors: ['Something went wrong'],
      data: {}
    });

    await act(async () => {
      render(
        <MockedProvider mocks={MOCKS}>
          <ProjectsProjectCollaboration />
        </MockedProvider>
      );
    });

    // Wait until data has been rendered
    const inviteButton = await screen.findByRole('link', { name: "links.inviteAPerson" });
    expect(inviteButton).toBeInTheDocument();

    // Find the specific label by testid
    const label = screen.getByTestId('edit-User One');
    // Within that label, grab the radio by aria label
    const input = within(label).getByLabelText('canEditPlanFor');

    // Click and assert
    fireEvent.click(input);
    expect(input).toBeChecked();

    // Click Save to trigger the update action (radio only stages a pending change)
    const userOneItem = screen.getByRole('listitem', { name: /Project member: User One/i });
    const saveButton = within(userOneItem).getByRole('button', { name: /saveAccessFor/i });
    fireEvent.click(saveButton);

    // Confirm in the save modal
    const confirmButton = await screen.findByRole('button', { name: /saveCollaboratorAccess/i });
    fireEvent.click(confirmButton);

    // Should display error message
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('should handle response correctly when updateProjectCollaboratorsAction returns field-level errors', async () => {
    // Override the default mock for this test only
    (updateProjectCollaboratorAction as jest.Mock).mockResolvedValueOnce({
      success: true,
      errors: null,
      data: {
        errors: {
          general: 'Something went wrong with the handleRevoke action'
        }
      }
    });

    await act(async () => {
      render(
        <MockedProvider mocks={MOCKS}>
          <ProjectsProjectCollaboration />
        </MockedProvider>
      );
    });

    // Wait until data has been rendered
    const inviteButton = await screen.findByRole('link', { name: "links.inviteAPerson" });
    expect(inviteButton).toBeInTheDocument();

    // Find the specific label by testid
    const label = screen.getByTestId('edit-User One');
    // Within that label, grab the radio by aria label
    const input = within(label).getByLabelText('canEditPlanFor');

    // Click and assert
    fireEvent.click(input);
    expect(input).toBeChecked();

    // Click Save to trigger the update action (radio only stages a pending change)
    const userOneItem = screen.getByRole('listitem', { name: /Project member: User One/i });
    const saveButton = within(userOneItem).getByRole('button', { name: /saveAccessFor/i });
    fireEvent.click(saveButton);

    // Confirm in the save modal
    const confirmButton = await screen.findByRole('button', { name: /saveCollaboratorAccess/i });
    fireEvent.click(confirmButton);

    // Should display error message
    expect(await screen.findByText(/Something went wrong with the handleRevoke action/i)).toBeInTheDocument();
  });

  it('should handle response correctly when updateProjectCollaboratorsAction returns a redirect', async () => {
    // Override the default mock for this test only
    (updateProjectCollaboratorAction as jest.Mock).mockResolvedValueOnce({
      success: false,
      errors: null,
      data: {},
      redirect: '/en-US/login'
    });

    await act(async () => {
      render(
        <MockedProvider mocks={MOCKS}>
          <ProjectsProjectCollaboration />
        </MockedProvider>
      );
    });

    // Wait until data has been rendered
    const inviteButton = await screen.findByRole('link', { name: "links.inviteAPerson" });
    expect(inviteButton).toBeInTheDocument();

    // Find the specific label by testid
    const label = screen.getByTestId('edit-User One');
    // Within that label, grab the radio by aria label
    const input = within(label).getByLabelText('canEditPlanFor');

    // Click and assert
    fireEvent.click(input);
    expect(input).toBeChecked();

    // Click Save to trigger the update action (radio only stages a pending change)
    const userOneItem = screen.getByRole('listitem', { name: /Project member: User One/i });
    const saveButton = within(userOneItem).getByRole('button', { name: /saveAccessFor/i });
    fireEvent.click(saveButton);

    // Confirm in the save modal
    const confirmButton = await screen.findByRole('button', { name: /saveCollaboratorAccess/i });
    fireEvent.click(confirmButton);

    // Verify that router.push was called with "/login"
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/en-US/login');
    })
  });

  it('should call handleResend when the Resend button is clicked', async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={MOCKS}>
          <ProjectsProjectCollaboration />
        </MockedProvider>
      );
    });

    await waitFor(() => {
      const resendButton = screen.queryAllByRole('button', { name: /resendInviteFor/i });
      fireEvent.click(resendButton[0]);
    });

    await waitFor(() => {
      expect(resendInviteToProjectCollaboratorAction).toHaveBeenCalledWith({
        projectCollaboratorId: 20,
      });
    });
  });

  it('should handle failure when resend fails', async () => {
    // Override the default mock for this test only
    (resendInviteToProjectCollaboratorAction as jest.Mock).mockResolvedValueOnce({
      success: false,
      errors: ['Something went wrong'],
      data: {}
    });

    await act(async () => {
      render(
        <MockedProvider mocks={MOCKS}>
          <ProjectsProjectCollaboration />
        </MockedProvider>
      );
    });

    await waitFor(() => {
      const resendButton = screen.queryAllByRole('button', { name: /resendInviteFor/i });
      fireEvent.click(resendButton[0]);
    });

    await waitFor(() => {
      expect(resendInviteToProjectCollaboratorAction).toHaveBeenCalledWith({
        projectCollaboratorId: 20,
      });
    });

    // Should display error message
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('should display any field-level errors returned from handleResend', async () => {
    // Override the default mock for this test only
    (resendInviteToProjectCollaboratorAction as jest.Mock).mockResolvedValueOnce({
      success: true,
      errors: null,
      data: {
        errors: {
          general: 'Something went wrong with the handleResend action'
        }
      }
    });

    await act(async () => {
      render(
        <MockedProvider mocks={MOCKS}>
          <ProjectsProjectCollaboration />
        </MockedProvider>
      );
    });

    await waitFor(() => {
      const resendButton = screen.queryAllByRole('button', { name: /resendInviteFor/i });
      fireEvent.click(resendButton[0]);
    });

    await waitFor(() => {
      expect(resendInviteToProjectCollaboratorAction).toHaveBeenCalledWith({
        projectCollaboratorId: 20,
      });
    });

    // Should display error message
    expect(await screen.findByText(/Something went wrong with the handleResend action/i)).toBeInTheDocument();
  });

  it('should call redirect if resendInviteToProjectCollaboratorAction response includes a redirect', async () => {
    // Override the default mock for this test only
    (resendInviteToProjectCollaboratorAction as jest.Mock).mockResolvedValueOnce({
      success: true,
      errors: null,
      data: {},
      redirect: '/en-US/login'
    });

    await act(async () => {
      render(
        <MockedProvider mocks={MOCKS}>
          <ProjectsProjectCollaboration />
        </MockedProvider>
      );
    });

    await waitFor(() => {
      const resendButton = screen.queryAllByRole('button', { name: /resendInviteFor/i });
      fireEvent.click(resendButton[0]);
    });

    await waitFor(() => {
      expect(resendInviteToProjectCollaboratorAction).toHaveBeenCalledWith({
        projectCollaboratorId: 20,
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/en-US/login');
    });
  });

  it('should display error if projectCollaborators query fails', async () => {

    await act(async () => {
      render(
        <MockedProvider mocks={ERROR_MOCKS}>
          <ProjectsProjectCollaboration />
        </MockedProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Server Error')).toBeInTheDocument();
    });

  });

  it('should pass accessibility tests', async () => {
    const { container } = render(
      <MockedProvider mocks={MOCKS}>
        <ProjectsProjectCollaboration />
      </MockedProvider>
    );

    // Wait for the UI to settle after async updates
    await waitFor(() => {
      // Example: wait for a known element to appear
      expect(screen.getByText(/User One/i)).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('when isReadOnly is true', () => {
    // Helper: wait for page data without relying on the invite link (which is hidden in read-only)
    const waitForPageLoad = () =>
      screen.findByRole('listitem', { name: /Project member: User One/i });

    it('should not render the "Invite a Person" link', async () => {
      await act(async () => {
        render(
          <MockedProvider mocks={READ_ONLY_MOCKS}>
            <ProjectsProjectCollaboration />
          </MockedProvider>
        );
      });

      await waitForPageLoad();
      expect(screen.queryByRole('link', { name: 'links.inviteAPerson' })).not.toBeInTheDocument();
    });

    it('should not render Save or Revoke buttons for active collaborators', async () => {
      await act(async () => {
        render(
          <MockedProvider mocks={READ_ONLY_MOCKS}>
            <ProjectsProjectCollaboration />
          </MockedProvider>
        );
      });

      await waitForPageLoad();
      expect(screen.queryAllByRole('button', { name: /saveAccessFor/i })).toHaveLength(0);
      expect(screen.queryAllByRole('button', { name: /revokeAccessFor/i })).toHaveLength(0);
    });

    it('should not render Delete Invite or Resend buttons for pending invites', async () => {
      await act(async () => {
        render(
          <MockedProvider mocks={READ_ONLY_MOCKS}>
            <ProjectsProjectCollaboration />
          </MockedProvider>
        );
      });

      await waitForPageLoad();
      expect(screen.queryAllByRole('button', { name: /deleteInviteFor/i })).toHaveLength(0);
      expect(screen.queryAllByRole('button', { name: /resendInviteFor/i })).toHaveLength(0);
    });

    it('should still render active collaborator names and emails', async () => {
      await act(async () => {
        render(
          <MockedProvider mocks={READ_ONLY_MOCKS}>
            <ProjectsProjectCollaboration />
          </MockedProvider>
        );
      });

      await waitForPageLoad();
      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('User Three')).toBeInTheDocument();
    });

    it('should still render the pending invites section', async () => {
      await act(async () => {
        render(
          <MockedProvider mocks={READ_ONLY_MOCKS}>
            <ProjectsProjectCollaboration />
          </MockedProvider>
        );
      });

      await waitForPageLoad();
      expect(screen.getByRole('heading', { name: 'headings.pendingInvites' })).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    });

    it('should render AccessLevelRadioGroup as disabled for active collaborators', async () => {
      await act(async () => {
        render(
          <MockedProvider mocks={READ_ONLY_MOCKS}>
            <ProjectsProjectCollaboration />
          </MockedProvider>
        );
      });

      await waitForPageLoad();

      // All radio inputs within the active collaborators list should be disabled
      const activeSection = screen.getByRole('region', { name: /headings\.hasAccess/i });
      const radios = within(activeSection).queryAllByRole('radio');
      expect(radios.length).toBeGreaterThan(0);
      radios.forEach(radio => expect(radio).toBeDisabled());
    });

    it('should render AccessLevelRadioGroup as disabled for pending invites', async () => {
      await act(async () => {
        render(
          <MockedProvider mocks={READ_ONLY_MOCKS}>
            <ProjectsProjectCollaboration />
          </MockedProvider>
        );
      });

      await waitForPageLoad();

      const pendingSection = screen.getByRole('region', { name: /headings\.pendingInvites/i });
      const radios = within(pendingSection).queryAllByRole('radio');
      expect(radios.length).toBeGreaterThan(0);
      radios.forEach(radio => expect(radio).toBeDisabled());
    });
  });
});

