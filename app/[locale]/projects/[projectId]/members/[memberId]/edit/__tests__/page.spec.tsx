import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from '@/utils/test-utils';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import logECS from '@/utils/clientLogger';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  ProjectMemberDocument,
  MemberRolesDocument,
  UpdateProjectMemberDocument,
  RemoveProjectMemberDocument
} from '@/generated/graphql';
import { useProjectMemberData } from '@/hooks/projectMemberData';

import { axe, toHaveNoViolations } from 'jest-axe';
import ProjectsProjectMembersEdit from '../page';
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";
import mockProjectMemberData from '../__mocks__/mockProjectMemberData.json';
import mockMemberRoles from '../__mocks__/mockMemberRoles.json';
import mockResponse from '../__mocks__/mockResponseFromMutation.json';

expect.extend(toHaveNoViolations);

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('@/hooks/projectMemberData', () => ({
  useProjectMemberData: jest.fn()
}));

jest.mock('@/components/Form/TypeAheadWithOther/useAffiliationSearch', () => ({
  useAffiliationSearch: () => ({
    suggestions: [],
    handleSearch: jest.fn(),
    isSearching: false,
    searchError: '',
  }),
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

let mockUpdateProjectMemberFn: jest.Mock;
let mockRemoveProjectMemberFn: jest.Mock;

const setupMocks = () => {
  // Create stable references OUTSIDE mockImplementation
  const stableProjectMemberReturn = {
    data: mockProjectMemberData,
    loading: false,
    error: null,
  };

  const stableMemberRolesReturn = {
    data: mockMemberRoles,
    loading: false,
    error: null,
  };

  mockUseQuery.mockImplementation((document) => {
    if (document === ProjectMemberDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return stableProjectMemberReturn as any;
    }

    if (document === MemberRolesDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return stableMemberRolesReturn as any;
    }

    return {
      data: null,
      loading: false,
      error: undefined
    };
  });

  mockUpdateProjectMemberFn = jest.fn().mockResolvedValue({
    data: { key: 'value' }
  });

  mockRemoveProjectMemberFn = jest.fn().mockResolvedValue({
    data: { removeProjectMember: { id: 123, name: 'Test Project Member' } }
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === UpdateProjectMemberDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [mockUpdateProjectMemberFn, { loading: false, error: undefined }] as any;
    }

    if (document === RemoveProjectMemberDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [mockRemoveProjectMemberFn, { loading: false, error: undefined }] as any;
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    return [jest.fn(), { loading: false, error: undefined }] as any;
  });
};

describe("ProjectsProjectMembersEdit", () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();

    // Set up Apollo Client mocks
    setupMocks();

    const mockUseParams = useParams as jest.Mock;
    mockUseParams.mockReturnValue({ projectId: 1, memberId: 1 });

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useToast as jest.Mock).mockReturnValue(mockToast);

    (useProjectMemberData as jest.Mock).mockReturnValue({
      projectMemberData: {
        givenName: 'Test',
        surName: 'User',
        affiliationId: 'test-affiliation',
        affiliationName: 'Test University',
        otherAffiliationName: '',
        email: 'test@example.com',
        orcid: '0000-0000-0000-0000',
      },
      checkboxRoles: ['1', '2'],
      setCheckboxRoles: jest.fn(),
      loading: false,
      setProjectMemberData: jest.fn(),
      data: {
        projectMember: {
          givenName: 'Test',
          surName: 'User',
          affiliation: { uri: 'test-affiliation' },
          email: 'test@example.com',
          orcid: '0000-0000-0000-0000',
          memberRoles: [
            { id: '1', __typename: 'MemberRole' },
            { id: '2', __typename: 'MemberRole' }
          ]
        }
      },
      queryError: null
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render a loading indicator while project roles load', async () => {
    // Override the mock for this specific test
    mockUseQuery.mockImplementation((document) => {
      if (document === MemberRolesDocument) {
        return {
          data: null,
          loading: true,
          error: null,
          /* eslint-disable @typescript-eslint/no-explicit-any */
        } as any;
      }
      if (document === ProjectMemberDocument) {
        return {
          data: mockProjectMemberData,
          loading: false,
          error: null,
          /* eslint-disable @typescript-eslint/no-explicit-any */
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => {
      render(<ProjectsProjectMembersEdit />);
    });

    expect(screen.getByRole('status')).toHaveTextContent('messaging.loadingRoles');
    expect(screen.getByText('labels.definedRole')).toBeInTheDocument();
    expect(screen.getByText('memberRolesDescription.selection')).toBeInTheDocument();
    expect(screen.getByText('memberRolesDescription.credit')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('should render the project loading component during the initial page load', () => {
    (useProjectMemberData as jest.Mock).mockReturnValue({
      projectMemberData: {
        givenName: '',
        surName: '',
        affiliationId: '',
        affiliationName: '',
        otherAffiliationName: '',
        email: '',
        orcid: '',
      },
      checkboxRoles: [],
      setCheckboxRoles: jest.fn(),
      loading: true,
      setProjectMemberData: jest.fn(),
      data: null,
      queryError: null,
    });

    render(<ProjectsProjectMembersEdit />);

    expect(screen.getByTestId('loading-component')).toHaveClass('loading-page');
    expect(screen.getByRole('status')).toHaveTextContent('messaging.loading');
  });

  it('should render an inline roles error and retry loading', async () => {
    const refetchMemberRoles = jest.fn();

    mockUseQuery.mockImplementation((document) => {
      if (document === MemberRolesDocument) {
        return {
          data: null,
          loading: false,
          error: true,
          refetch: refetchMemberRoles,
          /* eslint-disable @typescript-eslint/no-explicit-any */
        } as any;
      }
      if (document === ProjectMemberDocument) {
        return {
          data: mockProjectMemberData,
          loading: false,
          error: null,
          /* eslint-disable @typescript-eslint/no-explicit-any */
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => {
      render(<ProjectsProjectMembersEdit />);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('messaging.errors.projectRolesLoadError');
    fireEvent.click(screen.getByRole('button', { name: 'buttons.retryRoles' }));
    expect(refetchMemberRoles).toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it("should render correct fields", async () => {
    await act(async () => {
      render(<ProjectsProjectMembersEdit />);
    });

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('title');
    expect(screen.getByRole('link', { name: /breadcrumbs.projects/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/labels.givenName/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /labels.givenName/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/labels.surName/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /labels.surName/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/labels.affiliation/i)).toHaveValue('Test University');
    expect(screen.getByRole('textbox', { name: /affiliation/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/labels.email/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/labels.orcid/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /orcid/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buttons.saveChanges/i })).toBeInTheDocument();

    const checkboxGroup = screen.getByTestId('checkbox-group');
    expect(checkboxGroup).toBeInTheDocument();
    expect(screen.getByText('labels.definedRole')).toBeInTheDocument();
    expect(screen.getByText('memberRolesDescription.selection')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /links.learnMoreAboutCreditTaxonomy/i })).toHaveAttribute(
      'href',
      'https://credit.niso.org/'
    );
    expect(within(checkboxGroup).getByText('Principal Investigator (PI)')).toBeInTheDocument();
    expect(within(checkboxGroup).getByText('Project Administrator')).toBeInTheDocument();
    expect(within(checkboxGroup).getByRole('checkbox', { name: 'Data Manager' })).toBeInTheDocument();
    expect(within(checkboxGroup).getByRole('checkbox', { name: 'No Role Assigned' })).toBeInTheDocument();

    const orderedRoleLabels = within(checkboxGroup)
      .getAllByRole('checkbox')
      .map((checkbox) => checkbox.closest('label')?.textContent?.trim());
    expect(orderedRoleLabels).toEqual([
      'Data Manager',
      'Other',
      'Principal Investigator (PI)',
      'Project Administrator',
      'No Role Assigned',
    ]);
  });

  it('should make No Role Assigned exclusive when selected', () => {
    const setCheckboxRoles = jest.fn();
    (useProjectMemberData as jest.Mock).mockReturnValue({
      projectMemberData: {
        givenName: 'Test',
        surName: 'User',
        affiliationId: 'test-affiliation',
        affiliationName: 'Test University',
        otherAffiliationName: '',
        email: '',
        orcid: '',
      },
      checkboxRoles: ['1', '2'],
      setCheckboxRoles,
      loading: false,
      setProjectMemberData: jest.fn(),
      data: null,
      queryError: null,
    });

    render(<ProjectsProjectMembersEdit />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'No Role Assigned' }));

    expect(setCheckboxRoles).toHaveBeenCalledWith(['5']);
  });

  it('should clear No Role Assigned when another role is selected', () => {
    const setCheckboxRoles = jest.fn();
    (useProjectMemberData as jest.Mock).mockReturnValue({
      projectMemberData: {
        givenName: 'Test',
        surName: 'User',
        affiliationId: 'test-affiliation',
        affiliationName: 'Test University',
        otherAffiliationName: '',
        email: '',
        orcid: '',
      },
      checkboxRoles: ['5'],
      setCheckboxRoles,
      loading: false,
      setProjectMemberData: jest.fn(),
      data: null,
      queryError: null,
    });

    render(<ProjectsProjectMembersEdit />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Data Manager' }));

    expect(setCheckboxRoles).toHaveBeenCalledWith(['1']);
  });

  it("should handle form submission", async () => {
    mockUpdateProjectMemberFn.mockResolvedValueOnce({ data: mockResponse });

    await act(async () => {
      render(<ProjectsProjectMembersEdit />);
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveChanges/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/en-US/projects/1/members');
    });
  });

  it("should submit the custom affiliation name when Other is selected", async () => {
    (useProjectMemberData as jest.Mock).mockReturnValue({
      projectMemberData: {
        givenName: 'Test',
        surName: 'User',
        affiliationId: 'other',
        affiliationName: 'Other',
        otherAffiliationName: 'Custom Research Institute',
        email: 'test@example.com',
        orcid: '',
      },
      checkboxRoles: ['1'],
      setCheckboxRoles: jest.fn(),
      loading: false,
      setProjectMemberData: jest.fn(),
      data: null,
      queryError: null,
    });
    mockUpdateProjectMemberFn.mockResolvedValueOnce({ data: mockResponse });

    render(<ProjectsProjectMembersEdit />);
    fireEvent.click(screen.getByRole('button', { name: /buttons.saveChanges/i }));

    await waitFor(() => {
      expect(mockUpdateProjectMemberFn).toHaveBeenCalledWith(expect.objectContaining({
        variables: {
          input: expect.objectContaining({
            affiliationId: '',
            affiliationName: 'Custom Research Institute',
          }),
        },
      }));
    });
  });

  it("should disable the save button while updating", () => {
    mockUseMutation.mockImplementation((document) => {
      if (document === UpdateProjectMemberDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockUpdateProjectMemberFn, { loading: true, error: undefined }] as any;
      }

      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [mockRemoveProjectMemberFn, { loading: false, error: undefined }] as any;
    });

    render(<ProjectsProjectMembersEdit />);

    expect(screen.getByRole('button', { name: /messaging.saving/i })).toBeDisabled();
    expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
  });

  it("should allow form submission without an email address", async () => {
    (useProjectMemberData as jest.Mock).mockReturnValue({
      projectMemberData: {
        givenName: 'Test',
        surName: 'User',
        affiliationId: 'https://ror.org/test',
        affiliationName: 'Test University',
        otherAffiliationName: '',
        email: '',
        orcid: '',
      },
      checkboxRoles: ['1'],
      setCheckboxRoles: jest.fn(),
      loading: false,
      setProjectMemberData: jest.fn(),
      data: { projectMember: { affiliation: { displayName: 'Test University', uri: 'https://ror.org/test' } } },
      queryError: null,
    });
    mockUpdateProjectMemberFn.mockResolvedValueOnce({ data: mockResponse });

    render(<ProjectsProjectMembersEdit />);
    fireEvent.click(screen.getByRole('button', { name: /buttons.saveChanges/i }));

    await waitFor(() => {
      expect(mockUpdateProjectMemberFn).toHaveBeenCalledWith(expect.objectContaining({
        variables: {
          input: expect.objectContaining({
            affiliationId: 'https://ror.org/test',
            email: '',
          }),
        },
      }));
    });
  });

  it("should require at least one project role", async () => {
    (useProjectMemberData as jest.Mock).mockReturnValue({
      projectMemberData: {
        givenName: 'Test',
        surName: 'User',
        affiliationId: 'https://ror.org/test',
        affiliationName: 'Test University',
        otherAffiliationName: '',
        email: '',
        orcid: '',
      },
      checkboxRoles: [],
      setCheckboxRoles: jest.fn(),
      loading: false,
      setProjectMemberData: jest.fn(),
      data: { projectMember: { affiliation: { displayName: 'Test University', uri: 'https://ror.org/test' } } },
      queryError: null,
    });

    render(<ProjectsProjectMembersEdit />);
    fireEvent.click(screen.getByRole('button', { name: /buttons.saveChanges/i }));

    expect(await screen.findByText('messaging.errors.projectRolesRequired')).toBeInTheDocument();
    expect(mockUpdateProjectMemberFn).not.toHaveBeenCalled();
  });

  it("should display validation errors if givenName and surName are empty", async () => {
    (useProjectMemberData as jest.Mock).mockReturnValue({
      projectMemberData: {
        givenName: '',
        surName: '',
        affiliationId: 'test-affiliation',
        affiliationName: 'Test University',
        otherAffiliationName: '',
        email: 'test@example.com',
        orcid: '0000-0000-0000-0000',
      },
      checkboxRoles: ['1', '2'],
      setCheckboxRoles: jest.fn(),
      loading: false,
      setProjectMemberData: jest.fn(),
      data: {
        projectMember: {
          givenName: '',
          surName: '',
          affiliation: { displayName: 'Test University', uri: 'test-affiliation' },
          email: 'test@example.com',
          orcid: '0000-0000-0000-0000',
          memberRoles: [
            { id: '1', __typename: 'MemberRole' },
            { id: '2', __typename: 'MemberRole' }
          ]
        }
      },
      queryError: null
    });

    await act(async () => {
      render(<ProjectsProjectMembersEdit />);
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveChanges/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('messaging.errors.givenNameRequired')).toBeInTheDocument();
      expect(screen.getByText('messaging.errors.surNameRequired')).toBeInTheDocument();
    });
  });

  it("should display real-time email validation error without form submission", async () => {
    const setProjectMemberDataMock = jest.fn();

    (useProjectMemberData as jest.Mock).mockReturnValue({
      projectMemberData: {
        givenName: 'Valid First Name',
        surName: 'Valid Last Name',
        affiliationId: 'test-affiliation',
        affiliationName: 'Test University',
        otherAffiliationName: '',
        email: 'invalid-email-format',
        orcid: '0000-0000-0000-0000',
      },
      checkboxRoles: ['1', '2'],
      setCheckboxRoles: jest.fn(),
      loading: false,
      setProjectMemberData: setProjectMemberDataMock,
      data: {
        projectMember: {
          givenName: 'Valid First Name',
          surName: 'Valid Last Name',
          affiliation: { uri: 'test-affiliation' },
          email: 'invalid-email-format',
          orcid: '0000-0000-0000-0000',
          memberRoles: [
            { id: '1', __typename: 'MemberRole' },
            { id: '2', __typename: 'MemberRole' }
          ]
        }
      },
      queryError: null
    });

    await act(async () => {
      render(<ProjectsProjectMembersEdit />);
    });

    const emailInput = screen.getByLabelText(/labels.email/i);
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('messaging.errors.invalidEmail')).toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: /buttons.saveChanges/i });
    fireEvent.click(saveButton);

    expect(screen.getByText('messaging.errors.invalidEmail')).toBeInTheDocument();
  });

  it("should clear validation errors when user corrects the field values", async () => {
    const setProjectMemberDataMock = jest.fn();

    (useProjectMemberData as jest.Mock).mockReturnValue({
      projectMemberData: {
        givenName: '',
        surName: '',
        affiliationId: 'test-affiliation',
        affiliationName: 'Test University',
        otherAffiliationName: '',
        email: 'test@example.com',
        orcid: '0000-0000-0000-0000',
      },
      checkboxRoles: ['1', '2'],
      setCheckboxRoles: jest.fn(),
      loading: false,
      setProjectMemberData: setProjectMemberDataMock,
      data: {
        projectMember: {
          givenName: '',
          surName: '',
          affiliation: { displayName: 'Test University', uri: 'test-affiliation' },
          email: 'test@example.com',
          orcid: '0000-0000-0000-0000',
          memberRoles: [
            { id: '1', __typename: 'MemberRole' },
            { id: '2', __typename: 'MemberRole' }
          ]
        }
      },
      queryError: null
    });

    await act(async () => {
      render(<ProjectsProjectMembersEdit />);
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveChanges/i });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText('messaging.errors.givenNameRequired')).toBeInTheDocument();
      expect(screen.getByText('messaging.errors.surNameRequired')).toBeInTheDocument();
    });

    const firstNameInput = screen.getByRole('textbox', { name: /labels.givenName/i });

    await act(async () => {
      fireEvent.change(firstNameInput, { target: { value: 'Valid First Name' } });
    });

    expect(setProjectMemberDataMock).toHaveBeenCalledWith(
      expect.objectContaining({
        givenName: 'Valid First Name'
      })
    );

    const lastNameInput = screen.getByRole('textbox', { name: /labels.surName/i });

    await act(async () => {
      fireEvent.change(lastNameInput, { target: { value: 'Valid Last Name' } });
    });

    expect(setProjectMemberDataMock).toHaveBeenCalledWith(
      expect.objectContaining({
        surName: 'Valid Last Name'
      })
    );
  });

  it("should handle field level errors returned from submitting form", async () => {
    mockUpdateProjectMemberFn.mockResolvedValueOnce({
      data: {
        updateProjectMember: {
          errors: { general: 'Error updating member' }
        }
      }
    });

    await act(async () => {
      render(<ProjectsProjectMembersEdit />);
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveChanges/i });
    fireEvent.click(saveButton);

    expect(await screen.findByText('Error updating member')).toBeInTheDocument();
  });

  it("should handle update member request errors", async () => {
    mockUpdateProjectMemberFn.mockRejectedValueOnce(new Error("Error removing member"));

    await act(async () => {
      render(<ProjectsProjectMembersEdit />);
    });

    const saveButton = screen.getByRole('button', { name: /buttons.saveChanges/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'updateProjectMember',
        expect.objectContaining({
          error: expect.anything(),
          url: { path: '/en-US/projects/1/members/1/edit' },
        })
      );
    });
  });

  it("should handle remove member", async () => {
    await act(async () => {
      render(<ProjectsProjectMembersEdit />);
    });

    const removeButton = screen.getByRole('button', { name: 'buttons.removeMember' });
    expect(removeButton).toHaveClass('danger');

    await act(async () => {
      fireEvent.click(removeButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      const heading = screen.getByRole('heading', { name: 'headings.removeProjectMember' });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('headings.removeProjectMember');

      const dialog = screen.getByRole('alertdialog');
      const modalButtons = within(dialog).getAllByRole('button');
      expect(modalButtons).toHaveLength(2);
      expect(modalButtons[0]).toHaveTextContent('buttons.cancel');
      expect(modalButtons[1]).toHaveTextContent('buttons.removeMember');
      expect(modalButtons[0]).toHaveClass('secondary');
      expect(modalButtons[1]).toHaveClass('danger');
    });

    const dialog = screen.getByRole('alertdialog');
    const deleteButton = within(dialog).getByRole('button', { name: 'buttons.removeMember' });

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/en-US/projects/1/members');
    });
  });

  it("should handle cancel button in Remove Member modal", async () => {
    await act(async () => {
      render(<ProjectsProjectMembersEdit />);
    });

    const removeButton = screen.getByRole('button', { name: 'buttons.removeMember' });

    await act(async () => {
      fireEvent.click(removeButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('alertdialog');
    const modalButtons = within(dialog).getAllByRole('button');
    expect(modalButtons).toHaveLength(2);
    expect(modalButtons[0]).toHaveTextContent('buttons.cancel');
    expect(modalButtons[1]).toHaveTextContent('buttons.removeMember');

    await act(async () => {
      fireEvent.click(modalButtons[0]);
    });

    await waitFor(() => {
      expect(dialog).not.toBeInTheDocument();
    });
  });

  it("should handle field-level errors from remove member request", async () => {
    mockRemoveProjectMemberFn.mockResolvedValueOnce({
      data: {
        removeProjectMember: {
          errors: { general: 'Error removing member' }
        }
      }
    });

    await act(async () => {
      render(<ProjectsProjectMembersEdit />);
    });

    const removeButton = screen.getByRole('button', { name: 'buttons.removeMember' });

    await act(async () => {
      fireEvent.click(removeButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    const deleteButton = within(screen.getByRole('alertdialog'))
      .getByRole('button', { name: 'buttons.removeMember' });

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    expect(await screen.findByText('Error removing member')).toBeInTheDocument();
  });

  it("should handle remove member request errors", async () => {
    mockRemoveProjectMemberFn.mockRejectedValueOnce(new Error("Error removing member"));

    await act(async () => {
      render(<ProjectsProjectMembersEdit />);
    });

    const removeButton = screen.getByRole('button', { name: 'buttons.removeMember' });

    await act(async () => {
      fireEvent.click(removeButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    const deleteButton = within(screen.getByRole('alertdialog'))
      .getByRole('button', { name: 'buttons.removeMember' });

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'removeProjectMember',
        expect.objectContaining({
          error: expect.anything(),
          url: { path: '/en-US/projects/1/members/1/edit' },
        })
      );
    });
  });

  it("should handle checkbox change", async () => {
    const setCheckboxRolesMock = jest.fn();

    (useProjectMemberData as jest.Mock).mockReturnValue({
      projectMemberData: {
        givenName: 'Test',
        surName: 'User',
        affiliationId: 'test-affiliation',
        affiliationName: 'Test University',
        otherAffiliationName: '',
        email: 'test@example.com',
        orcid: '0000-0000-0000-0000',
      },
      checkboxRoles: ['1', '2'],
      setCheckboxRoles: setCheckboxRolesMock,
      loading: false,
      setProjectMemberData: jest.fn(),
      data: {
        projectMember: {
          givenName: 'Test',
          surName: 'User',
          affiliation: { displayName: 'Test University', uri: 'test-affiliation' },
          email: 'test@example.com',
          orcid: '0000-0000-0000-0000',
          memberRoles: [
            { id: '1', __typename: 'MemberRole' },
            { id: '2', __typename: 'MemberRole' }
          ]
        }
      },
      queryError: null
    });

    render(<ProjectsProjectMembersEdit />);

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      fireEvent.click(checkbox);
    });

    expect(setCheckboxRolesMock).toHaveBeenCalled();
  });

  it("should pass accessibility checks", async () => {
    await act(async () => {
      const { container } = render(<ProjectsProjectMembersEdit />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});