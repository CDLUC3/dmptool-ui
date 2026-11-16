import type React from "react";
import { CalendarDate } from "@internationalized/date";
import { buildPlanRenderQuestionProps } from "../buildPlanRenderQuestionProps";

function build(
  questionType: string,
  answer?: unknown,
  options?: {
    parsedJson?: Record<string, unknown>;
    draftExtras?: Record<string, unknown>;
    disabled?: boolean;
    editorId?: string;
  }
) {
  const onChange = jest.fn();
  const draftAnswer =
    answer === undefined && !options?.draftExtras
      ? null
      : {
          type: questionType,
          ...(answer !== undefined ? { answer } : {}),
          ...options?.draftExtras,
        };
  const props = buildPlanRenderQuestionProps({
    questionType,
    parsedJson: options?.parsedJson ?? { type: questionType },
    draftAnswer,
    disabled: options?.disabled,
    editorId: options?.editorId ?? "editor",
    onChange,
  });
  const emitted = () => onChange.mock.lastCall?.[0];
  return { props, emitted };
}

const inputEvent = (value: string) => {
  const event: Partial<React.ChangeEvent<HTMLInputElement>> = {
    target: Object.assign(document.createElement("input"), { value }),
  };
  return event as React.ChangeEvent<HTMLInputElement>;
};

describe("buildPlanRenderQuestionProps", () => {
  it("emits typed text input", () => {
    const { props, emitted } = build("text", "old");
    props.textFieldProps?.handleTextChange?.(inputEvent("new"));
    expect(emitted()).toEqual({ type: "text", answer: "new" });
  });

  it("emits typed url input", () => {
    const { props, emitted } = build("url", "old");
    props.urlProps?.handleUrlChange?.(inputEvent("new"));
    expect(emitted()).toEqual({ type: "url", answer: "new" });
  });

  it("emits typed email input", () => {
    const { props, emitted } = build("email", "old");
    props.emailProps?.handleEmailChange?.(inputEvent("new"));
    expect(emitted()).toEqual({ type: "email", answer: "new" });
  });

  it("emits rich text from the editor", () => {
    const { props, emitted } = build("textArea", "<p>a</p>");
    expect(props.textAreaProps?.content).toBe("<p>a</p>");
    props.textAreaProps?.setContent?.("<p>b</p>");
    expect(emitted()).toEqual({ type: "textArea", answer: "<p>b</p>" });
  });

  it("emits the checkbox selection and ignores non-string stored values", () => {
    const { props, emitted } = build("checkBoxes", ["a", 3, "b"]);
    expect(props.checkBoxProps?.selectedCheckboxValues).toEqual(["a", "b"]);
    props.checkBoxProps?.handleCheckboxGroupChange?.(["c"]);
    expect(emitted()).toEqual({ type: "checkBoxes", answer: ["c"] });
  });

  it("maps a select answer and emits a cleared selection as an empty string", () => {
    const { props, emitted } = build("selectBox", "b");
    expect(props.selectBoxProps?.selectedSelectValue).toBe("b");

    props.selectBoxProps?.handleSelectChange?.("c");
    expect(emitted()).toEqual({ type: "selectBox", answer: "c" });

    props.selectBoxProps?.setSelectedSelectValue?.(undefined);
    expect(emitted()).toEqual({ type: "selectBox", answer: "" });
  });

  it("leaves an empty select unselected", () => {
    const { props } = build("selectBox");
    expect(props.selectBoxProps?.selectedSelectValue).toBeUndefined();
  });

  it("maps a multiselect answer to a Set and emits an array", () => {
    const { props, emitted } = build("multiselectBox", ["a", "b"]);
    expect(props.multiSelectBoxProps?.selectedMultiSelectValues).toEqual(new Set(["a", "b"]));
    props.multiSelectBoxProps?.handleMultiSelectChange?.(new Set(["b", "c"]));
    expect(emitted()).toEqual({ type: "multiselectBox", answer: ["b", "c"] });
  });

  it("maps and emits a number answer", () => {
    const { props, emitted } = build("number", 12.5);
    expect(props.numberProps?.numberValue).toBe(12.5);
    props.numberProps?.handleNumberChange?.(40);
    expect(emitted()).toEqual({ type: "number", answer: 40 });
  });

  it("maps and emits a currency answer", () => {
    const { props, emitted } = build("currency", 12.5);
    expect(props.currencyProps?.inputCurrencyValue).toBe(12.5);
    props.currencyProps?.handleCurrencyChange?.(40);
    expect(emitted()).toEqual({ type: "currency", answer: 40 });
  });

  it("treats a non-number stored value as empty for number fields", () => {
    const { props } = build("number", "12");
    expect(props.numberProps?.numberValue).toBeNull();
  });

  it("emits a picked date as an ISO string, and a cleared one as null", () => {
    const { props, emitted } = build("date", "2025-01-01");
    expect(props.dateProps?.dateValue).toBe("2025-01-01");

    props.dateProps?.handleDateChange?.(new CalendarDate(2025, 5, 15));
    expect(emitted()).toEqual({ type: "date", answer: "2025-05-15" });

    props.dateProps?.handleDateChange?.("2025-06-01");
    expect(emitted()).toEqual({ type: "date", answer: "2025-06-01" });

    props.dateProps?.handleDateChange?.(null);
    expect(emitted()).toEqual({ type: "date", answer: null });
  });

  it("changes one end of a date range and keeps the other", () => {
    const { props, emitted } = build("dateRange", {
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    });
    expect(props.dateRangeProps?.dateRange).toEqual({
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    });

    props.dateRangeProps?.handleDateRangeChange?.("startDate", new CalendarDate(2025, 2, 1));
    expect(emitted()).toEqual({
      type: "dateRange",
      answer: { startDate: "2025-02-01", endDate: "2025-12-31" },
    });

    props.dateRangeProps?.handleDateRangeChange?.("endDate", null);
    expect(emitted()).toEqual({
      type: "dateRange",
      answer: { startDate: "2025-01-01", endDate: null },
    });

    props.dateRangeProps?.handleDateRangeChange?.("endDate", "2026-01-01");
    expect(emitted()).toEqual({
      type: "dateRange",
      answer: { startDate: "2025-01-01", endDate: "2026-01-01" },
    });
  });

  it("starts an unanswered date range with both ends empty", () => {
    const { props, emitted } = build("dateRange");
    expect(props.dateRangeProps?.dateRange).toEqual({ startDate: null, endDate: null });
    props.dateRangeProps?.handleDateRangeChange?.("endDate", "2025-03-01");
    expect(emitted()).toEqual({
      type: "dateRange",
      answer: { startDate: null, endDate: "2025-03-01" },
    });
  });

  it("changes one end of a number range and keeps the other", () => {
    const { props, emitted } = build("numberRange", { startNumber: 1, endNumber: 9 });
    expect(props.numberRangeProps?.numberRange).toEqual({ startNumber: 1, endNumber: 9 });

    props.numberRangeProps?.handleNumberRangeChange?.("endNumber", 20);
    expect(emitted()).toEqual({
      type: "numberRange",
      answer: { startNumber: 1, endNumber: 20 },
    });
  });

  it("starts an unanswered number range with both ends empty", () => {
    const { props, emitted } = build("numberRange");
    expect(props.numberRangeProps?.numberRange).toEqual({ startNumber: null, endNumber: null });
    props.numberRangeProps?.handleNumberRangeChange?.("startNumber", 3);
    expect(emitted()).toEqual({
      type: "numberRange",
      answer: { startNumber: 3, endNumber: null },
    });
  });

  it("passes a stored yes/no string through to the boolean field", () => {
    const { props } = build("boolean", "yes");
    expect(props.booleanProps?.yesNoValue).toBe("yes");
  });

  it("marks the fields read-only when disabled", () => {
    const { props } = build("text", undefined, { disabled: true });
    expect(props.readOnly).toBe(true);
  });

  it("emits a radio selection change", () => {
    const { props, emitted } = build("radioButtons", "a");
    expect(props.radioProps?.selectedRadioValue).toBe("a");
    props.radioProps?.handleRadioChange?.("b");
    expect(emitted()).toEqual({ type: "radioButtons", answer: "b" });
  });

  it("converts boolean yes/no strings to boolean answers", () => {
    const { props, emitted } = build("boolean", false, {
      parsedJson: { type: "boolean", attributes: { value: false } },
    });

    expect(props.booleanProps?.yesNoValue).toBe("no");
    props.booleanProps?.handleBooleanChange?.("yes");
    expect(emitted()).toEqual({ type: "boolean", answer: true });
  });

  it("preserves an existing additional-comment JSON key when the main answer changes", () => {
    const { props, emitted } = build("radioButtons", "a", {
      draftExtras: { comment: "kept note" },
    });

    props.radioProps?.handleRadioChange?.("b");
    expect(emitted()).toEqual({
      type: "radioButtons",
      answer: "b",
      comment: "kept note",
    });
  });

  it("omits additional comment from emit when the draft has no comment key", () => {
    const { props, emitted } = build("radioButtons", "a");

    props.radioProps?.handleRadioChange?.("b");
    expect(emitted()).toEqual({
      type: "radioButtons",
      answer: "b",
    });
  });
});
