import React from 'react';
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";
import { useQuery, useMutation } from '@apollo/client/react';
import {
  AddPlanMemberDocument,
  ProjectMembersDocument,
  UpdatePlanMemberDocument,
  PlanMembersDocument,
  RemovePlanMemberDocument,
} from '@/generated/graphql';
import { useParams } from 'next/navigation';
import logECS from '@/utils/clientLogger';

import ProjectsProjectPlanAdjustMembers from '../page';
import mockProjectMembers from '../__mocks__/projectMembersMock.json';
import mockPlanMembers from '../__mocks__/planMembersMock.json'
import { addPlanMemberAction } from '../actions/addPlanMemberAction';

expect.extend(toHaveNoViolations);

// __mocks__/addPlanMemberAction.ts
jest.mock('../actions/addPlanMemberAction', () => ({
  addPlanMemberAction: jest.fn()
}));


jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
}));

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));


jest.mock('next/navigation', () => ({
  useParams: jest.fn()
}));

const mockRefetch = jest.fn();

// Cast with jest.mocked utility
const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);

const setupMocks = () => {
  mockUseQuery.mockImplementation((document) => {
    if (document === ProjectMembersDocument) {
      return {
        data: mockProjectMembers,
        loading: false,
        error: undefined,
        refetch: jest.fn()
        /* eslint-disable @typescript-eslint/no-explicit-any */
      } as any;
    }
    if (document === PlanMembersDocument) {
      return {
        data: mockPlanMembers,
        loading: false,
        error: undefined,
        refetch: mockRefetch
      };
    }
    return {
      data: null,
      loading: false,
      error: undefined
    };
  });

  const mockMutationFn = jest.fn().mockResolvedValue({
    data: {
      key: 'value'
    },
  });


  mockUseMutation.mockImplementation((document) => {
    if (document === AddPlanMemberDocument) {
      return [
        mockMutationFn,
        { loading: false, error: undefined }
        /* eslint-disable @typescript-eslint/no-explicit-any */
      ] as any;
    }

    if (document === RemovePlanMemberDocument) {
      return [
        mockMutationFn,
        { loading: false, error: undefined }
        /* eslint-disable @typescript-eslint/no-explicit-any */
      ] as any;
    }

    if (document === UpdatePlanMemberDocument) {
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

describe('ProjectsProjectPlanAdjustMembers', () => {
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
    const mockUseParams = useParams as jest.Mock;
    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ projectId: 1, dmpid: 1 });
  });

  it('should render the loading state when queries are still loading', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === ProjectMembersDocument) {
        return {
          data: null,
          loading: true,
          error: undefined,
          refetch: jest.fn()
          /* eslint-disable @typescript-eslint/no-explicit-any */
        } as any;
      }
      if (document === PlanMembersDocument) {
        return {
          data: mockPlanMembers,
          loading: false,
          error: undefined
        };
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => {
      render(
        <ProjectsProjectPlanAdjustMembers />
      );
    });
    expect(screen.getByText('messaging.loading...')).toBeInTheDocument();
  });

  it('should render errors when errors from queries are returned', async () => {
    // Create stable references OUTSIDE mockImplementation
    const stableError = new Error('Error');
    const stableRefetch = jest.fn();

    const projectMembersReturn = {
      data: null,
      loading: false,
      error: stableError,
      refetch: stableRefetch
    };

    const planMembersReturn = {
      data: mockPlanMembers,
      loading: false,
      error: undefined
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === ProjectMembersDocument) {
        return projectMembersReturn as any;
      }
      if (document === PlanMembersDocument) {
        return planMembersReturn as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => {
      render(
        <ProjectsProjectPlanAdjustMembers />
      );
    });

    expect(screen.getByText('messaging.error')).toBeInTheDocument();
  });

  it('should render plan members in the correct section', async () => {
    await act(async () => {
      render(
        <ProjectsProjectPlanAdjustMembers />
      );
    });

    // Find the section with the <h2> text 'headings.h2MembersInThePlan'
    const membersInPlanSection = screen.getByRole('region', { name: 'Project members list' });
    const heading = within(membersInPlanSection).getByRole('heading', { level: 2, name: /headings.h2MembersInThePlan/i });

    const jacquesCousteau = within(membersInPlanSection).getByRole('heading', { level: 3, name: /Jacques Cousteau/i });
    const captainNemo = within(membersInPlanSection).getByRole('heading', { level: 3, name: /Captain Nemo/i });
    expect(heading).toBeInTheDocument();
    expect(jacquesCousteau).toBeInTheDocument();
    expect(captainNemo).toBeInTheDocument();
  });

  it('should handle removing a member to the plan', async () => {
    await act(async () => {
      render(
        <ProjectsProjectPlanAdjustMembers />
      );
    });

    // Find the first button with the text "labels.removeFromPlan"
    const removeMemberButton = screen.getAllByRole('button', { name: /labels.removeFromPlan/i })[0];

    // Simulate a click on the button
    await act(async () => {
      fireEvent.click(removeMemberButton);
    });
    // Find the section with the <h2> text 'headings.h2MembersNotInThePlan'
    const membersNotInPlanSection = screen.getByRole('region', { name: 'Members not in list' });
    const heading = within(membersNotInPlanSection).getByRole('heading', { level: 2, name: /headings.h2MembersNotInPlan/i });
    expect(heading).toBeInTheDocument();
    const jacquesCousteau = within(membersNotInPlanSection).getByRole('heading', { level: 3, name: /Jacques Cousteau/i });
    expect(jacquesCousteau).toBeInTheDocument();
  });

  it('should call refetch for projectsMemberQuery when an Apollo Error instance is returned from removing a member', async () => {
    const error = new Error('Apollo error occurred');

    const mockRemoveEmailResponse = jest.fn()
      .mockRejectedValueOnce(error) // First call returns an error
      .mockResolvedValueOnce({ data: { removeUserEmail: [{ errors: null }] } }); // Second call succeeds

    mockUseMutation.mockImplementation((document) => {
      if (document === RemovePlanMemberDocument) {
        return [
          mockRemoveEmailResponse,
          { loading: false, error: undefined }
          /* eslint-disable @typescript-eslint/no-explicit-any */
        ] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <ProjectsProjectPlanAdjustMembers />
      );
    });

    // Find the first button with the text "labels.removeFromPlan"
    const removeMemberButton = screen.getAllByRole('button', { name: /labels.removeFromPlan/i })[0];

    // Simulate a click on the button
    await act(async () => {
      fireEvent.click(removeMemberButton);
    });

    // Assert that refetch was called
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('should call logECS when useRemovePlanMemberMutation throws an error', async () => {

    const mockRemoveFn = jest.fn().mockRejectedValueOnce(new Error("Error"));

    mockUseMutation.mockImplementation((document) => {
      if (document === RemovePlanMemberDocument) {
        return [
          mockRemoveFn,
          { loading: false, error: undefined }
          /* eslint-disable @typescript-eslint/no-explicit-any */
        ] as any;
      }
      // Return other mutations as needed
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <ProjectsProjectPlanAdjustMembers />
      );
    });

    // Find the first button with the text "labels.removeFromPlan"
    const removeMemberButton = screen.getAllByRole('button', { name: /labels.removeFromPlan/i })[0];

    // Simulate a click on the button
    await act(async () => {
      fireEvent.click(removeMemberButton);
    });

    // Should call logECS with the error
    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'removePlanMember',
        expect.objectContaining({
          error: expect.anything(),
          url: { path: '/projects/1/dmp/1/members' },
        })
      );
    });
  });


  it('should handle adding a member to the plan', async () => {
    const mockAddPlanMemberAction = addPlanMemberAction as jest.Mock;

    // Mock the server action to return a successful response
    mockAddPlanMemberAction.mockResolvedValue({
      success: true,
      errors: [],
      data: { id: 1, name: 'Jacques Cousteau' },
    });

    await act(async () => {
      render(<ProjectsProjectPlanAdjustMembers />);
    });

    // First remove Jacques as a plan member
    const removeMemberButton = screen.getAllByRole('button', { name: /labels.removeFromPlan/i })[0];

    await act(async () => {
      fireEvent.click(removeMemberButton);
    });

    // Find the first button with the text "labels.addMemberToPlan"
    const addMemberButton = screen.getAllByRole('button', { name: /labels.addMemberToPlan/i })[0];

    // Simulate a click on the button
    await act(async () => {
      fireEvent.click(addMemberButton);
    });

    // Verify that the server action was called with the correct arguments
    expect(mockAddPlanMemberAction).toHaveBeenCalledWith({
      planId: 1, // Replace with the actual `dmpId` value in your test
      projectMemberId: expect.any(Number), // Replace with the actual member ID if known
    });

    // Verify that Jacques is added back to the "Members in the Plan" section
    const membersInPlanSection = screen.getByRole('region', { name: 'Project members list' });
    const jacquesCousteau = within(membersInPlanSection).getByRole('heading', { level: 3, name: /Jacques Cousteau/i });
    expect(jacquesCousteau).toBeInTheDocument();
  });

  it('should display error when error is returned while adding a member', async () => {
    const mockAddPlanMemberAction = addPlanMemberAction as jest.Mock;

    // Mock the server action to return a successful response
    mockAddPlanMemberAction.mockResolvedValue({
      success: false,
      errors: ['There was an error adding the member'],
      data: { id: 1, name: 'Jacques Cousteau' },
    });

    await act(async () => {
      render(<ProjectsProjectPlanAdjustMembers />);
    });

    // First remove Jacques as a plan member
    const removeMemberButton = screen.getAllByRole('button', { name: /labels.removeFromPlan/i })[0];

    await act(async () => {
      fireEvent.click(removeMemberButton);
    });

    // Find the first button with the text "labels.addMemberToPlan"
    const addMemberButton = screen.getAllByRole('button', { name: /labels.addMemberToPlan/i })[0];

    // Simulate a click on the button
    await act(async () => {
      fireEvent.click(addMemberButton);
    });

    expect(screen.getByText('There was an error adding the member')).toBeInTheDocument();
  });

  it('should handle any field-level errors returned in the data', async () => {
    const mockAddPlanMemberAction = addPlanMemberAction as jest.Mock;

    // Mock the server action to return a successful response, but with field-level errors
    mockAddPlanMemberAction.mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: 'There was an error adding the member',
          email: null,
        },
        id: 15,
        isPrimaryContact: false
      },
    });

    await act(async () => {
      render(<ProjectsProjectPlanAdjustMembers />);
    });

    // First remove Jacques as a plan member
    const removeMemberButton = screen.getAllByRole('button', { name: /labels.removeFromPlan/i })[0];

    await act(async () => {
      fireEvent.click(removeMemberButton);
    });

    // Find the first button with the text "labels.addMemberToPlan"
    const addMemberButton = screen.getAllByRole('button', { name: /labels.addMemberToPlan/i })[0];

    // Simulate a click on the button
    await act(async () => {
      fireEvent.click(addMemberButton);
    });

    expect(screen.getByText('There was an error adding the member')).toBeInTheDocument();
  });

  it('should handle updating the primary contact', async () => {

    const mockUpdatePlanMember = jest.fn().mockResolvedValueOnce({ data: { key: 'value' } });

    mockUseMutation.mockImplementation((document) => {
      if (document === UpdatePlanMemberDocument) {
        return [
          mockUpdatePlanMember,
          { loading: false, error: undefined }
          /* eslint-disable @typescript-eslint/no-explicit-any */
        ] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <ProjectsProjectPlanAdjustMembers />
      );
    });
    const changeButton = screen.getByRole('button', { name: /buttons.change/i });

    // Click the change button to expose the select dropdown
    await act(async () => {
      fireEvent.click(changeButton);
    });

    // Find the dropdown button using its aria-label
    const dropdownButton = screen.getByLabelText(/primary contact selection/i);
    await act(async () => {
      fireEvent.click(dropdownButton);
    });

    // Find the dropdown container (role="listbox")
    const listbox = screen.getByRole('listbox');

    // Find the "Captain Nemo" option (role="option") within the listbox
    const option = within(listbox).getByRole('option', { name: /Captain Nemo/i });

    // Click the "Captain Nemo" option
    await act(async () => {
      fireEvent.click(option);
    });

    const saveButton = screen.getByRole('button', { name: /buttons.save/i });

    // Click the save button
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(mockUpdatePlanMember).toHaveBeenCalledTimes(1);
    expect(mockUpdatePlanMember).toHaveBeenCalledWith({
      variables: {
        memberRoleIds: [2],
        isPrimaryContact: true,
        planMemberId: 21,
        planId: 1
      },
    });
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <ProjectsProjectPlanAdjustMembers />
    );
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
