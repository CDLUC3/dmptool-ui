"use client";

import React, { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatRelativeFromTimestamp } from "@/utils/dateUtils";
import type { PlanQuestionSaveState } from "../model";
import styles from "./PlanQuestionSaveStatus.module.scss";

const MINUTE_MS = 60 * 1000;

interface PlanQuestionSaveStatusProps {
  state: PlanQuestionSaveState;
  lastSavedAt?: number;
  isPreview?: boolean;
  className?: string;
}

export default function PlanQuestionSaveStatus({
  state,
  lastSavedAt,
  isPreview = false,
  className,
}: PlanQuestionSaveStatusProps) {
  const t = useTranslations("PlanAuthoring");
  const QuestionPage = useTranslations("PlanOverviewQuestionPage");
  const locale = useLocale();
  const showLastSaved =
    (state.status === "clean" || state.status === "saved") &&
    lastSavedAt != null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!showLastSaved) {
      return;
    }
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), MINUTE_MS);
    return () => clearInterval(interval);
  }, [showLastSaved, lastSavedAt]);

  const text = (() => {
    if (isPreview && state.status !== "invalid" && state.status !== "failed") {
      return "";
    }
    if (showLastSaved) {
      return now - lastSavedAt < MINUTE_MS
        ? QuestionPage("messages.savedJustNow")
        : t("saveStatus.lastSaved", {
            relative: formatRelativeFromTimestamp(String(lastSavedAt), locale),
          });
    }
    switch (state.status) {
      case "clean":
        return "";
      case "dirty":
        return t("saveStatus.unsavedChanges");
      case "saving":
        return t("saveStatus.saving");
      case "saved":
        return t("saveStatus.saved");
      case "invalid":
        return state.messages.join(" ");
      case "failed":
        return state.message ?? t("saveStatus.unableToSave");
    }
  })();

  if (!text) {
    return null;
  }

  return (
    <p
      className={[styles.saveStatus, className].filter(Boolean).join(" ")}
      data-state={state.status}
      role="status"
      aria-live="polite"
    >
      {text}
    </p>
  );
}
