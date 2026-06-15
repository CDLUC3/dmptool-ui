import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommentList from "../CommentList";
import type { MergedComment } from "@/app/types";
import { UserRole } from '@/generated/graphql';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock the date utils
jest.mock("@/utils/dateUtils", () => ({
  formatRelativeFromTimestamp: (timestamp: string) => {
    return `${new Date(parseInt(timestamp)).toLocaleDateString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    })} (en)`;
  },
}));


const mockComments: MergedComment[] = [
  {
    __typename: "AnswerComment",
    id: 1,
    commentText: "This is a regular comment",
    answerId: 1,
    created: "1672531200000", // Jan 1, 2023
    modified: "1672531200000",
    type: "answer",
    isAnswerComment: true,
    isFeedbackComment: false,
    user: {
      __typename: "User",
      id: 7,
      givenName: "John",
      surName: "Doe"
    },
    PlanFeedback: null,
  },
  {
    __typename: "PlanFeedbackComment",
    id: 2,
    commentText: "This is an admin feedback comment",
    answerId: 1,
    created: "1672617600000", // Jan 2, 2023
    modified: "1672704000000", // Jan 3, 2023 (edited)
    type: "feedback",
    isAnswerComment: false,
    isFeedbackComment: true,
    user: {
      __typename: "User",
      id: 1,
      givenName: "Admin",
      surName: "User"
    },
    PlanFeedback: null,
  },
  {
    __typename: "AnswerComment",
    id: 3,
    commentText: "Another user's comment",
    answerId: 1,
    created: "1672790400000", // Jan 4, 2023
    modified: "1672790400000",
    type: "answer",
    isAnswerComment: true,
    isFeedbackComment: false,
    user: {
      __typename: "User",
      id: 8,
      givenName: "Jane",
      surName: "Smith"
    },
    PlanFeedback: null,
  },
];

describe("CommentList", () => {
  const defaultProps = {
    comments: mockComments,
    editingCommentId: null,
    editingCommentText: "",
    me: {
      me: {
        id: 7,
        givenName: "John",
        surName: "Doe",
        languageId: "en",
        role: UserRole.Admin,
        emails: [],
        errors: {},
        affiliation: {
          id: 1,
          name: "Test Org",
          searchName: "test-org",
          uri: "https://test.org",
          displayName: "Test Org",
          feedbackEnabled: true,
          feedbackMessage: "Test feedback message",
          feedbackEmails: ["test@example.gov"]
        }
      }
    },
    planOwners: [1, 7], // Current user and admin are plan owners
    handleEditComment: jest.fn(),
    handleUpdateComment: jest.fn(),
    handleCancelEdit: jest.fn(),
    handleDeleteComment: jest.fn(),
    locale: "en",
    setEditingCommentText: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all comments", () => {
    render(<CommentList {...defaultProps} />);

    expect(screen.getByText("This is a regular comment")).toBeInTheDocument();
    expect(screen.getByText("This is an admin feedback comment")).toBeInTheDocument();
    expect(screen.getByText("Another user's comment")).toBeInTheDocument();
  });

  it("should display user names correctly", () => {
    render(<CommentList {...defaultProps} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("should show admin indicator for feedback comments", () => {
    render(<CommentList {...defaultProps} />);

    // Should show admin indicator for feedback comment
    expect(screen.getByText("(admin)")).toBeInTheDocument();

    // Should only appear once (only one feedback comment)
    expect(screen.getAllByText("(admin)")).toHaveLength(1);
  });

  it("should display formatted creation dates", () => {
    render(<CommentList {...defaultProps} />);

    expect(screen.getByText(/1\/1\/2023 \(en\)/)).toBeInTheDocument();
    expect(screen.getByText(/1\/2\/2023 \(en\)/)).toBeInTheDocument();
    expect(screen.getByText(/1\/4\/2023 \(en\)/)).toBeInTheDocument();
  });

  it("should show edited indicator when comment was modified", () => {
    render(<CommentList {...defaultProps} />);

    // Only the second comment has different created/modified dates
    expect(screen.getByText(/\(edited\)/)).toBeInTheDocument();
    expect(screen.getAllByText(/\(edited\)/)).toHaveLength(1);
  });

  it("should show edit button only for user's own comments", () => {
    render(<CommentList {...defaultProps} />);

    const editButtons = screen.getAllByText("buttons.edit");
    // Should only show edit button for the current user's comment (id: 7)
    expect(editButtons).toHaveLength(1);
  });

  it("should show delete button for own comments and plan owners", () => {
    render(<CommentList {...defaultProps} />);

    const deleteButtons = screen.getAllByText("buttons.delete");
    // Current user (id: 7) can delete their own comment
    // Plan owners can delete any comment
    // In our test case: user 7 is both comment owner and plan owner
    // So we should see delete buttons for comments where user is owner or plan owner
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it("should not show edit/delete buttons for non-owned comments when user is not plan owner", () => {
    const meResearcher = {
      id: 99,
      givenName: "Other",
      surName: "User",
      languageId: "en",
      role: UserRole.Admin,
      emails: [],
      errors: {},
      affiliation: {
        id: 1,
        name: "Test Org",
        searchName: "test-org",
        uri: "https://test.org",
        displayName: "Test Org",
        feedbackEnabled: true,
        feedbackMessage: "Test feedback message",
        feedbackEmails: ["test@example.gov"]
      }
    };

    const props = {
      ...defaultProps,
      me: { me: meResearcher },
      planOwners: [1], // Not a plan owner
    };

    render(<CommentList {...props} />);

    // Should not show any edit buttons (user doesn't own any comments)
    expect(screen.queryByText("buttons.edit")).not.toBeInTheDocument();

    // Should not show any delete buttons (user doesn't own comments and isn't plan owner)
    expect(screen.queryByText("buttons.delete")).not.toBeInTheDocument();
  });

  it("should call handleEditComment when edit button is clicked", async () => {
    const user = userEvent.setup();
    render(<CommentList {...defaultProps} />);

    const editButton = screen.getByText("buttons.edit");
    await user.click(editButton);

    expect(defaultProps.handleEditComment).toHaveBeenCalledWith(mockComments[0]);
  });

  it("should call handleDeleteComment when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<CommentList {...defaultProps} />);

    const deleteButtons = screen.getAllByText("buttons.delete");
    await user.click(deleteButtons[0]);

    expect(defaultProps.handleDeleteComment).toHaveBeenCalledWith(expect.any(Object));
  });

  describe("when editing a comment", () => {
    const editingProps = {
      ...defaultProps,
      editingCommentId: 1,
      editingCommentText: "Editing this comment",
    };

    it("should show textarea instead of comment text", () => {
      render(<CommentList {...editingProps} />);

      expect(screen.getByDisplayValue("Editing this comment")).toBeInTheDocument();
      expect(screen.queryByText("This is a regular comment")).not.toBeInTheDocument();
    });

    it("should show save and cancel buttons", () => {
      render(<CommentList {...editingProps} />);

      expect(screen.getByText("buttons.save")).toBeInTheDocument();
      expect(screen.getByText("buttons.cancel")).toBeInTheDocument();
    });

    it("should hide edit and delete buttons when editing", () => {
      render(<CommentList {...editingProps} />);

      // Should not show edit/delete buttons for the comment being edited
      expect(screen.queryByText("buttons.edit")).not.toBeInTheDocument();
    });

    it("should call setEditingCommentText when textarea value changes", async () => {
      render(<CommentList {...editingProps} />);

      const textarea = screen.getByDisplayValue("Editing this comment");
      fireEvent.change(textarea, { target: { value: "Updated comment text" } });

      expect(defaultProps.setEditingCommentText).toHaveBeenCalledWith("Updated comment text");
    });

    it("should call handleUpdateComment when save button is clicked", async () => {
      render(<CommentList {...editingProps} />);

      const saveButton = screen.getByText("buttons.save");
      fireEvent.click(saveButton);

      expect(defaultProps.handleUpdateComment).toHaveBeenCalledWith({
        ...mockComments[0],
        commentText: "Editing this comment",
      });
      expect(defaultProps.setEditingCommentText).not.toHaveBeenCalled();
    });

    it("should call handleCancelEdit when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(<CommentList {...editingProps} />);

      const cancelButton = screen.getByText("buttons.cancel");
      await user.click(cancelButton);

      expect(defaultProps.handleCancelEdit).toHaveBeenCalled();
    });

    it("should prevent saving empty comments", async () => {
      const user = userEvent.setup();
      const props = {
        ...editingProps,
        editingCommentText: "   ", // Whitespace only
      };

      render(<CommentList {...props} />);

      const saveButton = screen.getByText("buttons.save");
      await user.click(saveButton);

      // Should not call handleUpdateComment for empty/whitespace-only text
      expect(defaultProps.handleUpdateComment).not.toHaveBeenCalled();
      expect(defaultProps.setEditingCommentText).not.toHaveBeenCalledWith('');
    });

    it("should focus the textarea when editing starts", () => {
      render(<CommentList {...editingProps} />);

      const textarea = screen.getByDisplayValue("Editing this comment");
      expect(document.activeElement).toBe(textarea);
    });
  });

  it("should handle comments with missing user data gracefully", () => {
    const commentsWithMissingUser: MergedComment[] = [
      {
        ...mockComments[0],
        user: null,
      },
    ];

    const props = {
      ...defaultProps,
      comments: commentsWithMissingUser,
    };

    render(<CommentList {...props} />);

    // Should still render the comment text
    expect(screen.getByText("This is a regular comment")).toBeInTheDocument();
    const h4 = screen.getByRole('heading', { level: 4 });
    expect(h4).toBeInTheDocument();
    // Should handle missing user gracefully (empty name)
    expect(h4.textContent?.trim()).toBe('');
  });

  it("should handle comments with missing dates gracefully", () => {
    const commentsWithMissingDates: MergedComment[] = [
      {
        ...mockComments[0],
        created: null,
        modified: null,
      },
    ];

    const props = {
      ...defaultProps,
      comments: commentsWithMissingDates,
    };

    render(<CommentList {...props} />);

    // Should still render the comment
    expect(screen.getByText("This is a regular comment")).toBeInTheDocument();
  });

  it("should render empty list when no comments provided", () => {
    const props = {
      ...defaultProps,
      comments: [],
    };

    const { container } = render(<CommentList {...props} />);

    // Should render without crashing
    expect(container.firstChild).toBeNull();
  });

  it("should handle plan owners being null", () => {
    const props = {
      ...defaultProps,
      planOwners: null,
    };

    render(<CommentList {...props} />);

    // Should still render comments
    expect(screen.getByText("This is a regular comment")).toBeInTheDocument();

    // Should show edit button for own comment
    expect(screen.getByText("buttons.edit")).toBeInTheDocument();
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(<CommentList {...defaultProps} />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading questions...')).not.toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});