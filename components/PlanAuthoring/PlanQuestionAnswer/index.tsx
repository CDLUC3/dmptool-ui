"use client";

import React, { useId } from "react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";
import { TEXT_AREA_QUESTION_TYPE } from "@/lib/constants";
import { useRenderQuestionField } from "@/components/hooks/useRenderQuestionField";
import FormTextArea from "@/components/Form/FormTextArea";
import SafeHtml from "@/components/SafeHtml";
import type { PlanQuestionDefinition } from "../model";
import { questionKey } from "../model";
import {
  getAnswerValue,
  getAdditionalCommentValue,
  withAdditionalComment,
} from "../answerUtils";
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
  const tGlobal = useTranslations("Global");
  const reactId = useId();
  const editorId = `plan-editor-${questionKey(question.identity)}-${reactId}`;
  const value = getAnswerValue(draftAnswer);
  const additionalCommentValue = getAdditionalCommentValue(draftAnswer);
  // Question JSON flag (legacy). Distinct from collaborative PlanComments.
  const showAdditionalCommentField =
    question.parsedJson.showCommentField === true;

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
        {additionalCommentValue ? (
          <div className={styles.additionalCommentView}>
            <p className={styles.additionalCommentLabel}>
              {tGlobal("labels.additionalComments")}
            </p>
            <p>{additionalCommentValue}</p>
          </div>
        ) : null}
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
      {showAdditionalCommentField ? (
        <FormTextArea
          name="additionalComment"
          label={tGlobal("labels.additionalComments")}
          placeholder={tGlobal("placeholders.enterComment")}
          value={additionalCommentValue}
          onChange={(next) =>
            onChange(
              withAdditionalComment(draftAnswer, question.questionType, next)
            )
          }
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}
