import { act, renderHook, waitFor } from "@testing-library/react";
import {
  DRAFT_SEND_DELAY_MS,
  EDITOR_REPLY_TIMEOUT_MS,
  questionPreviewChannelName,
  useQuestionPreviewDraft,
  useQuestionPreviewDraftSync,
  withPreviewDraft,
  type QuestionPreviewDraft,
  type QuestionPreviewMessage,
} from "../questionPreviewDraft";

const draft = (questionText: string): QuestionPreviewDraft => ({
  sectionId: 2,
  questionText,
  requirementText: null,
  guidanceText: null,
  sampleText: null,
  useSampleTextAsDefault: false,
  required: false,
  json: '{"type":"text"}',
});

type Message = QuestionPreviewMessage<QuestionPreviewDraft>;

/** Stands in for the other tab on the same channel. */
function openTab(previewId: string) {
  const channel = new BroadcastChannel(questionPreviewChannelName(previewId));
  const messages: Message[] = [];
  channel.onmessage = (event: MessageEvent<Message>) => messages.push(event.data);
  return {
    messages,
    post: (message: Message) => channel.postMessage(message),
    close: () => channel.close(),
  };
}

const wait = (ms: number) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));

const tabs: ReturnType<typeof openTab>[] = [];
afterEach(() => {
  tabs.splice(0).forEach((tab) => tab.close());
});

function renderEditor(initialText = "First") {
  const hook = renderHook(({ text }) => useQuestionPreviewDraftSync(() => draft(text)), {
    initialProps: { text: initialText },
  });
  const previewId = hook.result.current.previewId!;
  const tab = openTab(previewId);
  tabs.push(tab);
  return { ...hook, previewId, tab };
}

describe("withPreviewDraft", () => {
  it("adds the preview id to the link", () => {
    expect(withPreviewDraft("/template/7/preview/q/22", "abc")).toBe("/template/7/preview/q/22?draft=abc");
    expect(withPreviewDraft("/template/7/preview/q/new?section_id=3", "abc")).toBe(
      "/template/7/preview/q/new?section_id=3&draft=abc"
    );
  });
});

describe("useQuestionPreviewDraftSync", () => {
  it("gives each editor its own preview id", () => {
    const first = renderHook(() => useQuestionPreviewDraftSync(() => draft("First")));
    const second = renderHook(() => useQuestionPreviewDraftSync(() => draft("First")));

    expect(first.result.current.previewId).toBeTruthy();
    expect(first.result.current.previewId).not.toBe(second.result.current.previewId);
  });

  it("sends nothing until a preview asks for the draft", async () => {
    const { rerender, tab } = renderEditor();

    rerender({ text: "Second" });
    await wait(DRAFT_SEND_DELAY_MS + 100);

    expect(tab.messages).toEqual([]);
  });

  it("answers the preview with the draft, then sends each change once", async () => {
    const { rerender, tab } = renderEditor();

    tab.post({ type: "request" });
    await waitFor(() => expect(tab.messages).toEqual([{ type: "draft", draft: draft("First") }]));

    rerender({ text: "Second" });
    await waitFor(() => expect(tab.messages).toHaveLength(2));
    expect(tab.messages[1]).toEqual({ type: "draft", draft: draft("Second") });

    rerender({ text: "Second" });
    await wait(DRAFT_SEND_DELAY_MS + 100);
    expect(tab.messages).toHaveLength(2);
  });

  it("tells the preview when the editor closes", async () => {
    const { unmount, tab } = renderEditor();

    unmount();

    await waitFor(() => expect(tab.messages).toEqual([{ type: "closed" }]));
  });
});

describe("useQuestionPreviewDraft", () => {
  function renderPreview(previewId: string | null) {
    const tab = previewId ? openTab(previewId) : null;
    if (tab) tabs.push(tab);
    return { ...renderHook(() => useQuestionPreviewDraft(previewId)), tab };
  }

  it("doesn't wait for an editor without a preview id", () => {
    const { result } = renderPreview(null);

    expect(result.current).toEqual({ draft: null, isWaiting: false });
  });

  it("asks the editor for its draft and follows its changes", async () => {
    const { result, tab } = renderPreview("abc");
    expect(result.current.isWaiting).toBe(true);
    await waitFor(() => expect(tab!.messages).toEqual([{ type: "request" }]));

    tab!.post({ type: "draft", draft: draft("First") });
    await waitFor(() => expect(result.current).toEqual({ draft: draft("First"), isWaiting: false }));

    tab!.post({ type: "draft", draft: draft("Second") });
    await waitFor(() => expect(result.current.draft?.questionText).toBe("Second"));

    tab!.post({ type: "closed" });
    await waitFor(() => expect(result.current).toEqual({ draft: null, isWaiting: false }));
  });

  it("stops waiting when no editor answers", async () => {
    const { result } = renderPreview("abc");

    await waitFor(() => expect(result.current).toEqual({ draft: null, isWaiting: false }), {
      timeout: EDITOR_REPLY_TIMEOUT_MS + 500,
    });
  });
});

describe("editor and preview together", () => {
  it("shows the editor's unsaved changes in the preview as they're made", async () => {
    const editor = renderHook(({ text }) => useQuestionPreviewDraftSync(() => draft(text)), {
      initialProps: { text: "First" },
    });
    const preview = renderHook(() => useQuestionPreviewDraft(editor.result.current.previewId));

    await waitFor(() => expect(preview.result.current.draft?.questionText).toBe("First"));

    editor.rerender({ text: "Second" });
    await waitFor(() => expect(preview.result.current.draft?.questionText).toBe("Second"));

    editor.unmount();
    await waitFor(() => expect(preview.result.current.draft).toBeNull());
  });
});
