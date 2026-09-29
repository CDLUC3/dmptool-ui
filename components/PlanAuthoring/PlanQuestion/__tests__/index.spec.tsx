import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { NextIntlClientProvider } from "next-intl";
import { useToast } from "@/context/ToastContext";
import globalMessages from "@/messages/en-US/global.json";
import planOverviewMessages from "@/messages/en-US/planBuilderPlanOverview.json";
import planAuthoringMessages from "@/messages/en-US/planAuthoring.json";
import PlanQuestion from "../index";
import type { PlanCapabilities, PlanQuestionDefinition } from "../../model";
import {
  createMockDataSource,
  makeModel,
  makeQuestion as makeSharedQuestion,
  makeSection,
} from "../../mocks";
import {
  spyOnDataSource,
  type SpiedMockDataSource,
} from "../../mocks/spyOnDataSource";

expect.extend(toHaveNoViolations);

jest.mock("next-intl", () => jest.requireActual("next-intl"));

jest.mock("@/components/TinyMCEEditor", () => ({
  __esModule: true,
  default: ({
    id,
    content,
    setContent,
    disabled,
  }: {
    id: string;
    content: string;
    setContent: (value: string) => void;
    disabled?: boolean;
  }) => (
    <textarea
      id={id}
      aria-label="Answer editor"
      value={content}
      disabled={disabled}
      onChange={(event) => setContent(event.target.value)}
    />
  ),
}));

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const messages = {
  ...globalMessages,
  ...planOverviewMessages,
  ...planAuthoringMessages,
};

const QUESTION_KEY = "base-question-101";

const editableCapabilities: PlanCapabilities = {
  canEditAnswers: true,
  canComment: true,
  canModerateComments: false,
  canCustomizeGuidance: false,
};

const readOnlyCapabilities: PlanCapabilities = {
  ...editableCapabilities,
  canEditAnswers: false,
};

function makeQuestion(
  overrides: Partial<PlanQuestionDefinition> = {}
): PlanQuestionDefinition {
  return makeSharedQuestion({
    sectionIdentity: { kind: "base", versionedSectionId: 11 },
    title: "<p>What data will <strong>you</strong> collect</p>",
    ...overrides,
  });
}

const textAreaJson = { type: "textArea", attributes: {} };

function createDataSource(
  question: PlanQuestionDefinition = makeQuestion()
): SpiedMockDataSource {
  const section = makeSection({
    identity: question.sectionIdentity,
    questions: [question],
  });
  return spyOnDataSource(
    createMockDataSource({ model: makeModel({ sections: [section] }) })
  );
}

function renderQuestion({
  question = makeQuestion(),
  capabilities = editableCapabilities,
  dataSource = createDataSource(question),
}: {
  question?: PlanQuestionDefinition;
  capabilities?: PlanCapabilities;
  dataSource?: SpiedMockDataSource;
} = {}) {
  const view = render(
    <NextIntlClientProvider locale="en-US" messages={messages} timeZone="UTC">
      <PlanQuestion
        question={question}
        capabilities={capabilities}
        dataSource={dataSource}
        onCustomizeGuidance={jest.fn()}
      />
    </NextIntlClientProvider>
  );
  return { ...view, dataSource };
}

describe("PlanQuestion", () => {
  const toastAdd = jest.fn();

  beforeEach(() => {
    toastAdd.mockReset();
    (useToast as jest.Mock).mockReturnValue({ add: toastAdd });
  });

  describe("header", () => {
    it("shows the question title without HTML tags", () => {
      renderQuestion();

      expect(
        screen.getByRole("heading", { level: 3, name: "What data will you collect" })
      ).toBeInTheDocument();
      expect(screen.getByRole("article")).toHaveAccessibleName(
        "What data will you collect"
      );
    });

    it("opens the funder message from the required badge", async () => {
      const user = userEvent.setup();
      renderQuestion({ question: makeQuestion({ required: true }) });

      await user.click(screen.getByRole("button", { name: "Required by funder" }));

      expect(await screen.findByRole("dialog", { name: "Required by funder" })).toHaveTextContent(
        "The funder has marked this as a required question on their template. You can leave it blank in the tool but should complete it before submitting your grant."
      );
    });

    it("labels requirement text with the organization that set it", () => {
      renderQuestion({
        question: makeQuestion({
          requirementHtml: "<p>Name the steward.</p>",
          requirementOrgLabel: "National Science Foundation",
        }),
      });

      expect(screen.getByText("Requirements by National Science Foundation")).toBeInTheDocument();
    });

    it("has no requirements label without requirement text", () => {
      renderQuestion({ question: makeQuestion({ requirementOrgLabel: "National Science Foundation" }) });

      expect(screen.queryByText(/Requirements by/)).not.toBeInTheDocument();
    });

    it("has no required badge for an optional question", () => {
      renderQuestion();

      expect(
        screen.queryByRole("button", { name: "Required by funder" })
      ).not.toBeInTheDocument();
    });

    it("shows the answered icon when the question has an answer", () => {
      renderQuestion({ question: makeQuestion({ hasAnswer: true }) });

      expect(screen.getByRole("img", { name: "Answered" })).toBeInTheDocument();
      expect(screen.queryByRole("img", { name: "Not answered" })).not.toBeInTheDocument();
    });

    it("shows the not-answered icon when the question has no answer", () => {
      renderQuestion({ question: makeQuestion({ hasAnswer: false }) });

      expect(screen.getByRole("img", { name: "Not answered" })).toBeInTheDocument();
      expect(screen.queryByRole("img", { name: "Answered" })).not.toBeInTheDocument();
    });

    it("renders requirement text and toggles Expand/Collapse when it overflows", async () => {
      jest.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(300);
      jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(80);
      const user = userEvent.setup();
      renderQuestion({
        question: makeQuestion({
          requirementHtml: "<p><strong>Requirements</strong> from the funder</p>",
        }),
      });

      expect(screen.getByText("Requirements").tagName).toBe("STRONG");

      const expand = screen.getByRole("button", { name: "Expand" });
      expect(expand).toHaveAttribute("aria-expanded", "false");

      await user.click(expand);
      const collapse = screen.getByRole("button", { name: "Collapse" });
      expect(collapse).toHaveAttribute("aria-expanded", "true");

      await user.click(collapse);
      expect(screen.getByRole("button", { name: "Expand" })).toBeInTheDocument();
    });

    it("has no Expand toggle when the requirement text fits", () => {
      renderQuestion({
        question: makeQuestion({ requirementHtml: "<p>Short</p>" }),
      });

      expect(screen.getByText("Short")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Expand" })).not.toBeInTheDocument();
    });
  });

  describe("editing", () => {
    it("prefills the field from the stored answer", () => {
      renderQuestion({
        question: makeQuestion({
          answerJson: { type: "text", answer: "Survey responses" },
          hasAnswer: true,
        }),
      });

      expect(screen.getByRole("textbox", { name: "text" })).toHaveValue(
        "Survey responses"
      );
    });

    it("saves the draft through saveAnswer when Save is pressed", async () => {
      const user = userEvent.setup();
      const { dataSource } = renderQuestion();

      await user.type(screen.getByRole("textbox", { name: "text" }), "Logs");
      expect(screen.getByRole("status")).toHaveTextContent("Unsaved changes");

      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(dataSource.saveAnswer).toHaveBeenCalledTimes(1);
      expect(dataSource.saveAnswer).toHaveBeenCalledWith(QUESTION_KEY, {
        type: "text",
        answer: "Logs",
      });
      await waitFor(() => {
        expect(screen.getByRole("status")).toHaveTextContent(/^Saved$/);
      });
    });

    it("shows the save error messages of an invalid save", async () => {
      const user = userEvent.setup();
      const dataSource = createDataSource();
      dataSource.saveAnswer.mockResolvedValue({
        kind: "invalid",
        messages: ["The answer is not in the proper format."],
      });
      renderQuestion({ dataSource });

      await user.type(screen.getByRole("textbox", { name: "text" }), "x");
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(screen.getByRole("status")).toHaveTextContent(
          "The answer is not in the proper format."
        );
      });
    });

    it("prefills the editor with sample text when that is the default", () => {
      renderQuestion({
        question: makeQuestion({
          questionType: "textArea",
          parsedJson: textAreaJson,
          sampleText: "<p>Default sample</p>",
          useSampleTextAsDefault: true,
        }),
      });

      expect(screen.getByRole("textbox", { name: "Answer editor" })).toHaveValue(
        "<p>Default sample</p>"
      );
    });

    it("does not prefill sample text once an answer exists, even an empty one", () => {
      renderQuestion({
        question: makeQuestion({
          questionType: "textArea",
          parsedJson: textAreaJson,
          answerJson: { type: "textArea", answer: "" },
          sampleText: "<p>Default sample</p>",
          useSampleTextAsDefault: true,
        }),
      });

      expect(screen.getByRole("textbox", { name: "Answer editor" })).toHaveValue("");
    });
  });

  describe("sample answers", () => {
    it("fills the draft with the sample when Use answer is pressed", async () => {
      const user = userEvent.setup();
      renderQuestion({
        question: makeQuestion({
          questionType: "textArea",
          parsedJson: textAreaJson,
          sampleText: "<p>Sample from CDL</p>",
          sampleTextOrgLabel: "CDL",
        }),
      });

      await user.click(screen.getByRole("button", { name: "View sample answer" }));
      expect(screen.getByRole("heading", { name: "CDL sample text" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Use answer" }));

      expect(screen.getByRole("textbox", { name: "Answer editor" })).toHaveValue(
        "<p>Sample from CDL</p>"
      );
      expect(screen.getByRole("status")).toHaveTextContent("Unsaved changes");
      expect(toastAdd).toHaveBeenCalledWith("Sample text added", {
        type: "success",
        timeout: 3000,
      });
    });

    it("shows both the template and customization samples", async () => {
      const user = userEvent.setup();
      renderQuestion({
        question: makeQuestion({
          questionType: "textArea",
          parsedJson: textAreaJson,
          sampleText: "<p>Base sample</p>",
          sampleTextOrgLabel: "NSF",
          customizationSampleText: "<p>Custom sample</p>",
          customizationSampleOrgLabel: "CDL",
        }),
      });

      await user.click(
        screen.getByRole("button", { name: "View sample answers (2)" })
      );
      await user.click(screen.getAllByRole("button", { name: "Use answer" })[1]);

      expect(screen.getByRole("textbox", { name: "Answer editor" })).toHaveValue(
        "<p>Custom sample</p>"
      );
    });

    it("offers only the customization sample when the template has none", async () => {
      const user = userEvent.setup();
      renderQuestion({
        question: makeQuestion({
          questionType: "textArea",
          parsedJson: textAreaJson,
          customizationSampleText: "<p>Custom only</p>",
          customizationSampleOrgLabel: "CDL",
        }),
      });

      await user.click(screen.getByRole("button", { name: "View sample answer" }));

      expect(screen.getByRole("heading", { name: "CDL sample text" })).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: "Use answer" })).toHaveLength(1);
    });

    it("offers no samples for a question that is not a text area", () => {
      renderQuestion({
        question: makeQuestion({ sampleText: "<p>Sample</p>" }),
      });

      expect(
        screen.queryByRole("button", { name: "View sample answer" })
      ).not.toBeInTheDocument();
    });

    it("offers no samples when answers are read-only", () => {
      renderQuestion({
        capabilities: readOnlyCapabilities,
        question: makeQuestion({
          questionType: "textArea",
          parsedJson: textAreaJson,
          sampleText: "<p>Sample</p>",
        }),
      });

      expect(
        screen.queryByRole("button", { name: "View sample answer" })
      ).not.toBeInTheDocument();
    });
  });

  describe("read-only", () => {
    it("disables the field and hides Save and the save status", () => {
      renderQuestion({
        capabilities: readOnlyCapabilities,
        question: makeQuestion({
          answerJson: { type: "text", answer: "Survey responses" },
          hasAnswer: true,
          lastSavedAt: String(Date.now() - 60 * 60 * 1000),
        }),
      });

      const field = screen.getByRole("textbox", { name: "text" });
      expect(field).toBeDisabled();
      expect(field).toHaveValue("Survey responses");

      fireEvent.change(field, { target: { value: "changed" } });
      expect(field).toHaveValue("Survey responses");

      expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("disables choice fields", () => {
      renderQuestion({
        capabilities: readOnlyCapabilities,
        question: makeQuestion({
          questionType: "radioButtons",
          parsedJson: {
            type: "radioButtons",
            options: [
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ],
          },
          answerJson: { type: "radioButtons", answer: "no" },
          hasAnswer: true,
        }),
      });

      expect(screen.getByRole("radio", { name: "Yes" })).toBeDisabled();
      expect(screen.getByRole("radio", { name: "No" })).toBeDisabled();
      expect(screen.getByRole("radio", { name: "No" })).toBeChecked();
    });

    it("renders a text area answer as sanitized HTML instead of an editor", () => {
      const { container } = renderQuestion({
        capabilities: readOnlyCapabilities,
        question: makeQuestion({
          questionType: "textArea",
          parsedJson: textAreaJson,
          answerJson: {
            type: "textArea",
            answer: '<p>Stored <strong>answer</strong><script>window.hacked = true</script><img src="x" onerror="window.hacked = true"></p>',
          },
          hasAnswer: true,
        }),
      });

      expect(screen.queryByRole("textbox", { name: "Answer editor" })).not.toBeInTheDocument();
      expect(screen.getByText("answer").tagName).toBe("STRONG");
      expect(container.querySelector("script")).toBeNull();
      expect(container.querySelector("img")).not.toHaveAttribute("onerror");
    });

    it('shows "Not answered yet." for an empty text area answer', () => {
      renderQuestion({
        capabilities: readOnlyCapabilities,
        question: makeQuestion({
          questionType: "textArea",
          parsedJson: textAreaJson,
        }),
      });

      expect(screen.getByText("Not answered yet.")).toBeInTheDocument();
    });
  });

  describe("invalid question JSON", () => {
    it("shows an inline error instead of the field, Save and samples", () => {
      renderQuestion({
        question: makeQuestion({
          questionType: "textArea",
          parsedJson: {},
          jsonError: "parseFailed",
          sampleText: "<p>Sample</p>",
        }),
      });

      expect(screen.getByText("JSON.parse failed.")).toBeInTheDocument();
      expect(screen.queryByRole("textbox", { name: "Answer editor" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "View sample answer" })
      ).not.toBeInTheDocument();
    });

    it("keeps the title visible so the question can still be identified", () => {
      renderQuestion({
        question: makeQuestion({ parsedJson: {}, jsonError: "unexpectedFormat" }),
      });

      expect(screen.getByText("Unexpected format for question.json.")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 3, name: "What data will you collect" })
      ).toBeInTheDocument();
    });
  });

  describe("comments", () => {
    it("tells the user to save an answer before commenting", async () => {
      const user = userEvent.setup();
      renderQuestion({ question: makeQuestion({ hasAnswer: false }) });

      await user.click(screen.getByRole("button", { name: /Show comments/ }));

      expect(
        await screen.findByText("Save an answer before adding comments.")
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("textbox", { name: "Add a comment" })
      ).not.toBeInTheDocument();
    });

    it("adds a comment for this question through the data source", async () => {
      const user = userEvent.setup();
      const dataSource = createDataSource();
      dataSource.addComment.mockResolvedValue({
        id: "answer-1",
        authorId: 1,
        authorName: "Ada",
        createdLabel: "just now",
        text: "Looks good",
        canEdit: true,
        canDelete: true,
      });
      renderQuestion({ question: makeQuestion({ hasAnswer: true }), dataSource });

      await user.click(screen.getByRole("button", { name: /Show comments/ }));
      await user.type(
        await screen.findByRole("textbox", { name: "Add a comment" }),
        "Looks good"
      );
      await user.click(screen.getByRole("button", { name: "Comment" }));

      await waitFor(() => {
        expect(dataSource.addComment).toHaveBeenCalledWith(QUESTION_KEY, "Looks good");
      });
    });

    const existingComment = {
      id: "answer-7",
      authorId: 1,
      authorName: "Ada",
      createdLabel: "yesterday",
      text: "First draft",
      canEdit: true,
      canDelete: true,
    };

    it("edits a comment for this question through the data source", async () => {
      const user = userEvent.setup();
      const question = makeQuestion({ hasAnswer: true, comments: [existingComment] });
      const dataSource = createDataSource(question);
      renderQuestion({ question, dataSource });

      await user.click(screen.getByRole("button", { name: /Show comments/ }));
      await user.click(await screen.findByRole("button", { name: "Edit" }));
      const editor = screen.getByRole("textbox", { name: "Edit comment" });
      await user.clear(editor);
      await user.type(editor, "Second draft");
      await user.click(
        within(screen.getByRole("list", { name: "Comments" })).getByRole("button", {
          name: "Save",
        })
      );

      await waitFor(() => {
        expect(dataSource.updateComment).toHaveBeenCalledWith(
          QUESTION_KEY,
          "answer-7",
          "Second draft"
        );
      });
    });

    it("deletes a comment for this question through the data source", async () => {
      const user = userEvent.setup();
      const question = makeQuestion({ hasAnswer: true, comments: [existingComment] });
      const dataSource = createDataSource(question);
      renderQuestion({ question, dataSource });

      await user.click(screen.getByRole("button", { name: /Show comments/ }));
      await user.click(await screen.findByRole("button", { name: "Delete" }));

      await waitFor(() => {
        expect(dataSource.deleteComment).toHaveBeenCalledWith(QUESTION_KEY, "answer-7");
      });
    });
  });

  describe("resize handle", () => {
    it("resizes with the keyboard and resets with Home", () => {
      renderQuestion();
      const article = screen.getByRole("article");
      const handle = screen.getByRole("separator", {
        name: "Resize question — drag, or double-click to reset",
      });

      expect(article).toHaveAttribute("data-resized", "false");

      fireEvent.keyDown(handle, { key: "ArrowDown" });
      expect(article).toHaveAttribute("data-resized", "true");
      expect(article).toHaveStyle({ height: "280px" });

      fireEvent.keyDown(handle, { key: "Home" });
      expect(article).toHaveAttribute("data-resized", "false");
    });

    it("resizes by dragging, never below 280px, and stops when released", () => {
      renderQuestion();
      const article = screen.getByRole("article");
      jest
        .spyOn(article, "getBoundingClientRect")
        .mockReturnValue(new DOMRect(0, 0, 0, 400));
      const drag = (type: string, clientY: number) =>
        act(() => {
          window.dispatchEvent(new MouseEvent(type, { clientY }));
        });

      fireEvent(
        screen.getByRole("separator"),
        new MouseEvent("pointerdown", { bubbles: true, clientY: 100 })
      );
      drag("pointermove", 160);
      expect(article).toHaveStyle({ height: "460px" });

      drag("pointermove", -500);
      expect(article).toHaveStyle({ height: "280px" });

      drag("pointerup", -500);
      drag("pointermove", 300);
      expect(article).toHaveStyle({ height: "280px" });
    });

    it("grows with ArrowDown from the current height and shrinks with ArrowUp", () => {
      renderQuestion();
      const article = screen.getByRole("article");
      jest
        .spyOn(article, "getBoundingClientRect")
        .mockReturnValue(new DOMRect(0, 0, 0, 400));
      const handle = screen.getByRole("separator");

      fireEvent.keyDown(handle, { key: "ArrowDown" });
      expect(article).toHaveStyle({ height: "424px" });
      fireEvent.keyDown(handle, { key: "ArrowUp" });
      expect(article).toHaveStyle({ height: "400px" });
      expect(handle).toHaveAttribute("aria-valuenow", "400");
    });

    it("resets the height on double-click", () => {
      renderQuestion();
      const article = screen.getByRole("article");
      const handle = screen.getByRole("separator");

      fireEvent.keyDown(handle, { key: "ArrowDown" });
      fireEvent.doubleClick(handle);

      expect(article).toHaveAttribute("data-resized", "false");
    });
  });

  it("has no accessibility violations", async () => {
    const { container } = renderQuestion({
      question: makeQuestion({
        required: true,
        hasAnswer: true,
        answerJson: { type: "text", answer: "Survey responses" },
      }),
    });

    expect(within(container).getByRole("article")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
