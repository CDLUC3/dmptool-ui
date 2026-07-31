"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Form, TextArea } from "react-aria-components";
import type { PlanComment } from "../model";
import styles from "./PlanComments.module.scss";

interface PlanCommentsProps {
  comments: PlanComment[];
  canAdd: boolean;
  loading?: boolean;
  onAdd: (text: string) => Promise<void>;
  className?: string;
}

export default function PlanComments({
  comments,
  canAdd,
  loading = false,
  onAdd,
  className,
}: PlanCommentsProps) {
  const t = useTranslations("PlanAuthoring");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        role="group"
        aria-label={t("comments.listAria")}
        tabIndex={0}
      >
        {comments.map((comment) => (
          <article
            key={comment.id}
            className={styles.comment}
          >
            <h4>
              {comment.authorName}
              {comment.isFeedback ? (
                <span className={styles.deEmphasize}>{t("comments.admin")}</span>
              ) : null}
            </h4>
            <p className={styles.meta}>{comment.createdLabel}</p>
            <p>{comment.text}</p>
          </article>
        ))}
      </div>
      {canAdd ? (
        <Form
          className={styles.commentComposer}
          onSubmit={async (event) => {
            event.preventDefault();
            if (!text.trim() || submitting) {
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
          <TextArea
            className={styles.commentTextarea}
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={2}
            placeholder={t("comments.placeholder")}
            aria-label={t("comments.addAria")}
          />
          <div className={styles.commentComposerActions}>
            <Button
              type="submit"
              isDisabled={submitting || !text.trim()}
            >
              {submitting ? t("comments.posting") : t("comments.comment")}
            </Button>
          </div>
        </Form>
      ) : (
        <p className={styles.commentsEmpty}>
          {t("comments.saveBeforeCommenting")}
        </p>
      )}
    </div>
  );
}
