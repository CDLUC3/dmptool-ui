"use client";

import React, { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";
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
import {
  buildResearchOutputAnswer,
  getResearchOutputColumns,
  getResearchOutputRows,
} from "../researchOutputAnswer";
import styles from "./PlanQuestionAnswer.module.scss";

interface PlanQuestionAnswerProps {
  question: PlanQuestionDefinition;
  mode: "view" | "editing";
  draftAnswer: unknown;
  disabled?: boolean;
  onChange: (answerJson: unknown) => void;
  onStartEditing: () => void;
  onSaveNow?: () => Promise<boolean>;
  rowNavigation?: ResearchOutputRowNavigation;
  className?: string;
}

export default function PlanQuestionAnswer({
  question,
  mode,
  draftAnswer,
  disabled = false,
  onChange,
  onStartEditing,
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

  const researchOutputColumns = getResearchOutputColumns(question.parsedJson);
  const isResearchOutput =
    question.questionType === RESEARCH_OUTPUT_QUESTION_TYPE &&
    researchOutputColumns !== null;

  const [researchOutputRows, setResearchOutputRows] = useState<
    ResearchOutputTable[]
  >(() => getResearchOutputRows(draftAnswer));

  useEffect(() => {
    setResearchOutputRows(getResearchOutputRows(draftAnswer));
  }, [draftAnswer]);

  // Always call — mode early-return must not violate Rules of Hooks.
  // Ignore output for researchOutputTable; that type renders below directly.
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

  const persistResearchOutputRows = async (rows: ResearchOutputTable[]) => {
    setResearchOutputRows(rows);
    const answerJson = buildResearchOutputAnswer(question.parsedJson, rows);
    onChange(answerJson);
    if (onSaveNow) {
      await onSaveNow();
    }
  };

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
      {isResearchOutput && researchOutputColumns ? (
        <ResearchOutputAnswerComponent
          columns={researchOutputColumns}
          rows={researchOutputRows}
          setRows={setResearchOutputRows}
          onSave={persistResearchOutputRows}
          isDisabled={disabled}
          rowNavigation={rowNavigation}
        />
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
