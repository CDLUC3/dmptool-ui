import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { NextIntlClientProvider } from "next-intl";
import globalMessages from "@/messages/en-US/global.json";
import planAuthoringMessages from "@/messages/en-US/planAuthoring.json";
import PlanQuestionSidebar from "../index";
import type { PlanGuidanceSource, PlanGuidanceSourceType } from "../../model";
import { makeComment, makeGuidanceSource } from "../../mocks";

expect.extend(toHaveNoViolations);

jest.mock("next-intl", () => jest.requireActual("next-intl"));

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const messages = { ...globalMessages, ...planAuthoringMessages };

function source(
  id: string,
  type: PlanGuidanceSourceType,
  shortName: string
): PlanGuidanceSource {
  return makeGuidanceSource({
    id,
    type,
    label: `${shortName} guidance label`,
    shortName,
    bodyHtml: `<p>${shortName} says hello</p>`,
  });
}

const bestPractice = source("dmptool", "BEST_PRACTICE", "DMP Tool");
const templateOwner = source("nsf", "TEMPLATE_OWNER", "NSF");
const userAffiliation = source("cdl", "USER_AFFILIATION", "CDL");
const userSelected = source("ucb", "USER_SELECTED", "UCB");

type SidebarProps = React.ComponentProps<typeof PlanQuestionSidebar>;

function renderSidebar(overrides: Partial<SidebarProps> = {}) {
  const props: SidebarProps = {
    questionTitleId: "question-title",
    sources: [bestPractice, templateOwner, userAffiliation],
    comments: [],
    canCustomize: false,
    canComment: true,
    loadGuidance: jest.fn().mockResolvedValue([bestPractice, templateOwner, userAffiliation]),
    loadComments: jest.fn().mockResolvedValue([]),
    onAddComment: jest.fn().mockResolvedValue(undefined),
    onUpdateComment: jest.fn(),
    onDeleteComment: jest.fn().mockResolvedValue(undefined),
    onCustomize: jest.fn(),
    ...overrides,
  };
  const view = render(
    <NextIntlClientProvider locale="en-US" messages={messages} timeZone="UTC">
      <h3 id="question-title">What data will you collect</h3>
      <PlanQuestionSidebar {...props} />
    </NextIntlClientProvider>
  );
  return { ...view, props };
}

function guidancePill(name: string) {
  return within(screen.getByRole("radiogroup", { name: "Guidance sources" })).getByRole(
    "radio",
    { name }
  );
}

describe("PlanQuestionSidebar", () => {
  describe("default guidance tab", () => {
    it("selects the user's organization first", () => {
      renderSidebar({ sources: [bestPractice, templateOwner, userAffiliation] });

      expect(guidancePill("CDL")).toBeChecked();
      expect(screen.getByRole("heading", { level: 4, name: "CDL guidance label" })).toBeInTheDocument();
      expect(screen.getByText("CDL says hello")).toBeInTheDocument();
    });

    it("falls back to the template owner", () => {
      renderSidebar({ sources: [bestPractice, templateOwner] });

      expect(guidancePill("NSF")).toBeChecked();
      expect(screen.getByRole("heading", { level: 4, name: "NSF guidance label" })).toBeInTheDocument();
    });

    it("falls back to the first source", () => {
      renderSidebar({ sources: [userSelected, bestPractice] });

      expect(guidancePill("UCB")).toBeChecked();
    });

    it("asks to pick a source when there is none", () => {
      renderSidebar({ sources: [] });

      expect(screen.getByText("Select a guidance source.")).toBeInTheDocument();
    });
  });

  it.each<[PlanGuidanceSourceType, string, PlanGuidanceSource]>([
    ["BEST_PRACTICE", "Best practice by", bestPractice],
    ["TEMPLATE_OWNER", "Template owner guidance", templateOwner],
    ["USER_AFFILIATION", "Your organization's guidance", userAffiliation],
    ["USER_SELECTED", "Additional guidance", userSelected],
  ])('labels %s guidance "%s"', (_type, heading, guidance) => {
    renderSidebar({ sources: [guidance] });

    expect(screen.getByText(heading)).toBeInTheDocument();
  });

  it("shows another source's guidance when its pill is selected", async () => {
    const user = userEvent.setup();
    const { props } = renderSidebar();

    await user.click(guidancePill("DMP Tool"));

    expect(await screen.findByText("DMP Tool says hello")).toBeInTheDocument();
    expect(screen.getByText("Best practice by")).toBeInTheDocument();
    expect(props.loadGuidance).toHaveBeenCalledTimes(1);
  });

  describe("Customize", () => {
    it("is offered and calls onCustomize when allowed", async () => {
      const user = userEvent.setup();
      const { props } = renderSidebar({ canCustomize: true });

      await user.click(screen.getByRole("button", { name: "+ Customize" }));

      expect(props.onCustomize).toHaveBeenCalledTimes(1);
    });

    it("is hidden when not allowed", () => {
      renderSidebar({ canCustomize: false });

      expect(screen.queryByRole("button", { name: "+ Customize" })).not.toBeInTheDocument();
    });
  });

  it("shows a retryable error when guidance fails to load", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const user = userEvent.setup();
    const loadGuidance = jest
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce([bestPractice, templateOwner, userAffiliation]);
    renderSidebar({ loadGuidance });

    await user.click(guidancePill("NSF"));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Unable to load guidance.");

    await user.click(within(alert).getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
    expect(loadGuidance).toHaveBeenCalledTimes(2);
    expect(screen.getByText("NSF says hello")).toBeInTheDocument();
  });

  describe("comment count", () => {
    it("reads '{n} comments'", () => {
      renderSidebar({
        comments: [makeComment(), makeComment({ id: "answer-2" }), makeComment({ id: "feedback-1" })],
      });

      expect(screen.getByRole("button", { name: /Show comments/ })).toHaveTextContent(
        "Show comments3 comments"
      );
    });

    it("reads '1 comment'", () => {
      renderSidebar({ comments: [makeComment()] });

      expect(screen.getByRole("button", { name: /Show comments/ })).toHaveTextContent(
        "Show comments1 comment"
      );
    });

    it("shows no count without comments", () => {
      renderSidebar({ comments: [] });

      expect(screen.getByRole("button", { name: /Show comments/ })).toHaveTextContent(
        /^Show comments$/
      );
    });
  });

  describe("comments panel", () => {
    it("opens, loads the comments and closes again", async () => {
      const user = userEvent.setup();
      const loadComments = jest.fn().mockResolvedValue([makeComment()]);
      renderSidebar({ loadComments });

      const toggle = screen.getByRole("button", { name: /Show comments/ });
      expect(toggle).toHaveAttribute("aria-expanded", "false");

      await user.click(toggle);

      expect(await screen.findByText("First comment")).toBeInTheDocument();
      expect(loadComments).toHaveBeenCalledTimes(1);
      const hide = screen.getByRole("button", { name: /Hide comments/ });
      expect(hide).toHaveAttribute("aria-expanded", "true");

      await user.click(hide);
      expect(screen.queryByText("First comment")).not.toBeInTheDocument();
      expect(screen.getByText("CDL says hello")).toBeInTheDocument();
    });

    it("shows a retryable error when comments fail to load", async () => {
      jest.spyOn(console, "error").mockImplementation(() => undefined);
      const user = userEvent.setup();
      const loadComments = jest
        .fn()
        .mockRejectedValueOnce(new Error("offline"))
        .mockResolvedValueOnce([makeComment()]);
      renderSidebar({ loadComments });

      await user.click(screen.getByRole("button", { name: /Show comments/ }));
      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("Unable to load comments.");

      await user.click(within(alert).getByRole("button", { name: "Retry" }));

      expect(await screen.findByText("First comment")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("adds a comment and shows the refreshed list", async () => {
      const user = userEvent.setup();
      const added = makeComment({ id: "answer-2", text: "Second comment" });
      const loadComments = jest
        .fn()
        .mockResolvedValueOnce([makeComment()])
        .mockResolvedValueOnce([makeComment(), added]);
      const { props } = renderSidebar({ loadComments });

      await user.click(screen.getByRole("button", { name: /Show comments/ }));
      await screen.findByText("First comment");

      const composer = screen.getByRole("textbox", { name: "Add a comment" });
      await user.type(composer, "  Second comment  ");
      await user.click(screen.getByRole("button", { name: "Comment" }));

      expect(await screen.findByText("Second comment")).toBeInTheDocument();
      expect(props.onAddComment).toHaveBeenCalledWith("Second comment");
      expect(composer).toHaveValue("");
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
    });

    it("edits a comment", async () => {
      const user = userEvent.setup();
      const edited = makeComment({ text: "Edited comment", isEdited: true });
      const onUpdateComment = jest.fn().mockResolvedValue(edited);
      const loadComments = jest
        .fn()
        .mockResolvedValueOnce([makeComment()])
        .mockResolvedValueOnce([edited]);
      renderSidebar({ loadComments, onUpdateComment });

      await user.click(screen.getByRole("button", { name: /Show comments/ }));
      await user.click(await screen.findByRole("button", { name: "Edit" }));

      const editor = screen.getByRole("textbox", { name: "Edit comment" });
      expect(editor).toHaveValue("First comment");
      await user.clear(editor);
      await user.type(editor, "Edited comment");
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(onUpdateComment).toHaveBeenCalledWith("answer-1", "Edited comment");
      expect(await screen.findByText("Edited comment")).toBeInTheDocument();
      expect(screen.getByText("2 days ago (edited)")).toBeInTheDocument();
      expect(screen.queryByRole("textbox", { name: "Edit comment" })).not.toBeInTheDocument();
    });

    it("cancels an edit without saving", async () => {
      const user = userEvent.setup();
      const onUpdateComment = jest.fn();
      renderSidebar({
        loadComments: jest.fn().mockResolvedValue([makeComment()]),
        onUpdateComment,
      });

      await user.click(screen.getByRole("button", { name: /Show comments/ }));
      await user.click(await screen.findByRole("button", { name: "Edit" }));
      await user.type(screen.getByRole("textbox", { name: "Edit comment" }), " more");
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(onUpdateComment).not.toHaveBeenCalled();
      expect(screen.getByText("First comment")).toBeInTheDocument();
    });

    it("restores the comment and shows an error when an edit fails", async () => {
      jest.spyOn(console, "error").mockImplementation(() => undefined);
      const user = userEvent.setup();
      renderSidebar({
        loadComments: jest.fn().mockResolvedValue([makeComment()]),
        onUpdateComment: jest.fn().mockRejectedValue(new Error("forbidden")),
      });

      await user.click(screen.getByRole("button", { name: /Show comments/ }));
      await user.click(await screen.findByRole("button", { name: "Edit" }));
      const editor = screen.getByRole("textbox", { name: "Edit comment" });
      await user.clear(editor);
      await user.type(editor, "Nope");
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Unable to update comment. Try again."
      );
    });

    it("deletes a comment", async () => {
      const user = userEvent.setup();
      const onDeleteComment = jest.fn().mockResolvedValue(undefined);
      const loadComments = jest
        .fn()
        .mockResolvedValueOnce([makeComment()])
        .mockResolvedValueOnce([]);
      renderSidebar({ loadComments, onDeleteComment });

      await user.click(screen.getByRole("button", { name: /Show comments/ }));
      await user.click(await screen.findByRole("button", { name: "Delete" }));

      expect(onDeleteComment).toHaveBeenCalledWith("answer-1");
      await waitFor(() => {
        expect(screen.queryByText("First comment")).not.toBeInTheDocument();
      });
      expect(await screen.findByText("No comments yet.")).toBeInTheDocument();
    });

    it("puts the comment back and shows an error when a delete fails", async () => {
      jest.spyOn(console, "error").mockImplementation(() => undefined);
      const user = userEvent.setup();
      renderSidebar({
        loadComments: jest.fn().mockResolvedValue([makeComment()]),
        onDeleteComment: jest.fn().mockRejectedValue(new Error("forbidden")),
      });

      await user.click(screen.getByRole("button", { name: /Show comments/ }));
      await user.click(await screen.findByRole("button", { name: "Delete" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Unable to delete comment. Try again."
      );
      expect(screen.getByText("First comment")).toBeInTheDocument();
    });

    it("shows Edit and Delete per comment permissions", async () => {
      const user = userEvent.setup();
      renderSidebar({
        loadComments: jest.fn().mockResolvedValue([
          makeComment({ id: "answer-1", text: "Mine", canEdit: true, canDelete: true }),
          makeComment({ id: "answer-2", text: "Moderated", canEdit: false, canDelete: true }),
          makeComment({ id: "feedback-1", text: "Theirs", canEdit: false, canDelete: false, isFeedback: true }),
        ]),
      });

      await user.click(screen.getByRole("button", { name: /Show comments/ }));
      const [mine, moderated, theirs] = await screen.findAllByRole("listitem");

      expect(within(mine).getByRole("button", { name: "Edit" })).toBeInTheDocument();
      expect(within(mine).getByRole("button", { name: "Delete" })).toBeInTheDocument();
      expect(within(moderated).queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
      expect(within(moderated).getByRole("button", { name: "Delete" })).toBeInTheDocument();
      expect(within(theirs).queryByRole("button")).not.toBeInTheDocument();
      expect(theirs).toHaveTextContent("(admin)");
    });
  });

  it("is labelled by the sidebar label and the question title", () => {
    renderSidebar();

    expect(
      screen.getByRole("group", {
        name: "Question guidance and comments What data will you collect",
      })
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderSidebar({ canCustomize: true, comments: [makeComment()] });

    expect(await axe(container)).toHaveNoViolations();
  });
});
