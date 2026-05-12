import { renderHook, act, waitFor } from '@testing-library/react';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import * as actions from '../../actions';
import { UserRole } from '@/generated/graphql';
import { useComments, AnswerComment, FeedbackComment } from '../useComments';
import { MergedComment } from '@/app/types';


// Mock the useRouter from next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
const mockToast = { add: jest.fn() };

// Mock Server Actions
jest.mock('@/app/actions', () => ({
  addAnswerCommentAction: jest.fn().mockResolvedValue({ success: true, errors: [], data: { id: 123 } }),
  addFeedbackCommentAction: jest.fn().mockResolvedValue({ success: true, errors: [], data: { id: 456 } }),
  removeAnswerCommentAction: jest.fn().mockResolvedValue({ success: true, errors: [], data: {} }),
  removeFeedbackCommentAction: jest.fn().mockResolvedValue({ success: true, errors: [], data: {} }),
  updateAnswerCommentAction: jest.fn().mockResolvedValue({ success: true, errors: [], data: {} }),
  updateFeedbackCommentAction: jest.fn().mockResolvedValue({ success: true, errors: [], data: {} }),
}));

describe('useComments', () => {
  let mockRouter;

  beforeEach(() => {
    jest.clearAllMocks();   // resets call history
    jest.resetModules();    // resets module state if needed
    (useToast as jest.Mock).mockReturnValue(mockToast);

    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  const me = {
    me: {
      id: 1,
      givenName: 'Test',
      surName: 'User',
      role: UserRole.Admin,
      languageId: 'en',
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
        searchName: "test-organization",
        uri: "https://test.org",
        displayName: "Test Organization",
        feedbackEnabled: true,
        feedbackMessage: "Test feedback message",
        feedbackEmails: ["test@example.gov"]
      },
    }
  };

  it('should allow admin to add comments', async () => {
    const { result } = renderHook(() =>
      useComments({
        dmpId: '1',
        planFeedbackId: 10,
        me,
        planOrgId: 'org1',
        openFeedbackRounds: true,
        planOwners: [1],
        collaborators: [1]
      })
    );

    // Simulate canAddComments logic
    act(() => {
      result.current.updateCanAddComments();
    });
    expect(result.current.canAddComments).toBe(true);

    // Simulate adding a comment
    await act(async () => {
      const fakeEvent = { preventDefault: () => { } } as unknown as React.FormEvent<HTMLFormElement>;
      await result.current.handleAddComment(
        fakeEvent,
        1,
        'New comment'
      );
    });

    expect(result.current.mergedComments.length).toBe(1);
    expect(result.current.mergedComments[0].commentText).toBe('New comment');
  });


  it('should optimistically remove and restore comments on delete failure', async () => {
    // Mock the delete action to fail
    (actions.removeAnswerCommentAction as jest.Mock).mockResolvedValueOnce({
      success: false,
      errors: ['fail'],
      data: {}
    });

    const { result } = renderHook(() =>
      useComments({ dmpId: '1', me })
    );

    // First, add a comment so there's something to delete
    await act(async () => {
      const fakeEvent = { preventDefault: () => { } } as unknown as React.FormEvent<HTMLFormElement>;

      await result.current.handleAddComment(
        fakeEvent,
        1,
        'Comment to delete'
      );
    });
    // Grab the comment that was just added
    const commentToDelete = result.current.mergedComments[0];
    expect(commentToDelete).toBeDefined();

    // Call handleDeleteComment with the comment
    await act(async () => {
      await result.current.handleDeleteComment(commentToDelete);
    });

    // Check optimistic rollback happened
    expect(result.current.mergedComments.length).toBe(1);
    expect(result.current.errors).toContain('fail');
  });

  it('should redirect if remove response contains a redirect', async () => {
    (actions.removeAnswerCommentAction as jest.Mock).mockResolvedValueOnce({
      success: false,
      errors: ['fail'],
      data: {},
      redirect: '/new-url'
    });


    const { result } = renderHook(() =>
      useComments({ dmpId: '1', me })
    );

    // First, add a comment so there's something to delete
    await act(async () => {
      const fakeEvent = { preventDefault: () => { } } as unknown as React.FormEvent<HTMLFormElement>;

      await result.current.handleAddComment(
        fakeEvent,
        1,
        'Comment to delete'
      );
    });

    // Grab the comment that was just added
    const commentToDelete = result.current.mergedComments[0];
    expect(commentToDelete).toBeDefined();

    // Call handleDeleteComment with the comment
    await act(async () => {
      await result.current.handleDeleteComment(commentToDelete);
    });
    // Verify that router.push was called with "/new-url"
    expect(mockRouter.push).toHaveBeenCalledWith('/new-url');
  });

  it('should call removeFeedbackCommentAction when planFeedbackId exists', async () => {
    // Mock the feedback comment delete API
    (actions.removeFeedbackCommentAction as jest.Mock).mockResolvedValueOnce({
      success: true,
      errors: [],
      data: {}
    });

    const planFeedbackId = 42;
    const { result } = renderHook(() =>
      useComments({
        dmpId: '1',
        me,
        planFeedbackId
      })
    );
    const feedbackComment: MergedComment = {
      __typename: 'PlanFeedbackComment',
      id: 456,
      commentText: 'Feedback comment',
      answerId: null,
      type: 'feedback',
      isAnswerComment: false,
      isFeedbackComment: true,
      PlanFeedback: {},       // any non-null value triggers the planFeedback path
      created: Date.now().toString(),
      modified: Date.now().toString(),
      user: { id: 1, givenName: 'Test', surName: 'User', __typename: 'User' }
    };
    await act(async () => {
      await result.current.handleDeleteComment(feedbackComment);
    });

    expect(actions.removeFeedbackCommentAction).toHaveBeenCalledWith({
      planId: Number(1),
      planFeedbackCommentId: 456
    });

  });

  it('should call updateAnswerCommentAction when planFeedbackId exists', async () => {
    // Mock the feedback comment delete API
    (actions.updateFeedbackCommentAction as jest.Mock).mockResolvedValueOnce({
      success: true,
      errors: [],
      data: {},
    });
    const planFeedbackId = 42;
    const { result } = renderHook(() =>
      useComments({
        dmpId: '1',
        me,
        planFeedbackId,
        planOrgId: 'org1',
        openFeedbackRounds: true
      })
    );

    await act(async () => {
      result.current.setEditingCommentText('Feedback comment');
    });

    const feedbackComment: MergedComment = {
      __typename: 'PlanFeedbackComment',
      id: 456,
      commentText: 'Feedback comment',
      answerId: null,
      type: 'feedback',
      isAnswerComment: false,
      isFeedbackComment: true,
      PlanFeedback: {},       // any non-null value triggers the planFeedback path
      created: Date.now().toString(),
      modified: Date.now().toString(),
      user: { id: 1, givenName: 'Test', surName: 'User', __typename: 'User' }
    };
    await act(async () => {
      await result.current.handleUpdateComment(feedbackComment);
    });
    // Assertions
    expect(actions.updateFeedbackCommentAction).toHaveBeenCalledWith({
      planId: 1,
      planFeedbackCommentId: 456,
      commentText: "Feedback comment"
    });

  });

  it('should roll back optimistic add when API fails', async () => {
    (actions.addAnswerCommentAction as jest.Mock).mockResolvedValueOnce({
      success: false,
      errors: ['fail'],
      data: {},
    });
    const { result } = renderHook(() =>
      useComments({ dmpId: '1', me })
    );

    await act(async () => {
      const fakeEvent = { preventDefault: () => { } } as unknown as React.FormEvent<HTMLFormElement>;
      await result.current.handleAddComment(
        fakeEvent,
        1,
        'Failing comment'
      );
    });

    expect(result.current.mergedComments.length).toBe(0);
    expect(result.current.errors).toEqual(["fail"]);
  });

  it('should redirect if response contains a redirect', async () => {
    (actions.addAnswerCommentAction as jest.Mock).mockResolvedValueOnce({
      success: false,
      errors: ['fail'],
      data: {},
      redirect: '/new-url'
    });
    const { result } = renderHook(() =>
      useComments({ dmpId: '1', me })
    );

    await act(async () => {
      const fakeEvent = { preventDefault: () => { } } as unknown as React.FormEvent<HTMLFormElement>;
      await result.current.handleAddComment(
        fakeEvent,
        1,
        'Failing comment'
      );
    });
    // Verify that router.push was called with "/new-url"
    expect(mockRouter.push).toHaveBeenCalledWith('/new-url');
  });

  it('should roll back optimistic add when mutation returns field errors', async () => {
    (actions.addAnswerCommentAction as jest.Mock).mockResolvedValueOnce({
      success: true,
      errors: [],
      data: { errors: { general: 'field error' } }
    });

    const { result } = renderHook(() =>
      useComments({ dmpId: '1', me })
    );

    await act(async () => {
      const fakeEvent = { preventDefault: () => { } } as unknown as React.FormEvent<HTMLFormElement>;
      await result.current.handleAddComment(
        fakeEvent,
        1,
        'Bad comment'
      );
    });

    expect(result.current.mergedComments.length).toBe(0);
    expect(result.current.errors).toContain('field error');
  });

  it('should replace tempId with real id on successful add', async () => {
    const { result } = renderHook(() =>
      useComments({ dmpId: '1', me })
    );

    await act(async () => {
      const fakeEvent = { preventDefault: () => { } } as unknown as React.FormEvent<HTMLFormElement>;
      await result.current.handleAddComment(
        fakeEvent,
        1,
        'Real id comment'
      );
    });

    const saved = result.current.mergedComments[0];
    expect(saved.id).toBe(123);
  });

  it('should delete comment successfully and show toast', async () => {
    const { result } = renderHook(() =>
      useComments({ dmpId: '1', me })
    );

    await act(async () => {
      const fakeEvent = { preventDefault: () => { } } as unknown as React.FormEvent<HTMLFormElement>;
      await result.current.handleAddComment(
        fakeEvent,
        1,
        'Delete me'
      );
    });

    await waitFor(() => {
      expect(result.current.mergedComments.length).toBe(1);
    });

    const comment = result.current.mergedComments[0];

    await act(async () => {
      await result.current.handleDeleteComment(comment);
    });

    // wait for the state update to complete
    await waitFor(() => {
      expect(result.current.mergedComments.length).toBe(0);
    });

    // check toast calls in order
    expect(mockToast.add).toHaveBeenNthCalledWith(
      1,
      'messages.commentSent',
      expect.objectContaining({ type: 'success' })
    );
    expect(mockToast.add).toHaveBeenNthCalledWith(
      2,
      'messages.commentDeleted',
      expect.objectContaining({ type: 'success' })
    );
  });

  it('should update comment successfully and clear edit state', async () => {
    const { result } = renderHook(() =>
      useComments({ dmpId: '1', me })
    );

    // Add a comment
    await act(async () => {
      const fakeEvent = { preventDefault: () => { } } as unknown as React.FormEvent<HTMLFormElement>;
      await result.current.handleAddComment(
        fakeEvent,
        1,
        'Old text'
      );
    });
    const comment = result.current.mergedComments[0];

    // Start editing
    act(() => {
      result.current.handleEditComment(comment);
    });

    await act(async () => {
      result.current.setEditingCommentText('Updated text');
    });

    // Save
    await act(async () => {
      await result.current.handleUpdateComment(comment);
    });

    expect(result.current.mergedComments[0].commentText).toBe('Updated text');
    expect(result.current.editingCommentId).toBe(null);
  });

  it('should roll back optimistic update on failure', async () => {
    (actions.updateAnswerCommentAction as jest.Mock).mockResolvedValueOnce({
      success: false,
      errors: ['fail'],
      data: {},
    });
    const { result } = renderHook(() =>
      useComments({ dmpId: '1', me })
    );

    await act(async () => {
      const fakeEvent = { preventDefault: () => { } } as unknown as React.FormEvent<HTMLFormElement>;
      await result.current.handleAddComment(
        fakeEvent,
        1,
        'Initial text'
      );
    });
    const comment = result.current.mergedComments[0];

    act(() => result.current.handleEditComment(comment));

    await act(async () => {
      // set the new text
      result.current.setEditingCommentText('New text');
      // then call update
      await result.current.handleUpdateComment(comment);
    });

    await waitFor(() => {
      expect(result.current.errors).toContain('fail');
      expect(result.current.mergedComments[0].commentText).toBe('Initial text');
    });

  });

  it('should redirect if update response includes a redirect', async () => {
    (actions.updateAnswerCommentAction as jest.Mock).mockResolvedValueOnce({
      success: false,
      errors: ['fail'],
      data: {},
      redirect: '/new-url'
    });
    const { result } = renderHook(() =>
      useComments({ dmpId: '1', me })
    );

    await act(async () => {
      const fakeEvent = { preventDefault: () => { } } as unknown as React.FormEvent<HTMLFormElement>;
      await result.current.handleAddComment(
        fakeEvent,
        1,
        'Initial text'
      );
    });
    const comment = result.current.mergedComments[0];

    act(() => result.current.handleEditComment(comment));

    await act(async () => {
      // set the new text
      result.current.setEditingCommentText('New text');
      // then call update
      await result.current.handleUpdateComment(comment);
    });

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/new-url');
    });

  });

  it('should enter and cancel edit mode', async () => {
    const { result } = renderHook(() =>
      useComments({ dmpId: '1', me })
    );

    await act(async () => {
      const fakeEvent = { preventDefault: () => { } } as unknown as React.FormEvent<HTMLFormElement>;

      await result.current.handleAddComment(
        fakeEvent,
        1,
        'Comment to delete'
      );
    });
    // Grab the comment that was just added
    const commentToEdit = result.current.mergedComments[0];
    act(() => result.current.handleEditComment(commentToEdit));
    expect(result.current.editingCommentId).toBe(123);

    act(() => result.current.handleCancelEdit());
    expect(result.current.editingCommentId).toBe(null);
    expect(result.current.editingCommentText).toBe('');
  });

  it('should merge and sort answer + feedback comments', () => {
    const { result } = renderHook(() =>
      useComments({ dmpId: '1', me })
    );

    const answerComments = [{ id: 1, commentText: 'Answer', created: '10', answerId: 1 }] as AnswerComment[];
    const feedbackComments = [{ id: 2, commentText: 'Feedback', created: '5' }] as FeedbackComment[];

    act(() => result.current.setCommentsFromData(answerComments, feedbackComments));

    expect(result.current.mergedComments[0].commentText).toBe('Feedback'); // earlier created
    expect(result.current.mergedComments[1].commentText).toBe('Answer');
  });

  it('should set canAddComments true for collaborator', () => {
    const meResearcher = {
      me: {
        ...me.me,
        id: 2,
        role: UserRole.Researcher
      }
    };
    const { result } = renderHook(() =>
      useComments({
        dmpId: '1',
        me: meResearcher,
        collaborators: [2]
      })
    );

    act(() => result.current.updateCanAddComments());
    expect(result.current.canAddComments).toBe(true);
  });

  it('should set canAddComments false when user not allowed', () => {
    const meResearcher = {
      me: {
        ...me.me,
        id: 3,
        role: UserRole.Researcher
      }
    };
    const { result } = renderHook(() =>
      useComments({ dmpId: '1', me: meResearcher })
    );

    act(() => result.current.updateCanAddComments());
    expect(result.current.canAddComments).toBe(false);
  });

});
