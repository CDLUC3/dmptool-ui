"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { formatRelativeFromTimestamp } from "@/utils/dateUtils";
import type { PlanQuestionSaveState } from "../model";
import styles from "./PlanQuestionSaveStatus.module.scss";

const MINUTE_MS = 60 * 1000;

interface PlanQuestionSaveStatusProps {
  state: PlanQuestionSaveState;
  /** Epoch milliseconds, as a string (the API's timestamp format). */
  lastSavedAt?: string;
  className?: string;
}

export default function PlanQuestionSaveStatus({
  state,
  lastSavedAt,
  className,
}: PlanQuestionSaveStatusProps) {
  const t = useTranslations("PlanAuthoring");
  const QuestionPage = useTranslations("PlanOverviewQuestionPage");
  // useParams rather than useLocale so this renders without an intl provider.
  const locale = useParams<{ locale?: string }>()?.locale ?? routing.defaultLocale;
  const showLastSaved =
    (state.status === "clean" || state.status === "saved") &&
    lastSavedAt != null &&
    Number.isFinite(Number(lastSavedAt));
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
    if (showLastSaved) {
      return now - Number(lastSavedAt) < MINUTE_MS
        ? QuestionPage("messages.savedJustNow")
        : t("saveStatus.lastSaved", {
            relative: formatRelativeFromTimestamp(lastSavedAt, locale),
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
