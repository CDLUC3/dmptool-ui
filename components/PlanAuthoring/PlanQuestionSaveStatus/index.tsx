"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { PlanQuestionSaveState } from "../model";
import styles from "./PlanQuestionSaveStatus.module.scss";

interface PlanQuestionSaveStatusProps {
  state: PlanQuestionSaveState;
  errorMessage?: string | null;
  className?: string;
}

export default function PlanQuestionSaveStatus({
  state,
  errorMessage,
  className,
}: PlanQuestionSaveStatusProps) {
  const t = useTranslations("PlanAuthoring");

  const labels: Record<PlanQuestionSaveState, string> = {
    clean: "",
    dirty: t("saveStatus.unsavedChanges"),
    saving: t("saveStatus.saving"),
    saved: t("saveStatus.saved"),
    error: t("saveStatus.saveFailed"),
  };

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
