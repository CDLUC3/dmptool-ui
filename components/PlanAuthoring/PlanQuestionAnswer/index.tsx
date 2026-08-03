"use client";

import React, { useId } from "react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";
import { TEXT_AREA_QUESTION_TYPE } from "@/lib/constants";
import { useRenderQuestionField } from "@/components/hooks/useRenderQuestionField";
import SafeHtml from "@/components/SafeHtml";
import type { PlanQuestionDefinition } from "../model";
import { questionKey } from "../model";
import { getAnswerValue } from "../answerUtils";
import { buildPlanRenderQuestionProps } from "../buildPlanRenderQuestionProps";
import styles from "./PlanQuestionAnswer.module.scss";

interface PlanQuestionAnswerProps {
  question: PlanQuestionDefinition;
  mode: "view" | "editing";
  draftAnswer: unknown;
  disabled?: boolean;
  onChange: (answerJson: unknown) => void;
  onStartEditing: () => void;
  className?: string;
}

export default function PlanQuestionAnswer({
  question,
  mode,
  draftAnswer,
  disabled = false,
  onChange,
  onStartEditing,
  className,
}: PlanQuestionAnswerProps) {
  const t = useTranslations("PlanAuthoring");
  const reactId = useId();
  const editorId = `plan-editor-${questionKey(question.identity)}-${reactId}`;
  const value = getAnswerValue(draftAnswer);

  // Always call — mode early-return must not violate Rules of Hooks.
  //
  // TODO(follow-up PR): researchOutputTable parity via useRenderQuestionField.
  // Hold local `rows`/`setRows` (seed from draft or createEmptyResearchOutputRow),
  // pass researchOutputTableAnswerProps with onSave that emits
  // { type, columnHeadings, answer: rows, meta } like PlanOverviewQuestionPageShared,
  // then call saveNow. Disable autosave for this type; surface
  // onEditingStateChange so PlanQuestion can hide its Save button while a row
  // form is open. Affiliation search needs a similar special case.
  const questionField = useRenderQuestionField(
    buildPlanRenderQuestionProps({
      questionType: question.questionType,
      parsedJson: question.parsedJson,
      draftAnswer,
      disabled,
      editorId,
      onChange,
    })
  );

  if (mode === "view") {
    return (
      <div className={[styles.answerView, className].filter(Boolean).join(" ")}>
        {question.questionType === TEXT_AREA_QUESTION_TYPE &&
        typeof value === "string" ? (
          <SafeHtml html={value} />
        ) : value == null || value === "" ? (
          <p>{t("answer.notAnsweredYet")}</p>
        ) : (
          <p>{Array.isArray(value) ? value.join(", ") : String(value)}</p>
        )}
        {!disabled ? (
          <Button className="button-as-link" onPress={onStartEditing}>
            {t("answer.editAnswer")}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={[styles.answerEditor, className].filter(Boolean).join(" ")}>
      {questionField}
    </div>
  );
}
