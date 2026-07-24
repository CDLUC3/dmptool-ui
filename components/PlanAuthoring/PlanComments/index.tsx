"use client";

import React, { useState } from "react";
import { Button, Form, TextArea } from "react-aria-components";
import type { PlanComment } from "../model";
import styles from "../PlanAuthoring.module.scss";

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
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className={[styles.comments, className].filter(Boolean).join(" ")}>
      {loading ? <p className={styles.commentsEmpty}>Loading comments…</p> : null}
      {!loading && comments.length === 0 ? (
        <p className={styles.commentsEmpty}>No comments yet.</p>
      ) : null}
      <div
        className={styles.commentsList}
        role="group"
        aria-label="Comments"
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
                <span className={styles.deEmphasize}> (admin)</span>
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
            onChange={setText}
            rows={2}
            placeholder="Add a comment…"
            aria-label="Add a comment"
          />
          <div className={styles.commentComposerActions}>
            <Button
              type="submit"
              isDisabled={submitting || !text.trim()}
            >
              {submitting ? "Posting…" : "Comment"}
            </Button>
          </div>
        </Form>
      ) : (
        <p className={styles.commentsEmpty}>
          Save an answer before adding comments.
        </p>
      )}
    </div>
  );
}
