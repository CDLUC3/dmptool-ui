import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommentsDrawer from "../CommentsDrawer";
import type { MergedComment } from "@/app/types";
import type { CommentsDrawerProps } from "../CommentsDrawer"; // Import the props type
import { UserRole } from '@/generated/graphql';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock translations
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key, // return key as translation
}));

// Mock DrawerPanel (to avoid focusing/portal complexity)
jest.mock("@/components/Container", () => ({
  /*eslint-disable @typescript-eslint/no-explicit-any */
  DrawerPanel: ({ children, title, isOpen }: any) =>
    isOpen ? (
      <div data-testid="drawer">
        <h1>{title}</h1>
        {children}
      </div>
    ) : null,
}));

// Mock CommentList to simplify
jest.mock("../CommentList", () => {
  /*eslint-disable @typescript-eslint/no-explicit-any */
  const MockCommentList = (props: any) => (
    <div data-testid="comment-list">
      {props.comments.map((c: MergedComment) => (
        <p key={c.id}>{c.commentText}</p>
      ))}
    </div>
  );
  MockCommentList.displayName = "MockCommentList";
  return MockCommentList;
});

const mergedComments: MergedComment[] = [
  {
    __typename: "AnswerComment",
    id: 11,
    commentText: "adding a comment",
    answerId: 1,
    created: "1755544243000",
    modified: "1755544243000",
    type: "answer",
    isAnswerComment: true,
    isFeedbackComment: false,
    user: { __typename: "User", id: 7, givenName: "UCD", surName: "Researcher" },
    PlanFeedback: null,
  },
  {
    __typename: "PlanFeedbackComment",
    id: 48,
    commentText: "Adding a new comment123",
    answerId: 1,
    created: "1755557417905",
    modified: "1755557423554",
    type: "feedback",
    isAnswerComment: false,
    isFeedbackComment: true,
    user: { __typename: "User", id: 1, givenName: "Super", surName: "Admin" },
    PlanFeedback: null,
  },
];

// MeQuery mock
const createMockMeQuery = (overrides = {}) => ({
  me: {
    id: 1,
    givenName: "Test",
    surName: "User",
    languageId: "en",
    role: UserRole.Admin,
    emails: [
      {
        id: 1,
        email: "test@example.com",
        isPrimary: true,
        isConfirmed: true
      }
    ],
    errors: {
      general: null,
      email: null,
      password: null,
      role: null
    },
    affiliation: {
      id: 1,
      name: "Test Organization",
      displayName: "Test Organization",
      searchName: "test-organization",
      uri: "https://test.org",
      feedbackEnabled: true,
      feedbackMessage: "Test feedback message",
      feedbackEmails: ["test@example.gov"]
    },
    ...overrides
  }
});

describe("CommentsDrawer", () => {
  const defaultProps: CommentsDrawerProps = {
    isCommentsDrawerOpen: true,
    closeCurrentDrawer: jest.fn(),
    openCommentsButtonRef: { current: null },
    mergedComments,
    editingCommentId: null,
    editingCommentText: "",
    setEditingCommentText: jest.fn(),
    handleUpdateComment: jest.fn(),
    handleCancelEdit: jest.fn(),
    handleEditComment: jest.fn(),
    handleDeleteComment: jest.fn(),
    me: createMockMeQuery(),
    planOwners: [1, 2, 3],
    locale: "en",
    commentsEndRef: { current: null },
    canAddComments: true,
    handleAddComment: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock scrollIntoView for all elements
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  it("should render merged comments when drawer is open", () => {
    render(<CommentsDrawer {...defaultProps} />);

    expect(screen.getByTestId("drawer")).toBeInTheDocument();
    expect(screen.getByTestId("comment-list")).toBeInTheDocument();

    // Check that comment texts render
    expect(screen.getByText("adding a comment")).toBeInTheDocument();
    expect(screen.getByText("Adding a new comment123")).toBeInTheDocument();
  });

  it("should not render when drawer is closed", () => {
    const props = { ...defaultProps, isCommentsDrawerOpen: false };
    render(<CommentsDrawer {...props} />);

    expect(screen.queryByTestId("drawer")).not.toBeInTheDocument();
  });

  it("should render comment form when canAddComments is true", () => {
    render(<CommentsDrawer {...defaultProps} />);

    expect(screen.getByTestId("new-comment-textarea")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "buttons.comment" })).toBeInTheDocument();
    expect(screen.getByText("Test User (you)")).toBeInTheDocument();
  });

  it("should not render comment form when canAddComments is false", () => {
    const props = { ...defaultProps, canAddComments: false };
    render(<CommentsDrawer {...props} />);

    expect(screen.queryByTestId("new-comment-textarea")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "buttons.comment" })).not.toBeInTheDocument();
  });

  it("should submit a new comment with valid text", async () => {
    const user = userEvent.setup();
    render(<CommentsDrawer {...defaultProps} />);

    const textarea = screen.getByTestId("new-comment-textarea");
    const submitButton = screen.getByRole("button", { name: "buttons.comment" });

    await user.type(textarea, "New test comment");
    await user.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.handleAddComment).toHaveBeenCalledWith(
        expect.any(Object), // form event
        "New test comment"
      );
    });

    // Check that textarea is cleared after submission
    expect(textarea).toHaveValue("");
  });

  it("should prevent submitting empty comment", async () => {
    const user = userEvent.setup();
    render(<CommentsDrawer {...defaultProps} />);

    const submitButton = screen.getByRole("button", { name: "buttons.comment" });

    // Try to submit with empty textarea
    await user.click(submitButton);

    expect(defaultProps.handleAddComment).not.toHaveBeenCalled();
  });

  it("should prevent submitting whitespace-only comment", async () => {
    const user = userEvent.setup();
    render(<CommentsDrawer {...defaultProps} />);

    const textarea = screen.getByTestId("new-comment-textarea");
    const submitButton = screen.getByRole("button", { name: "buttons.comment" });

    await user.type(textarea, "   \n\t  ");
    await user.click(submitButton);

    expect(defaultProps.handleAddComment).not.toHaveBeenCalled();
  });

  it("should update textarea value when typing", async () => {
    const user = userEvent.setup();
    render(<CommentsDrawer {...defaultProps} />);

    const textarea = screen.getByTestId("new-comment-textarea");

    await user.type(textarea, "Test comment text");

    expect(textarea).toHaveValue("Test comment text");
  });

  it("should handle form submission via Enter key", async () => {
    const user = userEvent.setup();
    render(<CommentsDrawer {...defaultProps} />);

    const textarea = screen.getByTestId("new-comment-textarea");

    await user.type(textarea, "New comment via enter");

    // Submit form by pressing Enter while focused on submit button
    const form = textarea.closest("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(defaultProps.handleAddComment).toHaveBeenCalledWith(
        expect.any(Object),
        "New comment via enter"
      );
    });
  });

  it("should render user name correctly when \'me\' is provided", () => {
    render(<CommentsDrawer {...defaultProps} />);

    expect(screen.getByText("Test User (you)")).toBeInTheDocument();
  });

  it("should render empty user name when \'me\' is null", () => {
    const props = { ...defaultProps, me: null };
    render(<CommentsDrawer {...props} />);

    expect(screen.getByText(/(you)/i)).toBeInTheDocument();
  });

  it("should render empty user name when \'me.me\' is null", () => {
    const props = { ...defaultProps, me: { me: null } };
    render(<CommentsDrawer {...props} />);

    expect(screen.getByText(/(you)/i)).toBeInTheDocument();
  });

  it("should pass correct props to CommentList", () => {
    render(<CommentsDrawer {...defaultProps} />);

    const commentList = screen.getByTestId("comment-list");
    expect(commentList).toBeInTheDocument();

    // Verify comments are passed through (our mock renders comment text)
    expect(screen.getByText("adding a comment")).toBeInTheDocument();
    expect(screen.getByText("Adding a new comment123")).toBeInTheDocument();
  });

  it("should call handleAddComment and clear textarea optimistically", async () => {
    const user = userEvent.setup();
    // Mock a successful response
    const handleAddCommentMock = jest.fn().mockResolvedValue(undefined);
    const props = { ...defaultProps, handleAddComment: handleAddCommentMock };

    render(<CommentsDrawer {...props} />);

    const textarea = screen.getByTestId("new-comment-textarea");
    const submitButton = screen.getByRole("button", { name: "buttons.comment" });

    await user.type(textarea, "Test comment");
    await user.click(submitButton);

    // Verify handleAddComment was called
    await waitFor(() => {
      expect(handleAddCommentMock).toHaveBeenCalledWith(
        expect.any(Object),
        "Test comment"
      );
    });

    // Textarea should be cleared immediately (optimistic UX)
    expect(textarea).toHaveValue("");
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(<CommentsDrawer {...defaultProps} />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading questions...')).not.toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});