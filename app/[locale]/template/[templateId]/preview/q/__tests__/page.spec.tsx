import React from "react";
import { fireEvent, render, screen } from "@/utils/test-utils";
import { useApolloClient } from "@apollo/client/react";
import { useParams, useSearchParams } from "next/navigation";
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";
import { TemplatePreviewDocument } from "@/generated/graphql";
import type { PlanQuestionDefinition } from "@/components/PlanAuthoring/model";
import {
  questionPreviewChannelName,
  type QuestionPreviewDraft,
  type QuestionPreviewMessage,
} from "@/components/QuestionPreviewLink/questionPreviewDraft";
import TemplateQuestionPreviewLayout from "../[questionId]/layout";
import TemplateQuestionPreviewPage from "../[questionId]/page";
import type { TemplatePreviewTemplate } from "../../toTemplatePreviewModel";

const mockPush = jest.fn();

jest.mock("@apollo/client/react", () => ({
  useApolloClient: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: mockPush, replace: jest.fn(), back: jest.fn() })),
}));

jest.mock("@/components/PlanAuthoring/PlanQuestion", () => ({
  __esModule: true,
  default: ({ question }: { question: PlanQuestionDefinition }) => <h3>{question.title}</h3>,
}));

jest.mock("../../useTemplatePreviewExampleGuidance", () => ({
  useTemplatePreviewExampleGuidance: () => EXAMPLE_GUIDANCE,
}));

const EXAMPLE_GUIDANCE = { label: "Example org", shortName: "Example", bodyHtml: "<p>Example</p>", noTemplateGuidanceNoteHtml: "" };

const TEMPLATE: TemplatePreviewTemplate = {
  id: 7,
  name: "NSF DMP",
  owner: null,
  sections: [
    {
      id: 2,
      name: "Data collection",
      displayOrder: 1,
      questions: [
        { id: 21, displayOrder: 1, questionText: "Before", json: '{"type":"text"}' },
        { id: 22, displayOrder: 2, questionText: "Current", json: '{"type":"text"}' },
        { id: 23, displayOrder: 3, questionText: "After", json: '{"type":"text"}' },
      ],
    },
    { id: 3, name: "Sharing", displayOrder: 2, questions: [{ id: 31, displayOrder: 1, questionText: "Other section", json: '{"type":"text"}' }] },
  ],
};

const DRAFT: QuestionPreviewDraft = {
  sectionId: 2,
  questionText: "Unsaved wording",
  requirementText: null,
  guidanceText: null,
  sampleText: null,
  useSampleTextAsDefault: false,
  required: false,
  json: '{"type":"text"}',
};

const query = jest.fn();
const channels: BroadcastChannel[] = [];

function renderPage(questionId: string, search: Record<string, string> = {}) {
  (useParams as jest.Mock).mockReturnValue({ templateId: "7", questionId });
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(search));
  render(
    <TemplateQuestionPreviewLayout>
      <TemplateQuestionPreviewPage />
    </TemplateQuestionPreviewLayout>
  );
}

/** Answers the preview's request for a draft, as the editor tab does. */
function openEditorTab(previewId: string, draft: QuestionPreviewDraft) {
  const channel = new BroadcastChannel(questionPreviewChannelName(previewId));
  channels.push(channel);
  channel.onmessage = (event: MessageEvent<QuestionPreviewMessage<QuestionPreviewDraft>>) => {
    if (event.data.type === "request") channel.postMessage({ type: "draft", draft });
  };
  return channel;
}

describe("TemplateQuestionPreviewPage", () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
    query.mockImplementation(({ query: document }) =>
      Promise.resolve(document === TemplatePreviewDocument ? { data: { template: TEMPLATE } } : { data: {} })
    );
    (useApolloClient as jest.Mock).mockReturnValue({ query });
  });

  afterEach(() => {
    channels.splice(0).forEach((channel) => channel.close());
  });

  it("shows only the question, under its section's heading", async () => {
    renderPage("22");

    expect(await screen.findByText("Current")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data collection" })).toBeInTheDocument();
    for (const title of ["Before", "After", "Other section"]) {
      expect(screen.queryByText(title)).not.toBeInTheDocument();
    }
    expect(screen.getByText("questionPreview.notice.saved")).toBeInTheDocument();
  });

  it("goes back to editing the question, not to the whole template preview, when opened on its own", async () => {
    const close = jest.spyOn(window, "close").mockImplementation(() => {});
    renderPage("22");
    await screen.findByText("Current");

    expect(screen.queryByRole("link", { name: "backToTemplate" })).not.toBeInTheDocument();
    const back = screen.getByRole("link", { name: "questionPreview.backToQuestion" });
    expect(back).toHaveAttribute("href", "/template/7/q/22");
    expect(screen.getByRole("link", { name: "breadcrumbs.question" })).toHaveAttribute("href", "/template/7/q/22");

    fireEvent.click(back);
    expect(close).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/template/7/q/22");
    close.mockRestore();
  });

  it("closes itself to go back to the editor tab that's still open", async () => {
    const close = jest.spyOn(window, "close").mockImplementation(() => {});
    openEditorTab("abc", DRAFT);
    renderPage("22", { draft: "abc" });
    await screen.findByText("Unsaved wording");

    fireEvent.click(
      screen.getByRole("link", { name: "questionPreview.backToQuestion (questionPreview.closesThisTab)" })
    );

    expect(close).toHaveBeenCalled();
    close.mockRestore();
  });

  it("shows the editor's unsaved draft and follows changes to it", async () => {
    const editor = openEditorTab("abc", DRAFT);
    renderPage("22", { draft: "abc" });

    expect(await screen.findByText("Unsaved wording")).toBeInTheDocument();
    expect(screen.getByText("questionPreview.notice.draft")).toBeInTheDocument();

    editor.postMessage({ type: "draft", draft: { ...DRAFT, questionText: "Edited again" } });
    expect(await screen.findByText("Edited again")).toBeInTheDocument();
  });

  it("adds a new question to the end of its section from the draft", async () => {
    openEditorTab("abc", { ...DRAFT, questionText: "Brand new" });
    renderPage("new", { draft: "abc", section_id: "2" });

    expect(await screen.findByText("Brand new")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data collection" })).toBeInTheDocument();
    expect(screen.queryByText("After")).not.toBeInTheDocument();
  });

  it("asks for a new question to be previewed from its editor when the editor isn't open", async () => {
    renderPage("new", { draft: "gone", section_id: "2" });

    expect(await screen.findByText("questionPreview.notFoundNew")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "questionPreview.backToQuestion" }).getAttribute("href")).toContain(
      "/template/7/q/new"
    );
  });

  it("says when the question can't be found", async () => {
    renderPage("99");

    expect(await screen.findByText("questionPreview.notFound")).toBeInTheDocument();
  });

  it("explains when the preview can't be loaded", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    query.mockRejectedValue(new Error("Network down"));
    renderPage("22");

    expect(await screen.findByText("errors.failed.title")).toBeInTheDocument();
  });
});
