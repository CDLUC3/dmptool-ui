import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useRouter, useParams } from 'next/navigation';

import {
  mockScrollIntoView,
  mockScrollTo
} from "@/__mocks__/common";
import ProjectsProjectCollaborationInvite from "../page";
import { addProjectCollaboratorAction } from '../actions/index';
jest.mock('../actions/index', () => ({
  addProjectCollaboratorAction: jest.fn(),
  addProjectMemberAction: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

// Mock the ToastContext
const mockToastAdd = jest.fn();
jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(() => ({
    add: mockToastAdd,
  })),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn()
}));

const mockUseRouter = useRouter as jest.Mock;

expect.extend(toHaveNoViolations);


describe('ProjectsProjectCollaborationInvite', () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();

    const mockUseParams = useParams as jest.Mock;
    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ projectId: 1, dmpid: 1 });

    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    })
    jest.clearAllMocks();
    mockToastAdd.mockClear();
  })

  it('should render initial invite page', async () => {
    render(<ProjectsProjectCollaborationInvite />);

    expect(screen.getByText('breadcrumbs.home')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbs.projects')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbs.project')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbs.feedback')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
    const addCollaboratorForm = screen.getByTestId('add-collaborator-form');
    expect(addCollaboratorForm).toBeInTheDocument();
    expect(within(addCollaboratorForm).getByText('formLabels.email')).toBeInTheDocument();
    expect(within(addCollaboratorForm).getByRole('textbox', { name: 'formLabels.email' })).toBeInTheDocument();
    expect(within(addCollaboratorForm).getByText('radioButtons.access.label')).toBeInTheDocument();
    const radioButton1 = screen.getByRole('radio', {
      name: 'canEdit',
      checked: true,
    });
    expect(radioButton1).toBeInTheDocument();
    const radioButton2 = screen.getByRole('radio', {
      name: 'canComment',
      checked: false
    });
    expect(radioButton2).toBeInTheDocument();
    expect(within(addCollaboratorForm).getByRole('button', { name: 'buttons.grantAccess' })).toBeInTheDocument();
    expect(within(addCollaboratorForm).getByText('para1')).toBeInTheDocument();
    expect(within(addCollaboratorForm).getByText('para2')).toBeInTheDocument();
  });

  it('should open modal when user fills out form and clicks the \'Grant access\' button', async () => {
    (addProjectCollaboratorAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: null,
          email: null
        },
        user: {
          givenName: 'John',
          surName: 'Doe',
          affiliation: { uri: 'affiliation-uri' },
          orcid: 'orcid-id',
        },
      },
    });

    render(<ProjectsProjectCollaborationInvite />);

    // Enter email address
    const emailField = screen.getByPlaceholderText('placeHolders.email');
    fireEvent.change(emailField, { target: { value: 'testing@example.com' } });

    expect(emailField).toHaveValue('testing@example.com');


    // Click "Grant Access button"
    const grantAccessBtn = screen.getByRole('button', { name: /buttons\.grantAccess/i });

    fireEvent.click(grantAccessBtn);
    await waitFor(() => {
      expect(addProjectCollaboratorAction).toHaveBeenCalledWith({
        projectId: 1,
        email: 'testing@example.com',
        accessLevel: 'EDIT',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('invite-confirmation-modal')).toBeInTheDocument();
    })

    // Close the modal
    const closeButton = screen.getByRole('button', { name: /buttons\.close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('invite-confirmation-modal')).not.toBeInTheDocument();
    })
  });

  it('should call addProjectCollaboratorAction with correct access level after changing the radio option', async () => {
    (addProjectCollaboratorAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: null,
          email: null
        },
        user: {
          givenName: 'John',
          surName: 'Doe',
          affiliation: { uri: 'affiliation-uri' },
          orcid: 'orcid-id',
        },
      },
    });

    render(<ProjectsProjectCollaborationInvite />);

    // Enter email address
    const emailField = screen.getByPlaceholderText('placeHolders.email');
    fireEvent.change(emailField, { target: { value: 'testing@example.com' } });

    expect(emailField).toHaveValue('testing@example.com');

    // Select the "Comment only" radio option
    const commentOnlyRadio = screen.getByRole('radio', { name: 'canComment' });
    fireEvent.click(commentOnlyRadio);

    // Click "Grant Access" button
    const grantAccessBtn = screen.getByRole('button', { name: /buttons\.grantAccess/i });
    fireEvent.click(grantAccessBtn);
    await waitFor(() => {
      expect(addProjectCollaboratorAction).toHaveBeenCalledWith({
        projectId: 1,
        email: 'testing@example.com',
        accessLevel: 'COMMENT',
      });
    });
  });

  it('should display email error when the request result contains an email error', async () => {
    (addProjectCollaboratorAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: null,
          email: "Email already exists",
        },
        user: {
          givenName: 'John',
          surName: 'Doe',
          affiliation: { uri: 'affiliation-uri' },
          orcid: 'orcid-id',
        },
      },
    });

    render(<ProjectsProjectCollaborationInvite />);

    // Enter email address
    const emailField = screen.getByPlaceholderText('placeHolders.email');
    fireEvent.change(emailField, { target: { value: 'testing@example.com' } });

    expect(emailField).toHaveValue('testing@example.com');

    // Click "Grant Access" button
    const grantAccessBtn = screen.getByRole('button', { name: /buttons\.grantAccess/i });
    fireEvent.click(grantAccessBtn);

    await waitFor(() => {
      expect(addProjectCollaboratorAction).toHaveBeenCalledWith({
        projectId: 1,
        email: 'testing@example.com',
        accessLevel: 'EDIT',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('should display general error when the request result contains a general error', async () => {
    (addProjectCollaboratorAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: "General error message",
          email: null,
        },
        user: {
          givenName: 'John',
          surName: 'Doe',
          affiliation: { uri: 'affiliation-uri' },
          orcid: 'orcid-id',
        },
      },
    });

    render(<ProjectsProjectCollaborationInvite />);

    // Enter email address
    const emailField = screen.getByPlaceholderText('placeHolders.email');
    fireEvent.change(emailField, { target: { value: 'testing@example.com' } });

    expect(emailField).toHaveValue('testing@example.com');

    // Click "Grant Access" button
    const grantAccessBtn = screen.getByRole('button', { name: /buttons\.grantAccess/i });
    fireEvent.click(grantAccessBtn);

    await waitFor(() => {
      expect(addProjectCollaboratorAction).toHaveBeenCalledWith({
        projectId: 1,
        email: 'testing@example.com',
        accessLevel: 'EDIT',
      });
    });

    await waitFor(() => {
      expect(mockToastAdd).toHaveBeenCalledWith('General error message', { type: 'error' });
    });
  });

  it('should display general error as toast when both general and email errors exist (general takes precedence)', async () => {
    (addProjectCollaboratorAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: "General error message",
          email: "Email error message",
        },
        user: {
          givenName: 'John',
          surName: 'Doe',
          affiliation: { uri: 'affiliation-uri' },
          orcid: 'orcid-id',
        },
      },
    });

    render(<ProjectsProjectCollaborationInvite />);

    // Enter email address
    const emailField = screen.getByPlaceholderText('placeHolders.email');
    fireEvent.change(emailField, { target: { value: 'testing@example.com' } });

    expect(emailField).toHaveValue('testing@example.com');

    // Click "Grant Access" button
    const grantAccessBtn = screen.getByRole('button', { name: /buttons\.grantAccess/i });
    fireEvent.click(grantAccessBtn);

    await waitFor(() => {
      expect(addProjectCollaboratorAction).toHaveBeenCalledWith({
        projectId: 1,
        email: 'testing@example.com',
        accessLevel: 'EDIT',
      });
    });

    await waitFor(() => {
      // General error should be shown as toast (takes precedence over email error)
      expect(mockToastAdd).toHaveBeenCalledWith('General error message', { type: 'error' });
      // Email error should NOT be shown because general error takes precedence
      expect(screen.queryByText('Email error message')).not.toBeInTheDocument();
    });
  });

  it('should handle successful invitation and redirect to project page', async () => {
    (addProjectCollaboratorAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: null,
          email: null
        },
        user: {
          givenName: 'John',
          surName: 'Doe',
          affiliation: { uri: 'affiliation-uri' },
          orcid: 'orcid-id',
        },
      },
    });

    const mockPush = jest.fn();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });

    render(<ProjectsProjectCollaborationInvite />);

    // Enter email address
    const emailField = screen.getByPlaceholderText('placeHolders.email');
    fireEvent.change(emailField, { target: { value: 'testing@example.com' } });

    expect(emailField).toHaveValue('testing@example.com');

    // Click "Grant Access" button
    const grantAccessBtn = screen.getByRole('button', { name: /buttons\.grantAccess/i });
    fireEvent.click(grantAccessBtn);

    await waitFor(() => {
      expect(addProjectCollaboratorAction).toHaveBeenCalledWith({
        projectId: 1,
        email: 'testing@example.com',
        accessLevel: 'EDIT',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('invite-confirmation-modal')).toBeInTheDocument();
    });

    // Click "Go to project" button
    const goToProjectBtn = screen.getByRole('button', { name: /buttons\.goToProject/i });
    fireEvent.click(goToProjectBtn);

    expect(mockPush).toHaveBeenCalledWith('/projects/1');
  });

  it('should handle failed invitation and display error message', async () => {
    (addProjectCollaboratorAction as jest.Mock).mockResolvedValue({
      success: false,
      data: {
        errors: {
          general: "Failed to invite collaborator",
          email: null
        },
        user: null,
      },
    });

    render(<ProjectsProjectCollaborationInvite />);

    // Enter email address
    const emailField = screen.getByPlaceholderText('placeHolders.email');
    fireEvent.change(emailField, { target: { value: 'testing@example.com' } });

    expect(emailField).toHaveValue('testing@example.com');

    // Click "Grant Access" button
    const grantAccessBtn = screen.getByRole('button', { name: /buttons\.grantAccess/i });
    fireEvent.click(grantAccessBtn);

    await waitFor(() => {
      expect(addProjectCollaboratorAction).toHaveBeenCalledWith({
        projectId: 1,
        email: 'testing@example.com',
        accessLevel: 'EDIT',
      });
    });

    await waitFor(() => {
      expect(mockToastAdd).toHaveBeenCalledWith('Failed to invite collaborator', { type: 'error' });
    });
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(<ProjectsProjectCollaborationInvite />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
