// hooks/useComments.ts
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/context/ToastContext';
import {
  addAnswerCommentAction,
  addFeedbackCommentAction,
  removeAnswerCommentAction,
  removeFeedbackCommentAction,
  updateAnswerCommentAction,
  updateFeedbackCommentAction
} from '@/app/actions';

import { MergedComment } from '@/app/types';
import { MeQuery } from '@/generated/graphql';

type AddCommentData = {
  id: number;
  answerId: number;
  commenText: string;
  errors?: { [key: string]: string | null } | null;
};

export interface AnswerComment {
  __typename?: "AnswerComment";
  id?: number | null;
  commentText: string;
  answerId: number;
  created?: string | null;
  createdById?: number | null;
  modified?: string | null;
  user?: {
    __typename?: "User";
    id?: number | null;
    surName?: string | null;
    givenName?: string | null;
  } | null | undefined;
}

export interface FeedbackComment {
  __typename?: "PlanFeedbackComment";
  id?: number | null;
  commentText?: string | null;
  created?: string | null;
  createdById?: number | null;
  answerId?: number | null;
  modified?: string | null;
  PlanFeedback?: {
    __typename?: "PlanFeedback";
    id?: number | null;
  } | null;
  user?: {
    __typename?: "User";
    id?: number | null;
    surName?: string | null;
    givenName?: string | null;
  } | null | undefined
}

interface UseCommentsProps {
  dmpId: string;
  planFeedbackId?: number | null;
  me?: MeQuery | null | undefined;
  planOrgId?: string;
  openFeedbackRounds?: boolean;
  planOwners?: number[] | null;
  collaborators?: number[];
}

interface MutationErrorsInterface {
  general: string | null;
}

export const useComments = ({
  dmpId,
  planFeedbackId,
  me,
  planOrgId,
  openFeedbackRounds,
  planOwners,
  collaborators
}: UseCommentsProps) => {
  const router = useRouter();
  const toastState = useToast();
  const Global = useTranslations('Global');
  const t = useTranslations('PlanOverviewQuestionPage');

  // Comment states
  const [mergedComments, setMergedComments] = useState<MergedComment[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<number | null | undefined>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>('');
  const [canAddComments, setCanAddComments] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Helper functions
  const hasFieldLevelErrors = (mutationErrors: MutationErrorsInterface): boolean => {
    return Object.values(mutationErrors).some(
      value => value !== null && value !== undefined
    );
  };

  const getExtractedErrorValues = (mutationErrors: MutationErrorsInterface): string[] => {
    return Object.values(mutationErrors).filter(
      (value) => value !== null && value !== undefined
    );
  };

  // Determine if user can add comments
  const updateCanAddComments = useCallback(() => {
    if (!me) return;

    // Is this user an admin?
    if (['ADMIN', 'SUPERADMIN'].includes(me?.me?.role as string)) {
      // Does this admin belong to the same org as plan, and are there any feedback rounds open?
      const meURI = me?.me?.affiliation?.uri;
      if ((meURI === planOrgId) && openFeedbackRounds) {
        setCanAddComments(true);
        return;
      }
    }

    // If the current user is a project collaborator or plan owner
    const userId = me?.me?.id as number;
    if (collaborators?.includes(userId) || planOwners?.includes(userId)) {
      setCanAddComments(true);
      return;
    }

    setCanAddComments(false);
  }, [me, planOrgId, openFeedbackRounds, collaborators, planOwners]);

  // Add comment action
  const addComment = async (comment: MergedComment) => {
    let response;
    if (comment.isAnswerComment) {
      response = await addAnswerCommentAction({
        answerId: Number(comment?.answerId),
        commentText: comment?.commentText ?? ''
      });
    } else if (planFeedbackId) {
      response = await addFeedbackCommentAction({
        planId: Number(dmpId),
        planFeedbackId,
        answerId: Number(comment?.answerId),
        commentText: comment?.commentText ?? ''
      });
    }

    if (response?.redirect) {
      router.push(response.redirect);
    }

    return {
      success: response?.success ?? false,
      errors: response?.errors ?? [Global('messaging.somethingWentWrong')],
      data: response?.data ?? null
    };
  };


  // Delete comment action
  const deleteComment = async (comment: MergedComment) => {
    let response;

    if (comment.isAnswerComment) {
      response = await removeAnswerCommentAction({
        answerId: Number(comment?.answerId),
        answerCommentId: Number(comment?.id)
      });
    } else {
      response = await removeFeedbackCommentAction({
        planId: Number(dmpId),
        planFeedbackCommentId: Number(comment?.id)
      });
    }

    if (response?.redirect) {
      router.push(response.redirect);
    }

    return {
      success: response?.success ?? false,
      errors: response?.errors ?? [Global('messaging.somethingWentWrong')],
      data: response?.data ?? null
    };
  };

  // Update comment action
  const updateComment = async (comment: MergedComment) => {
    let response;
    if (comment.isAnswerComment) {
      response = await updateAnswerCommentAction({
        answerId: Number(comment?.answerId),
        answerCommentId: Number(comment?.id),
        commentText: editingCommentText
      });
    } else {
      response = await updateFeedbackCommentAction({
        planId: Number(dmpId),
        planFeedbackCommentId: Number(comment?.id),
        commentText: editingCommentText
      });
    }

    if (response?.redirect) {
      router.push(response.redirect);
    }

    return {
      success: response?.success ?? false,
      errors: response?.errors ?? [Global('messaging.somethingWentWrong')],
      data: response?.data ?? null
    };
  };

  // Event handlers
  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>, answerId: number, newComment: string): Promise<void> => {
    e.preventDefault();
    let optimisticComment: MergedComment;
    const tempId = Date.now() * -1;

    // Determine comment type based on user role and feedback rounds
    if ((['ADMIN', 'SUPERADMIN'].includes(me?.me?.role as string)) && planOrgId && openFeedbackRounds) {
      optimisticComment = {
        __typename: 'PlanFeedbackComment',
        id: tempId,
        commentText: newComment,
        answerId,
        created: new Date().getTime().toString(),
        createdById: me?.me?.id,
        modified: new Date().getTime().toString(),
        type: 'feedback',
        isAnswerComment: false,
        isFeedbackComment: true,
        user: {
          __typename: 'User',
          id: me?.me?.id,
          givenName: me?.me?.givenName,
          surName: me?.me?.surName
        },
        PlanFeedback: null
      };
    } else {
      optimisticComment = {
        __typename: 'AnswerComment',
        id: tempId,
        commentText: newComment,
        answerId,
        created: new Date().getTime().toString(),
        createdById: me?.me?.id,
        modified: new Date().getTime().toString(),
        type: 'answer',
        isAnswerComment: true,
        isFeedbackComment: false,
        user: {
          __typename: 'User',
          id: me?.me?.id,
          givenName: me?.me?.givenName,
          surName: me?.me?.surName
        },
        PlanFeedback: null
      };
    }

    const originalComments = [...mergedComments];

    // Optimistic update
    setMergedComments(prev => [...prev, optimisticComment].sort((a, b) => {
      return parseInt(a.created || '0', 10) - parseInt(b.created || '0', 10);
    }));

    // Call mutation
    const result = await addComment(optimisticComment);

    if (!result?.success) {
      setMergedComments(originalComments);
      const errors = result?.errors;
      if (errors) {
        setErrors(errors);
      }
    } else if (result.data?.errors && hasFieldLevelErrors(result.data.errors as unknown as MutationErrorsInterface)) {
      const mutationErrors = result.data.errors as unknown as MutationErrorsInterface;
      const extractedErrors = getExtractedErrorValues(mutationErrors);
      setMergedComments(originalComments);
      setErrors(extractedErrors);
    } else {
      toastState.add(t('messages.commentSent'), { type: 'success', timeout: 3000 });

      // Take the optimistic comment and replace tempId with actual ID from server
      const savedComment = result?.data as AddCommentData;

      if (savedComment?.id) {
        const newId = savedComment?.id;

        setMergedComments(prev =>
          prev.map(c =>
            c.id === tempId ? { ...c, id: newId } : c
          )
        );
      }
    }
  };

  const handleDeleteComment = async (comment: MergedComment) => {

    const originalComments = [...mergedComments];

    // Optimistic update
    setMergedComments(prev => prev.filter(c => c.id !== comment.id));

    const result = await deleteComment(comment);

    if (!result.success) {
      setMergedComments(originalComments);
      const errors = result.errors;
      if (errors) {
        setErrors(errors);
      }
    } else if (result.data?.errors && hasFieldLevelErrors(result.data.errors as unknown as MutationErrorsInterface)) {
      const mutationErrors = result.data.errors as unknown as MutationErrorsInterface;
      const extractedErrors = getExtractedErrorValues(mutationErrors);
      setMergedComments(originalComments);
      setErrors(extractedErrors);
    } else {
      toastState.add(t('messages.commentDeleted'), { type: 'success', timeout: 3000 });
    }
  };

  const handleEditComment = (comment: MergedComment) => {
    setEditingCommentId(comment?.id);
    setEditingCommentText(comment?.commentText || '');
  };

  const handleUpdateComment = async (comment: MergedComment) => {
    const updatedComment: MergedComment = {
      ...comment,
      commentText: editingCommentText,
      modified: new Date().getTime().toString(),
    };

    const originalComment = { ...comment };

    // Optimistic update
    setMergedComments(prev =>
      prev.map(c =>
        c.id === comment.id ? updatedComment : c
      )
    );

    const result = await updateComment(comment);

    if (!result.success) {
      // Rollback optimistic update
      setMergedComments(prev =>
        prev.map(c => c.id === comment.id ? originalComment : c)
      );
      const errors = result.errors;
      if (errors) {
        setErrors(errors);
      }
    } else if (result.data?.errors && hasFieldLevelErrors(result.data.errors as unknown as MutationErrorsInterface)) {
      // Rollback optimistic update
      setMergedComments(prev =>
        prev.map(c => c.id === comment.id ? originalComment : c)
      );
      const mutationErrors = result.data.errors as unknown as MutationErrorsInterface;
      const extractedErrors = getExtractedErrorValues(mutationErrors);
      setErrors(extractedErrors);
    } else {
      setEditingCommentId(null);
      setEditingCommentText('');
      toastState.add(t('messages.commentUpdated'), { type: 'success', timeout: 3000 });
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  // Utility function to set merged comments (for external use)
  const setCommentsFromData = (
    answerComments: AnswerComment[] | undefined | null,
    feedbackComments: FeedbackComment[] | undefined | null
  ) => {
    const merged: MergedComment[] = [
      ...(answerComments || []).map(comment => ({
        ...comment,
        type: 'answer' as const,
        isAnswerComment: true as const,
        isFeedbackComment: false as const
      })),
      ...(feedbackComments || []).map(comment => ({
        ...comment,
        type: 'feedback' as const,
        isAnswerComment: false as const,
        isFeedbackComment: true as const
      }))
    ].sort((a, b) => {
      if (!a.created && !b.created) return 0;
      if (!a.created) return 1;
      if (!b.created) return -1;
      return parseInt(a.created, 10) - parseInt(b.created, 10);
    });

    setMergedComments(merged);
  };

  return {
    // State
    mergedComments,
    editingCommentId,
    editingCommentText,
    canAddComments,
    errors,

    // Setters
    setEditingCommentText,
    setCommentsFromData,
    updateCanAddComments,

    // Handlers
    handleAddComment,
    handleDeleteComment,
    handleEditComment,
    handleUpdateComment,
    handleCancelEdit
  };
};
