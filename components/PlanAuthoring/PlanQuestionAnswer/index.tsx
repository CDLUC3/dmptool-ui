"use client";

import React, { useId } from "react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";
import type {
  BooleanQuestionType,
  CheckboxesQuestionType,
  RadioButtonsQuestionType,
  SelectBoxQuestionType,
} from "@dmptool/types";
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
import { getAnswerValue, getOptions } from "../answerUtils";
import styles from "./PlanQuestionAnswer.module.scss";

const QUESTION_META = { schemaVersion: "1.0" } as const;

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

  const booleanQuestion: BooleanQuestionType = {
    type: "boolean",
    meta: QUESTION_META,
    attributes: { value: Boolean(value) },
  };

  const radioQuestion: RadioButtonsQuestionType = {
    type: "radioButtons",
    meta: QUESTION_META,
    attributes: {},
    options: options.map((option) => ({
      label: option.label,
      value: option.value,
      selected: false,
    })),
  };

  const checkboxesQuestion: CheckboxesQuestionType = {
    type: "checkBoxes",
    meta: QUESTION_META,
    attributes: {},
    options: options.map((option) => ({
      label: option.label,
      value: option.value,
      selected: false,
    })),
  };

  const selectboxQuestion: SelectBoxQuestionType = {
    type: "selectBox",
    meta: QUESTION_META,
    attributes: { multiple: false },
    options: options.map((option) => ({
      label: option.label,
      value: option.value,
      selected: false,
    })),
  };

  const checkboxValues = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

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
          parsedQuestion={booleanQuestion}
          selectedValue={value === true ? "yes" : "no"}
          handleRadioChange={(next) => emit(next === "yes")}
          isDisabled={disabled}
        />
      ) : null}

      {question.questionType === RADIOBUTTONS_QUESTION_TYPE ? (
        <RadioButtonsQuestionComponent
          parsedQuestion={radioQuestion}
          selectedRadioValue={typeof value === "string" ? value : ""}
          name={`${editorId}-radio`}
          handleRadioChange={(next) => emit(next)}
          isDisabled={disabled}
        />
      ) : null}

      {question.questionType === CHECKBOXES_QUESTION_TYPE ? (
        <CheckboxesQuestionComponent
          parsedQuestion={checkboxesQuestion}
          selectedCheckboxValues={checkboxValues}
          handleCheckboxGroupChange={(next) => emit(next)}
          isDisabled={disabled}
        />
      ) : null}

      {question.questionType === SELECTBOX_QUESTION_TYPE ? (
        <SelectboxQuestionComponent
          parsedQuestion={selectboxQuestion}
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
          value={typeof value === "string" ? value : null}
          onChange={(next) => emit(next?.toString() ?? null)}
          isDisabled={disabled}
        />
      ) : null}
    </div>
  );
}
