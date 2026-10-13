"use client";

import React, { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import {
  RESEARCH_OUTPUT_QUESTION_TYPE,
  TEXT_AREA_QUESTION_TYPE,
} from "@/lib/constants";
import { useRenderQuestionField } from "@/components/hooks/useRenderQuestionField";
import ResearchOutputAnswerComponent, {
  type ResearchOutputRowNavigation,
} from "@/components/Form/ResearchOutputAnswerComponent";
import FormTextArea from "@/components/Form/FormTextArea";
import SafeHtml from "@/components/SafeHtml";
import type { ResearchOutputTable } from "@/app/types";
import type { PlanQuestionDefinition } from "../model";
import { questionKey } from "../model";
import {
  getAnswerValue,
  getAdditionalCommentValue,
  withAdditionalComment,
} from "../answerUtils";
import { buildPlanRenderQuestionProps } from "../buildPlanRenderQuestionProps";
import { useAffiliationSearchAnswer } from "../useAffiliationSearchAnswer";
import {
  buildResearchOutputAnswer,
  getResearchOutputColumns,
  getResearchOutputRows,
} from "../researchOutputAnswer";
import styles from "./PlanQuestionAnswer.module.scss";

interface PlanQuestionAnswerProps {
  question: PlanQuestionDefinition;
  draftAnswer: unknown;
  disabled?: boolean;
  onChange: (answerJson: unknown) => void;
  onSaveNow?: () => Promise<boolean>;
  rowNavigation?: ResearchOutputRowNavigation;
  className?: string;
}

export default function PlanQuestionAnswer({
  question,
  draftAnswer,
  disabled = false,
  onChange,
  onSaveNow,
  rowNavigation,
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

  const researchOutputColumns =
    question.questionType === RESEARCH_OUTPUT_QUESTION_TYPE
      ? getResearchOutputColumns(question.parsedJson)
      : null;
  const [researchOutputRows, setResearchOutputRows] = useState<
    ResearchOutputTable[]
  >(() => getResearchOutputRows(draftAnswer));

  useEffect(() => {
    setResearchOutputRows(getResearchOutputRows(draftAnswer));
  }, [draftAnswer]);

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

  const persistResearchOutputRows = async (rows: ResearchOutputTable[]) => {
    setResearchOutputRows(rows);
    onChange(buildResearchOutputAnswer(question.parsedJson, rows));
    await onSaveNow?.();
  };

  return (
    <div className={[styles.answerEditor, className].filter(Boolean).join(" ")}>
      {researchOutputColumns ? (
        <ResearchOutputAnswerComponent
          columns={researchOutputColumns}
          rows={researchOutputRows}
          setRows={setResearchOutputRows}
          onSave={persistResearchOutputRows}
          isDisabled={disabled}
          rowNavigation={rowNavigation}
        />
      ) : showSanitizedRichText ? (
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
