import type React from "react";
import { CalendarDate } from "@internationalized/date";
import { buildPlanRenderQuestionProps } from "../buildPlanRenderQuestionProps";

function build(questionType: string, answer: unknown) {
  const onChange = jest.fn();
  const props = buildPlanRenderQuestionProps({
    questionType,
    parsedJson: { type: questionType },
    draftAnswer: answer === undefined ? null : { type: questionType, answer },
    editorId: "editor",
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
  it.each([
    ["text", "textFieldProps", "handleTextChange"],
    ["url", "urlProps", "handleUrlChange"],
    ["email", "emailProps", "handleEmailChange"],
  ] as const)("emits typed %s input", (type, bag, handler) => {
    const { props, emitted } = build(type, "old");
    (props[bag] as Record<string, (e: React.ChangeEvent<HTMLInputElement>) => void>)[
      handler
    ](inputEvent("new"));
    expect(emitted()).toEqual({ type, answer: "new" });
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
    props.checkBoxProps?.handleCheckboxGroupChange(["c"]);
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
    const { props } = build("selectBox", undefined);
    expect(props.selectBoxProps?.selectedSelectValue).toBeUndefined();
  });

  it("maps a multiselect answer to a Set and emits an array", () => {
    const { props, emitted } = build("multiselectBox", ["a", "b"]);
    expect(props.multiSelectBoxProps?.selectedMultiSelectValues).toEqual(new Set(["a", "b"]));
    props.multiSelectBoxProps?.handleMultiSelectChange(new Set(["b", "c"]));
    expect(emitted()).toEqual({ type: "multiselectBox", answer: ["b", "c"] });
  });

  it.each([
    ["number", "numberProps", "numberValue", "handleNumberChange"],
    ["currency", "currencyProps", "inputCurrencyValue", "handleCurrencyChange"],
  ] as const)("maps and emits a %s answer", (type, bag, valueKey, handler) => {
    const { props, emitted } = build(type, 12.5);
    const bagProps = props[bag] as unknown as Record<string, unknown>;
    expect(bagProps[valueKey]).toBe(12.5);
    (bagProps[handler] as (value: number) => void)(40);
    expect(emitted()).toEqual({ type, answer: 40 });
  });

  it("treats a non-number stored value as empty for number fields", () => {
    const { props } = build("number", "12");
    expect(props.numberProps?.numberValue).toBeNull();
  });

  it("emits a picked date as an ISO string, and a cleared one as null", () => {
    const { props, emitted } = build("date", "2025-01-01");
    expect(props.dateProps?.dateValue).toBe("2025-01-01");

    props.dateProps?.handleDateChange(new CalendarDate(2025, 5, 15));
    expect(emitted()).toEqual({ type: "date", answer: "2025-05-15" });

    props.dateProps?.handleDateChange("2025-06-01");
    expect(emitted()).toEqual({ type: "date", answer: "2025-06-01" });

    props.dateProps?.handleDateChange(null);
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

    props.dateRangeProps?.handleDateRangeChange("startDate", new CalendarDate(2025, 2, 1));
    expect(emitted()).toEqual({
      type: "dateRange",
      answer: { startDate: "2025-02-01", endDate: "2025-12-31" },
    });

    props.dateRangeProps?.handleDateRangeChange("endDate", null);
    expect(emitted()).toEqual({
      type: "dateRange",
      answer: { startDate: "2025-01-01", endDate: null },
    });

    props.dateRangeProps?.handleDateRangeChange("endDate", "2026-01-01");
    expect(emitted()).toEqual({
      type: "dateRange",
      answer: { startDate: "2025-01-01", endDate: "2026-01-01" },
    });
  });

  it("starts an unanswered date range with both ends empty", () => {
    const { props, emitted } = build("dateRange", undefined);
    expect(props.dateRangeProps?.dateRange).toEqual({ startDate: null, endDate: null });
    props.dateRangeProps?.handleDateRangeChange("endDate", "2025-03-01");
    expect(emitted()).toEqual({
      type: "dateRange",
      answer: { startDate: null, endDate: "2025-03-01" },
    });
  });

  it("changes one end of a number range and keeps the other", () => {
    const { props, emitted } = build("numberRange", { startNumber: 1, endNumber: 9 });
    expect(props.numberRangeProps?.numberRange).toEqual({ startNumber: 1, endNumber: 9 });

    props.numberRangeProps?.handleNumberRangeChange("endNumber", 20);
    expect(emitted()).toEqual({
      type: "numberRange",
      answer: { startNumber: 1, endNumber: 20 },
    });
  });

  it("starts an unanswered number range with both ends empty", () => {
    const { props, emitted } = build("numberRange", undefined);
    expect(props.numberRangeProps?.numberRange).toEqual({ startNumber: null, endNumber: null });
    props.numberRangeProps?.handleNumberRangeChange("startNumber", 3);
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
    const props = buildPlanRenderQuestionProps({
      questionType: "text",
      parsedJson: { type: "text" },
      draftAnswer: null,
      disabled: true,
      editorId: "editor",
      onChange: jest.fn(),
    });
    expect(props.readOnly).toBe(true);
  });

  it("maps a draft answer into useRenderQuestionField prop bags", () => {
    const onChange = jest.fn();
    const props = buildPlanRenderQuestionProps({
      questionType: "radioButtons",
      parsedJson: {
        type: "radioButtons",
        options: [{ label: "A", value: "a" }],
      },
      draftAnswer: { type: "radioButtons", answer: "a" },
      editorId: "editor-1",
      onChange,
    });

    expect(props.questionType).toBe("radioButtons");
    expect(props.editorId).toBe("editor-1");
    expect(props.radioProps?.selectedRadioValue).toBe("a");

    props.radioProps?.handleRadioChange("b");
    expect(onChange).toHaveBeenCalledWith({
      type: "radioButtons",
      answer: "b",
    });
  });

  it("converts boolean yes/no strings to boolean answers", () => {
    const onChange = jest.fn();
    const props = buildPlanRenderQuestionProps({
      questionType: "boolean",
      parsedJson: { type: "boolean", attributes: { value: false } },
      draftAnswer: { type: "boolean", answer: false },
      editorId: "editor-2",
      onChange,
    });

    expect(props.booleanProps?.yesNoValue).toBe("no");
    props.booleanProps?.handleBooleanChange("yes");
    expect(onChange).toHaveBeenCalledWith({
      type: "boolean",
      answer: true,
    });
  });

  it("preserves an existing additional-comment JSON key when the main answer changes", () => {
    const onChange = jest.fn();
    const props = buildPlanRenderQuestionProps({
      questionType: "radioButtons",
      parsedJson: {
        type: "radioButtons",
        options: [{ label: "A", value: "a" }],
      },
      draftAnswer: {
        type: "radioButtons",
        answer: "a",
        comment: "kept note",
      },
      editorId: "editor-3",
      onChange,
    });

    props.radioProps?.handleRadioChange("b");
    expect(onChange).toHaveBeenCalledWith({
      type: "radioButtons",
      answer: "b",
      comment: "kept note",
    });
  });

  it("omits additional comment from emit when the draft has no comment key", () => {
    const onChange = jest.fn();
    const props = buildPlanRenderQuestionProps({
      questionType: "radioButtons",
      parsedJson: {
        type: "radioButtons",
        options: [{ label: "A", value: "a" }],
      },
      draftAnswer: { type: "radioButtons", answer: "a" },
      editorId: "editor-4",
      onChange,
    });

    props.radioProps?.handleRadioChange("b");
    expect(onChange).toHaveBeenCalledWith({
      type: "radioButtons",
      answer: "b",
    });
  });
});
