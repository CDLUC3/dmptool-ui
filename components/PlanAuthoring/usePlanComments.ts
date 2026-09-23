"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlanComment } from "./model";

/**
 * Comment edit/delete state + handlers, shaped like app/hooks/useComments
 * so PlanComments can mirror CommentList and later swap in real mutations.
 */
export interface UsePlanCommentsArgs {
  comments: PlanComment[];
  onUpdateComment: (commentId: number, text: string) => Promise<PlanComment>;
  onDeleteComment: (commentId: number) => Promise<void>;
}

export function usePlanComments({
  comments,
  onUpdateComment,
  onDeleteComment,
}: UsePlanCommentsArgs) {
  const [localComments, setLocalComments] = useState<PlanComment[]>(comments);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [mutating, setMutating] = useState(false);

  useEffect(() => {
    setLocalComments(comments);
    setEditingCommentId(null);
    setEditingCommentText("");
  }, [comments]);

  const handleEditComment = useCallback((comment: PlanComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingCommentId(null);
    setEditingCommentText("");
  }, []);

  const handleUpdateComment = useCallback(
    async (comment: PlanComment) => {
      const nextText = editingCommentText.trim();
      if (!nextText || mutating) {
        return;
      }

      const original = { ...comment };
      const optimistic: PlanComment = {
        ...comment,
        text: nextText,
        isEdited: true,
      };

      setLocalComments((prev) =>
        prev.map((item) => (item.id === comment.id ? optimistic : item))
      );
      setMutating(true);

      try {
        const saved = await onUpdateComment(comment.id, nextText);
        setLocalComments((prev) =>
          prev.map((item) => (item.id === comment.id ? saved : item))
        );
        setEditingCommentId(null);
        setEditingCommentText("");
      } catch {
        setLocalComments((prev) =>
          prev.map((item) => (item.id === comment.id ? original : item))
        );
      } finally {
        setMutating(false);
      }
    },
    [editingCommentText, mutating, onUpdateComment]
  );

  const handleDeleteComment = useCallback(
    async (comment: PlanComment) => {
      if (mutating) {
        return;
      }

      const originalComments = [...localComments];
      setLocalComments((prev) => prev.filter((item) => item.id !== comment.id));
      if (editingCommentId === comment.id) {
        setEditingCommentId(null);
        setEditingCommentText("");
      }
      setMutating(true);

      try {
        await onDeleteComment(comment.id);
      } catch {
        setLocalComments(originalComments);
      } finally {
        setMutating(false);
      }
    },
    [editingCommentId, localComments, mutating, onDeleteComment]
  );

  return {
    localComments,
    editingCommentId,
    editingCommentText,
    setEditingCommentText,
    mutating,
    handleEditComment,
    handleUpdateComment,
    handleCancelEdit,
    handleDeleteComment,
  };
}
