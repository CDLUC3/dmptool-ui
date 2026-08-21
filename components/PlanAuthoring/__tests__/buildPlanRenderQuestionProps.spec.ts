import { buildPlanRenderQuestionProps } from "../buildPlanRenderQuestionProps";

describe("buildPlanRenderQuestionProps", () => {
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
