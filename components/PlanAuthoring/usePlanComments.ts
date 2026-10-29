"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlanComment } from "./model";

export type PlanCommentMutationError = "updateFailed" | "deleteFailed";

export interface UsePlanCommentsArgs {
  comments: PlanComment[];
  onUpdateComment: (commentId: string, text: string) => Promise<PlanComment>;
  onDeleteComment: (commentId: string) => Promise<void>;
}

export function usePlanComments({
  comments,
  onUpdateComment,
  onDeleteComment,
}: UsePlanCommentsArgs) {
  const [localComments, setLocalComments] = useState<PlanComment[]>(comments);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] =
    useState<PlanCommentMutationError | null>(null);

  useEffect(() => {
    setLocalComments(comments);
    setEditingCommentId(null);
    setEditingCommentText("");
  }, [comments]);

  const handleEditComment = useCallback((comment: PlanComment) => {
    setMutationError(null);
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setMutationError(null);
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
      setMutationError(null);

      try {
        const saved = await onUpdateComment(comment.id, nextText);
        setLocalComments((prev) =>
          prev.map((item) => (item.id === comment.id ? saved : item))
        );
        setEditingCommentId(null);
        setEditingCommentText("");
      } catch (error) {
        console.error("Failed to update plan comment", error);
        setLocalComments((prev) =>
          prev.map((item) => (item.id === comment.id ? original : item))
        );
        setMutationError("updateFailed");
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
      setMutationError(null);

      try {
        await onDeleteComment(comment.id);
      } catch (error) {
        console.error("Failed to delete plan comment", error);
        setLocalComments(originalComments);
        setMutationError("deleteFailed");
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
    mutationError,
    handleEditComment,
    handleUpdateComment,
    handleCancelEdit,
    handleDeleteComment,
  };
}
