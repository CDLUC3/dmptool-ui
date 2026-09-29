"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Form, TextArea } from "react-aria-components";
import type { PlanComment } from "../model";
import type { PlanCommentMutationError } from "../usePlanComments";
import styles from "./PlanComments.module.scss";

interface PlanCommentsProps {
  comments: PlanComment[];
  canAdd: boolean;
  loading?: boolean;
  loadFailed?: boolean;
  onRetryLoad?: () => void;
  mutationError?: PlanCommentMutationError | null;
  editingCommentId: string | null;
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
  loading = false,
  loadFailed = false,
  onRetryLoad,
  mutationError = null,
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
  const [addFailed, setAddFailed] = useState(false);

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
      {loadFailed ? (
        <div
          className={styles.commentsError}
          role="alert"
        >
          <p>{t("comments.loadFailed")}</p>
          {onRetryLoad ? (
            <Button
              className="small"
              onPress={onRetryLoad}
            >
              {t("common.retry")}
            </Button>
          ) : null}
        </div>
      ) : null}
      {!loading && !loadFailed && comments.length === 0 ? (
        <p className={styles.commentsEmpty}>{t("comments.empty")}</p>
      ) : null}
      {mutationError ? (
        <p
          className={styles.commentsError}
          role="alert"
        >
          {t(`comments.${mutationError}`)}
        </p>
      ) : null}
      <div
        className={styles.commentsList}
        role="list"
        aria-label={t("comments.listAria")}
      >
        {comments.map((comment) => {
          const isEditing = editingCommentId === comment.id;

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

              {isEditing || comment.canEdit || comment.canDelete ? (
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
                      {comment.canEdit ? (
                        <button
                          type="button"
                          className={styles.actionLink}
                          onClick={() => handleEditComment(comment)}
                        >
                          {Global("buttons.edit")}
                        </button>
                      ) : null}
                      {comment.canDelete ? (
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
          setAddFailed(false);
          try {
            await onAdd(text.trim());
            setText("");
          } catch (error) {
            console.error("Failed to add plan comment", error);
            setAddFailed(true);
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
        {addFailed ? (
          <p
            className={styles.commentsError}
            role="alert"
          >
            {t("comments.addFailed")}
          </p>
        ) : null}
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
