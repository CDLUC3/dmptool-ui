"use client";

import React, { useId } from "react";
import { useTranslations } from "next-intl";
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
import { useAffiliationSearchAnswer } from "../useAffiliationSearchAnswer";
import styles from "./PlanQuestionAnswer.module.scss";

interface PlanQuestionAnswerProps {
  question: PlanQuestionDefinition;
  draftAnswer: unknown;
  disabled?: boolean;
  onChange: (answerJson: unknown) => void;
  className?: string;
}

export default function PlanQuestionAnswer({
  question,
  draftAnswer,
  disabled = false,
  onChange,
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
  // TinyMCE's disabled mode injects the answer HTML unsanitized.
  const showSanitizedRichText =
    disabled && question.questionType === TEXT_AREA_QUESTION_TYPE;

  // TODO(follow-up PR): researchOutputTable parity via useRenderQuestionField.
  // Hold local `rows`/`setRows` (seed from draft or createEmptyResearchOutputRow),
  // pass researchOutputTableAnswerProps with onSave that emits
  // { type, columnHeadings, answer: rows, meta } like PlanOverviewQuestionPageShared,
  // then call saveNow. Disable autosave for this type; surface
  // onEditingStateChange so PlanQuestion can hide its Save button while a row
  // form is open.
  const typeaheadSearchProps = useAffiliationSearchAnswer({
    questionType: question.questionType,
    draftAnswer,
    onChange,
  });
  const questionField = useRenderQuestionField({
    ...buildPlanRenderQuestionProps({
      questionType: question.questionType,
      parsedJson: question.parsedJson,
      draftAnswer,
      disabled,
      editorId,
      onChange,
    }),
    typeaheadSearchProps,
  });

  return (
    <div className={[styles.answerEditor, className].filter(Boolean).join(" ")}>
      {showSanitizedRichText ? (
        <div className={styles.readOnlyRichText}>
          {typeof value === "string" && value.trim() ? (
            <SafeHtml html={value} />
          ) : (
            <p>{t("answer.notAnsweredYet")}</p>
          )}
        </div>
      ) : (
        questionField
      )}
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
