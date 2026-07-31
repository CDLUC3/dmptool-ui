"use client";

import React, { useId } from "react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";
import {
  BOOLEAN_QUESTION_TYPE,
  CHECKBOXES_QUESTION_TYPE,
  DATE_QUESTION_TYPE,
  NUMBER_QUESTION_TYPE,
  RADIOBUTTONS_QUESTION_TYPE,
  SELECTBOX_QUESTION_TYPE,
  TEXT_AREA_QUESTION_TYPE,
  TEXT_FIELD_QUESTION_TYPE,
} from "@/lib/constants";
import {
  BooleanQuestionComponent,
  CheckboxesQuestionComponent,
  RadioButtonsQuestionComponent,
  SelectboxQuestionComponent,
} from "@/components/Form/QuestionComponents";
import { DateComponent, FormInput, NumberComponent } from "@/components/Form";
import TinyMCEEditor from "@/components/TinyMCEEditor";
import SafeHtml from "@/components/SafeHtml";
import type { PlanQuestionDefinition } from "../model";
import { questionKey } from "../model";
import styles from "./PlanQuestionAnswer.module.scss";

type Option = { label: string; value: string };

function getOptions(parsedJson: Record<string, unknown>): Option[] {
  const options = parsedJson.options;
  if (!Array.isArray(options)) {
    return [];
  }
  return options
    .map((option) => {
      if (!option || typeof option !== "object") {
        return null;
      }
      const record = option as Record<string, unknown>;
      const label = String(record.label ?? record.text ?? "");
      const value = String(record.value ?? record.label ?? record.text ?? "");
      if (!label || !value) {
        return null;
      }
      return { label, value };
    })
    .filter((option): option is Option => Boolean(option));
}

function getAnswerValue(answerJson: unknown): unknown {
  if (!answerJson || typeof answerJson !== "object") {
    return answerJson;
  }
  return (answerJson as { answer?: unknown }).answer;
}

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
  const options = getOptions(question.parsedJson);
  const value = getAnswerValue(draftAnswer);

  if (mode === "view") {
    return (
      <div className={[styles.answerView, className].filter(Boolean).join(" ")}>
        {question.questionType === TEXT_AREA_QUESTION_TYPE && typeof value === "string" ? (
          <SafeHtml html={value} />
        ) : value == null || value === "" ? (
          <p>{t("answer.notAnsweredYet")}</p>
        ) : (
          <p>{Array.isArray(value) ? value.join(", ") : String(value)}</p>
        )}
        {!disabled ? (
          <Button
            className="button-as-link"
            onPress={onStartEditing}
          >
            {t("answer.editAnswer")}
          </Button>
        ) : null}
      </div>
    );
  }

  const emit = (answer: unknown) => {
    onChange({
      type: question.questionType,
      answer,
    });
  };

  return (
    <div className={[styles.answerEditor, className].filter(Boolean).join(" ")}>
      {question.questionType === TEXT_AREA_QUESTION_TYPE ? (
        <TinyMCEEditor
          id={editorId}
          content={typeof value === "string" ? value : ""}
          setContent={(next) => emit(next)}
          disabled={disabled}
        />
      ) : null}

      {question.questionType === TEXT_FIELD_QUESTION_TYPE ? (
        <FormInput
          name={`${editorId}-text`}
          type="text"
          label={t("answer.label")}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => emit(event.target.value)}
          disabled={disabled}
        />
      ) : null}

      {question.questionType === BOOLEAN_QUESTION_TYPE ? (
        <BooleanQuestionComponent
          parsedQuestion={{
            type: BOOLEAN_QUESTION_TYPE,
            attributes: { value: Boolean(value) },
          } as never}
          selectedValue={value === true ? "yes" : "no"}
          handleRadioChange={(next) => emit(next === "yes")}
          isDisabled={disabled}
        />
      ) : null}

      {question.questionType === RADIOBUTTONS_QUESTION_TYPE ? (
        <RadioButtonsQuestionComponent
          parsedQuestion={{
            type: RADIOBUTTONS_QUESTION_TYPE,
            options,
          } as never}
          selectedRadioValue={typeof value === "string" ? value : ""}
          name={`${editorId}-radio`}
          handleRadioChange={(next) => emit(next)}
          isDisabled={disabled}
        />
      ) : null}

      {question.questionType === CHECKBOXES_QUESTION_TYPE ? (
        <CheckboxesQuestionComponent
          parsedQuestion={{
            type: CHECKBOXES_QUESTION_TYPE,
            options,
          } as never}
          selectedCheckboxValues={Array.isArray(value) ? (value as string[]) : []}
          handleCheckboxGroupChange={(next) => emit(next)}
          isDisabled={disabled}
        />
      ) : null}

      {question.questionType === SELECTBOX_QUESTION_TYPE ? (
        <SelectboxQuestionComponent
          parsedQuestion={{
            type: SELECTBOX_QUESTION_TYPE,
            options,
          } as never}
          selectedSelectValue={typeof value === "string" ? value : undefined}
          handleSelectChange={(next) => emit(next)}
          isDisabled={disabled}
        />
      ) : null}

      {question.questionType === NUMBER_QUESTION_TYPE ? (
        <NumberComponent
          label={t("answer.numberLabel")}
          value={typeof value === "number" ? value : null}
          onChange={(next) => emit(next)}
          disabled={disabled}
        />
      ) : null}

      {question.questionType === DATE_QUESTION_TYPE ? (
        <DateComponent
          name={`${editorId}-date`}
          label={t("answer.dateLabel")}
          value={typeof value === "string" ? (value as never) : null}
          onChange={(next) => emit(next?.toString() ?? null)}
          isDisabled={disabled}
        />
      ) : null}
    </div>
  );
}
