import type { DateValue } from "@internationalized/date";
import type {
  ParsedQuestion,
  RenderQuestionFieldProps,
} from "@/components/hooks/useRenderQuestionField";
import { getAnswerValue, withAnswer } from "./answerUtils";

interface BuildPlanRenderQuestionPropsArgs {
  questionType: string;
  parsedJson: Record<string, unknown>;
  draftAnswer: unknown;
  disabled?: boolean;
  editorId: string;
  onChange: (answerJson: unknown) => void;
}

/**
 * Maps a `{ type, answer }` draft into the per-type props `useRenderQuestionField`
 * expects, and emits edits back as `{ type, answer }`.
 *
 * TODO(follow-up PR): researchOutputTable needs row state and an explicit save,
 * so wire `researchOutputTableAnswerProps` in PlanQuestionAnswer, not here.
 */
export function buildPlanRenderQuestionProps({
  questionType,
  parsedJson,
  draftAnswer,
  disabled = false,
  editorId,
  onChange,
}: BuildPlanRenderQuestionPropsArgs): RenderQuestionFieldProps {
  const value = getAnswerValue(draftAnswer);

  const emit = (answer: unknown) =>
    onChange(withAnswer(draftAnswer, questionType, answer));

  const stringValue = typeof value === "string" ? value : "";
  const numberValue = typeof value === "number" ? value : null;
  const checkboxValues = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
  const multiSelectValues = new Set(checkboxValues);

  const dateRangeValue =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as {
          startDate?: string | null;
          endDate?: string | null;
        })
      : null;

  const numberRangeValue =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as {
          startNumber?: number | null;
          endNumber?: number | null;
        })
      : null;

  return {
    questionType,
    parsed: parsedJson as ParsedQuestion,
    readOnly: disabled,
    editorId,
    textFieldProps: {
      textValue: stringValue,
      handleTextChange: (event) => emit(event.target.value),
    },
    textAreaProps: {
      content: stringValue,
      setContent: (next) => emit(next),
    },
    radioProps: {
      selectedRadioValue: stringValue,
      handleRadioChange: (next) => emit(next),
    },
    checkBoxProps: {
      selectedCheckboxValues: checkboxValues,
      handleCheckboxGroupChange: (next) => emit(next),
    },
    selectBoxProps: {
      selectedSelectValue: stringValue || undefined,
      setSelectedSelectValue: (next) => emit(next ?? ""),
      handleSelectChange: (next) => emit(next),
    },
    multiSelectBoxProps: {
      selectedMultiSelectValues: multiSelectValues,
      handleMultiSelectChange: (next) => emit(Array.from(next)),
    },
    booleanProps: {
      yesNoValue:
        value === true ? "yes" : value === false ? "no" : stringValue,
      handleBooleanChange: (next) => emit(next === "yes"),
    },
    numberProps: {
      numberValue,
      handleNumberChange: (next) => emit(next),
    },
    currencyProps: {
      inputCurrencyValue: numberValue,
      handleCurrencyChange: (next) => emit(next),
    },
    dateProps: {
      dateValue: stringValue || null,
      handleDateChange: (next) => {
        if (next == null) {
          emit(null);
          return;
        }
        emit(
          typeof next === "string"
            ? next
            : (next as DateValue).toString()
        );
      },
    },
    dateRangeProps: {
      dateRange: {
        startDate: dateRangeValue?.startDate ?? null,
        endDate: dateRangeValue?.endDate ?? null,
      },
      handleDateRangeChange: (key, next) => {
        emit({
          startDate: dateRangeValue?.startDate ?? null,
          endDate: dateRangeValue?.endDate ?? null,
          [key]:
            next == null
              ? null
              : typeof next === "string"
                ? next
                : (next as DateValue).toString(),
        });
      },
    },
    numberRangeProps: {
      numberRange: {
        startNumber: numberRangeValue?.startNumber ?? null,
        endNumber: numberRangeValue?.endNumber ?? null,
      },
      handleNumberRangeChange: (key, next) => {
        emit({
          startNumber: numberRangeValue?.startNumber ?? null,
          endNumber: numberRangeValue?.endNumber ?? null,
          [key]: next,
        });
      },
    },
    urlProps: {
      urlValue: stringValue || null,
      handleUrlChange: (event) => emit(event.target.value),
    },
    emailProps: {
      emailValue: stringValue || null,
      handleEmailChange: (event) => emit(event.target.value),
    },
    // TODO(follow-up PR): researchOutputTableAnswerProps — rows/setRows/onSave
    // parity with PlanOverviewQuestionPageShared (columnHeadings + meta +
    // createEmptyResearchOutputRow).
  };
}
