"use client";

import React from "react";
import type { PlanQuestionSaveState } from "../model";
import styles from "../PlanAuthoring.module.scss";

interface PlanQuestionSaveStatusProps {
  state: PlanQuestionSaveState;
  errorMessage?: string | null;
  className?: string;
}

const labels: Record<PlanQuestionSaveState, string> = {
  clean: "",
  dirty: "Unsaved changes",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

export default function PlanQuestionSaveStatus({
  state,
  errorMessage,
  className,
}: PlanQuestionSaveStatusProps) {
  const text =
    state === "error" && errorMessage ? errorMessage : labels[state];

  if (!text) {
    return null;
  }

  return (
    <p
      className={[styles.saveStatus, className].filter(Boolean).join(" ")}
      data-state={state}
      role="status"
      aria-live="polite"
    >
      {text}
    </p>
  );
}
