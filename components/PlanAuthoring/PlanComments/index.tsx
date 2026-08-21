"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Form, TextArea } from "react-aria-components";
import type { PlanComment } from "../model";
import styles from "./PlanComments.module.scss";

/**
 * Presentational comments list + composer.
 * Edit/delete UX mirrors components/Comments/CommentList.tsx so a later
 * migration can swap PlanComment ↔ MergedComment and wire useComments handlers.
 */
interface PlanCommentsProps {
  comments: PlanComment[];
  canAdd: boolean;
  currentUserId: number;
  canModerateComments: boolean;
  loading?: boolean;
  editingCommentId: number | null;
  editingCommentText: string;
  setEditingCommentText: (text: string) => void;
  handleEditComment: (comment: PlanComment) => void;
  handleUpdateComment: (comment: PlanComment) => void;
  handleCancelEdit: () => void;
  handleDeleteComment: (comment: PlanComment) => void;
  onAdd: (text: string) => Promise<void>;
  className?: string;
}

export default function PlanComments({
  comments,
  canAdd,
  currentUserId,
  canModerateComments,
  loading = false,
  editingCommentId,
  editingCommentText,
  setEditingCommentText,
  handleEditComment,
  handleUpdateComment,
  handleCancelEdit,
  handleDeleteComment,
  onAdd,
  className,
}: PlanCommentsProps) {
  const t = useTranslations("PlanAuthoring");
  const Global = useTranslations("Global");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateCommentHandler = (comment: PlanComment) => {
    if (!editingCommentText.trim()) {
      return;
    }
    handleUpdateComment(comment);
  };

  return (
    <div className={[styles.comments, className].filter(Boolean).join(" ")}>
      {loading ? (
        <p className={styles.commentsEmpty}>{t("comments.loading")}</p>
      ) : null}
      {!loading && comments.length === 0 ? (
        <p className={styles.commentsEmpty}>{t("comments.empty")}</p>
      ) : null}
      <div
        className={styles.commentsList}
        role="list"
        aria-label={t("comments.listAria")}
      >
        {comments.map((comment) => {
          const isEditing = editingCommentId === comment.id;
          const isOwn = comment.authorId === currentUserId;
          const canDelete = isOwn || canModerateComments;

          return (
            <div
              key={comment.id}
              className={styles.comment}
              role="listitem"
            >
              <div className={styles.commentHeader}>
                <div className={styles.author}>
                  {comment.authorName}
                  {comment.isFeedback ? (
                    <span className={styles.adminLabel}>
                      {t("comments.admin")}
                    </span>
                  ) : null}
                </div>
                <p className={styles.meta}>
                  {comment.createdLabel}
                  {comment.isEdited ? ` (${t("comments.edited")})` : ""}
                </p>
              </div>

              {isEditing ? (
                <TextArea
                  className={styles.commentTextarea}
                  name={`edit-comment-${comment.id}`}
                  value={editingCommentText}
                  onChange={(event) =>
                    setEditingCommentText(event.target.value)
                  }
                  rows={3}
                  ref={(el) => {
                    if (el) {
                      el.focus({ preventScroll: true });
                    }
                  }}
                  aria-label={t("comments.editAria")}
                />
              ) : (
                <p className={styles.commentBody}>{comment.text}</p>
              )}

              {isEditing || isOwn || canDelete ? (
                <div className={styles.buttonGroup}>
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className={styles.actionLink}
                        onClick={() => updateCommentHandler(comment)}
                      >
                        {Global("buttons.save")}
                      </button>
                      <button
                        type="button"
                        className={styles.actionLink}
                        onClick={handleCancelEdit}
                      >
                        {Global("buttons.cancel")}
                      </button>
                    </>
                  ) : (
                    <>
                      {isOwn ? (
                        <button
                          type="button"
                          className={styles.actionLink}
                          onClick={() => handleEditComment(comment)}
                        >
                          {Global("buttons.edit")}
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          className={styles.actionLink}
                          onClick={() => handleDeleteComment(comment)}
                        >
                          {Global("buttons.delete")}
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <Form
        className={styles.commentComposer}
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canAdd || !text.trim() || submitting) {
            return;
          }
          setSubmitting(true);
          try {
            await onAdd(text.trim());
            setText("");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className={styles.composerField}>
          {canAdd ? (
            <TextArea
              className={styles.commentTextarea}
              name="new-comment"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={2}
              placeholder={t("comments.placeholder")}
              aria-label={t("comments.addAria")}
            />
          ) : (
            <div
              className={styles.composerNotice}
              role="status"
            >
              {t("comments.saveBeforeCommenting")}
            </div>
          )}
        </div>
        <div className={styles.commentComposerActions}>
          <Button
            type="submit"
            className="small"
            isDisabled={!canAdd || submitting || !text.trim()}
          >
            {submitting ? t("comments.posting") : t("comments.comment")}
          </Button>
        </div>
      </Form>
    </div>
  );
}
