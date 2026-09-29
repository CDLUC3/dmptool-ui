import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
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

const namedValues = (value: string) =>
  screen.getAllByDisplayValue(value).map((input) => input.getAttribute("name"));

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

  it("shows the stored select option and emits a new choice", async () => {
    const user = userEvent.setup();
    const { onChange } = renderAnswer(
      makeQuestion("selectBox", { options: choiceOptions, attributes: {} }),
      { type: "selectBox", answer: "Barbara" }
    );

    const selectButton = screen.getByTestId("select-button");
    expect(within(selectButton).getByText("Barbara")).toBeInTheDocument();

    await user.click(selectButton);
    await user.click(screen.getByRole("option", { name: "Charlie" }));
    expect(onChange).toHaveBeenCalledWith({ type: "selectBox", answer: "Charlie" });
  });

  it("marks the stored multiselect options and emits the new selection", async () => {
    const user = userEvent.setup();
    const { onChange } = renderAnswer(
      makeQuestion("multiselectBox", { options: choiceOptions, attributes: {} }),
      { type: "multiselectBox", answer: ["Alex", "Charlie"] }
    );

    const [alex, barbara, charlie] = screen.getAllByRole("option");
    expect(alex).toHaveAttribute("aria-selected", "true");
    expect(barbara).toHaveAttribute("aria-selected", "false");
    expect(charlie).toHaveAttribute("aria-selected", "true");

    await user.click(barbara);
    expect(onChange).toHaveBeenCalledWith({
      type: "multiselectBox",
      answer: expect.arrayContaining(["Alex", "Barbara", "Charlie"]),
    });
  });

  it("shows the stored currency amount and emits a number", async () => {
    const user = userEvent.setup();
    const { onChange } = renderAnswer(
      makeQuestion("currency", { attributes: { denomination: "USD", min: 0 } }),
      { type: "currency", answer: 250 }
    );

    const field = screen.getByRole("textbox");
    expect(field).toHaveValue("250");

    await user.clear(field);
    await user.type(field, "1200");
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith({ type: "currency", answer: 1200 });
  });

  it("shows both ends of a stored number range and changes one end only", async () => {
    const user = userEvent.setup();
    const { onChange } = renderAnswer(
      makeQuestion("numberRange", {
        attributes: {},
        columns: { start: { label: "From" }, end: { label: "To" } },
      }),
      { type: "numberRange", answer: { startNumber: 10, endNumber: 20 } }
    );

    const start = screen.getByPlaceholderText("start");
    expect(start).toHaveValue("10");
    expect(screen.getByPlaceholderText("end")).toHaveValue("20");

    await user.clear(start);
    await user.type(start, "15");
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith({
      type: "numberRange",
      answer: { startNumber: 15, endNumber: 20 },
    });
  });

  it("shows a stored date", () => {
    renderAnswer(makeQuestion("date", { attributes: {} }), {
      type: "date",
      answer: "2025-05-15",
    });

    expect(namedValues("2025-05-15")).toContain("startDate");
  });

  it("shows both ends of a stored date range and changes one end only", async () => {
    const user = userEvent.setup();
    const { onChange } = renderAnswer(
      makeQuestion("dateRange", {
        attributes: {},
        columns: { start: { label: "Starts" }, end: { label: "Ends" } },
      }),
      { type: "dateRange", answer: { startDate: "2025-01-01", endDate: "2025-12-31" } }
    );

    expect(screen.getByText("Starts")).toBeInTheDocument();
    expect(screen.getByText("Ends")).toBeInTheDocument();
    expect(namedValues("2025-01-01")).toContain("startDate");
    expect(namedValues("2025-12-31")).toContain("endDate");

    await user.click(screen.getAllByLabelText("Calendar")[0]);
    await user.click(await screen.findByRole("button", { name: /15/ }));
    expect(onChange).toHaveBeenLastCalledWith({
      type: "dateRange",
      answer: { startDate: "2025-01-15", endDate: "2025-12-31" },
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
