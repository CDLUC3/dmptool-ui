import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import globalMessages from "@/messages/en-US/global.json";
import planAuthoringMessages from "@/messages/en-US/planAuthoring.json";
import PlanQuestionAnswer from "../index";
import type { PlanQuestionDefinition } from "../../model";
import { makeQuestion as makeSharedQuestion } from "../../mocks";

jest.mock("next-intl", () => jest.requireActual("next-intl"));

jest.mock("@/components/TinyMCEEditor", () => ({
  __esModule: true,
  default: ({
    content,
    setContent,
    disabled,
  }: {
    content: string;
    setContent: (value: string) => void;
    disabled?: boolean;
  }) => (
    <textarea
      aria-label="Answer editor"
      value={content}
      disabled={disabled}
      onChange={(event) => setContent(event.target.value)}
    />
  ),
}));

jest.mock("@/components/Form/TypeAheadWithOther/useAffiliationSearch", () => ({
  useAffiliationSearch: () => ({
    suggestions: [{ id: 1, uri: "https://ror.org/01an7q238", displayName: "UC Berkeley" }],
    handleSearch: jest.fn(),
    isSearching: false,
    searchError: null,
  }),
}));

const messages = { ...globalMessages, ...planAuthoringMessages };

function makeQuestion(
  questionType: string,
  parsedJson: Record<string, unknown>
): PlanQuestionDefinition {
  return makeSharedQuestion({
    identity: { kind: "base", versionedQuestionId: 7 },
    title: "Question",
    questionType,
    parsedJson: { type: questionType, ...parsedJson },
  });
}

function renderAnswer(
  question: PlanQuestionDefinition,
  draftAnswer: unknown,
  { disabled = false } = {}
) {
  const onChange = jest.fn();
  render(
    <NextIntlClientProvider locale="en-US" messages={messages} timeZone="UTC">
      <PlanQuestionAnswer
        question={question}
        draftAnswer={draftAnswer}
        disabled={disabled}
        onChange={onChange}
      />
    </NextIntlClientProvider>
  );
  return { onChange };
}

const choiceOptions = [
  { label: "Alex", value: "Alex" },
  { label: "Barbara", value: "Barbara" },
  { label: "Charlie", value: "Charlie" },
];

describe("PlanQuestionAnswer", () => {
  it("renders a text answer and emits typed text", () => {
    const { onChange } = renderAnswer(makeQuestion("text", { attributes: {} }), {
      type: "text",
      answer: "Surveys",
    });

    const field = screen.getByRole("textbox", { name: "text" });
    expect(field).toHaveValue("Surveys");

    fireEvent.change(field, { target: { value: "Surveys and logs" } });
    expect(onChange).toHaveBeenCalledWith({ type: "text", answer: "Surveys and logs" });
  });

  it("renders a text area answer in the editor and emits edits", () => {
    const { onChange } = renderAnswer(makeQuestion("textArea", { attributes: {} }), {
      type: "textArea",
      answer: "<p>Plan</p>",
    });

    const editor = screen.getByRole("textbox", { name: "Answer editor" });
    expect(editor).toHaveValue("<p>Plan</p>");

    fireEvent.change(editor, { target: { value: "<p>Plan B</p>" } });
    expect(onChange).toHaveBeenCalledWith({ type: "textArea", answer: "<p>Plan B</p>" });
  });

  it("checks the stored radio option and emits the chosen one", async () => {
    const user = userEvent.setup();
    const { onChange } = renderAnswer(
      makeQuestion("radioButtons", { options: choiceOptions }),
      { type: "radioButtons", answer: "Barbara" }
    );

    expect(screen.getByRole("radio", { name: "Barbara" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Charlie" }));
    expect(onChange).toHaveBeenCalledWith({ type: "radioButtons", answer: "Charlie" });
  });

  it("checks the stored checkboxes and emits the new selection", async () => {
    const user = userEvent.setup();
    const { onChange } = renderAnswer(
      makeQuestion("checkBoxes", { options: choiceOptions }),
      { type: "checkBoxes", answer: ["Barbara", "Charlie"] }
    );

    const [alex, barbara, charlie] = screen.getAllByRole("checkbox");
    expect(alex).not.toBeChecked();
    expect(barbara).toBeChecked();
    expect(charlie).toBeChecked();

    await user.click(alex);
    expect(onChange).toHaveBeenCalledWith({
      type: "checkBoxes",
      answer: ["Barbara", "Charlie", "Alex"],
    });
  });

  it("maps a boolean answer to Yes/No", async () => {
    const user = userEvent.setup();
    const { onChange } = renderAnswer(makeQuestion("boolean", { attributes: {} }), {
      type: "boolean",
      answer: true,
    });

    expect(screen.getByRole("radio", { name: "Yes" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "No" }));
    expect(onChange).toHaveBeenCalledWith({ type: "boolean", answer: false });
  });

  it.each([
    ["email", "email", "ada@example.com", "grace@example.com"],
    ["url", "url", "https://example.com", "https://dmptool.org"],
  ])("renders a %s answer and emits edits", (questionType, label, stored, next) => {
    const { onChange } = renderAnswer(makeQuestion(questionType, { attributes: {} }), {
      type: questionType,
      answer: stored,
    });

    const field = screen.getByRole("textbox", { name: label });
    expect(field).toHaveValue(stored);

    fireEvent.change(field, { target: { value: next } });
    expect(onChange).toHaveBeenCalledWith({ type: questionType, answer: next });
  });

  it("renders a number answer", () => {
    renderAnswer(makeQuestion("number", { attributes: {} }), {
      type: "number",
      answer: 42,
    });

    expect(screen.getByRole("textbox", { name: "number" })).toHaveValue("42");
  });

  it("shows the additional comment field when the question asks for it and keeps the answer", () => {
    const { onChange } = renderAnswer(
      makeQuestion("radioButtons", { options: choiceOptions, showCommentField: true }),
      { type: "radioButtons", answer: "Alex", comment: "Because" }
    );

    const comment = screen.getByRole("textbox", { name: "Additional comments" });
    expect(comment).toHaveValue("Because");

    fireEvent.change(comment, { target: { value: "Because of reasons" } });
    expect(onChange).toHaveBeenCalledWith({
      type: "radioButtons",
      answer: "Alex",
      comment: "Because of reasons",
    });
  });

  describe("affiliation search", () => {
    const affiliationQuestion = () =>
      makeQuestion("affiliationSearch", { attributes: { label: "Institution" } });

    it("shows the stored affiliation and emits a chosen suggestion", async () => {
      const user = userEvent.setup();
      const { onChange } = renderAnswer(affiliationQuestion(), {
        type: "affiliationSearch",
        answer: { affiliationId: "https://ror.org/03yrm5c26", affiliationName: "CDL" },
      });

      const field = screen.getByRole("textbox", { name: /Institution/ });
      expect(field).toHaveValue("CDL");

      fireEvent.change(field, { target: { value: "Berk" } });
      await user.click(screen.getByRole("option", { name: "UC Berkeley" }));
      expect(onChange).toHaveBeenLastCalledWith({
        type: "affiliationSearch",
        answer: { affiliationId: "https://ror.org/01an7q238", affiliationName: "UC Berkeley" },
      });
    });

    it("saves the free text as the name when Other is chosen", async () => {
      const user = userEvent.setup();
      const { onChange } = renderAnswer(affiliationQuestion(), null);

      fireEvent.change(screen.getByRole("textbox", { name: /Institution/ }), {
        target: { value: "Tiny" },
      });
      await user.click(screen.getByRole("option", { name: "Other" }));
      fireEvent.change(screen.getByRole("textbox", { name: "Other institution" }), {
        target: { value: "Tiny Institute" },
      });

      expect(onChange).toHaveBeenLastCalledWith({
        type: "affiliationSearch",
        answer: { affiliationId: "other", affiliationName: "Tiny Institute" },
      });
    });

    it("reloads a saved Other answer into the other field", () => {
      renderAnswer(affiliationQuestion(), {
        type: "affiliationSearch",
        answer: { affiliationId: "other", affiliationName: "Tiny Institute" },
      });

      expect(screen.getByRole("textbox", { name: /Institution/ })).toHaveValue("Other");
      expect(screen.getByRole("textbox", { name: "Other institution" })).toHaveValue(
        "Tiny Institute"
      );
    });

    it("disables the search when disabled", () => {
      renderAnswer(
        affiliationQuestion(),
        { type: "affiliationSearch", answer: { affiliationId: "x", affiliationName: "CDL" } },
        { disabled: true }
      );

      expect(screen.getByRole("textbox", { name: /Institution/ })).toBeDisabled();
    });
  });

  it("disables the fields when disabled", () => {
    renderAnswer(
      makeQuestion("radioButtons", { options: choiceOptions, showCommentField: true }),
      { type: "radioButtons", answer: "Alex", comment: "Because" },
      { disabled: true }
    );

    screen.getAllByRole("radio").forEach((radio) => expect(radio).toBeDisabled());
    expect(screen.getByRole("textbox", { name: "Additional comments" })).toBeDisabled();
  });
});
