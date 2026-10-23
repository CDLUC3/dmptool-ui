"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** The question editor's unsaved state, sent to the preview tab over a BroadcastChannel. */
export interface QuestionPreviewDraft {
  sectionId: number;
  questionText: string | null;
  requirementText: string | null;
  guidanceText: string | null;
  sampleText: string | null;
  useSampleTextAsDefault: boolean;
  required: boolean;
  json: string | null;
}

export type QuestionPreviewMessage<T> =
  | { type: "request" }
  | { type: "draft"; draft: T }
  | { type: "closed" };

export const NEW_QUESTION_ID = "new";
export const PREVIEW_DRAFT_PARAM = "draft";
export const DRAFT_SEND_DELAY_MS = 300;
/** How long the preview waits for the editor to answer before showing the saved question. */
export const EDITOR_REPLY_TIMEOUT_MS = 500;

export function questionPreviewChannelName(previewId: string): string {
  return `question-preview:${previewId}`;
}

export function withPreviewDraft(href: string, previewId: string): string {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${PREVIEW_DRAFT_PARAM}=${encodeURIComponent(previewId)}`;
}

function createPreviewId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function openChannel(previewId: string): BroadcastChannel | null {
  return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(questionPreviewChannelName(previewId));
}

export interface QuestionPreviewDraftSync {
  /** Null until the editor has mounted in the browser. */
  previewId: string | null;
}

/**
 * For the question editor. Once a preview tab asks for the draft, `buildDraft` runs
 * shortly after each change and the result is sent to it. The preview is told when
 * the editor unmounts or the page is closed.
 */
export function useQuestionPreviewDraftSync<T extends object>(
  buildDraft: () => T | null
): QuestionPreviewDraftSync {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const buildDraftRef = useRef(buildDraft);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const sentRef = useRef<string | null>(null);

  useEffect(() => {
    buildDraftRef.current = buildDraft;
  });

  useEffect(() => {
    setPreviewId(createPreviewId());
  }, []);

  const send = useCallback((force: boolean) => {
    const channel = channelRef.current;
    const draft = buildDraftRef.current();
    if (!channel || !draft) {
      return;
    }
    const serialized = JSON.stringify(draft);
    if (!force && serialized === sentRef.current) {
      return;
    }
    sentRef.current = serialized;
    channel.postMessage({ type: "draft", draft } satisfies QuestionPreviewMessage<T>);
  }, []);

  useEffect(() => {
    if (!previewId) {
      return;
    }
    const channel = openChannel(previewId);
    if (!channel) {
      return;
    }
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent<QuestionPreviewMessage<T>>) => {
      if (event.data?.type === "request") {
        setIsPreviewing(true);
        send(true);
      }
    };
    const announceClosed = () => channel.postMessage({ type: "closed" } satisfies QuestionPreviewMessage<T>);
    window.addEventListener("pagehide", announceClosed);
    return () => {
      window.removeEventListener("pagehide", announceClosed);
      announceClosed();
      channel.close();
      channelRef.current = null;
      sentRef.current = null;
    };
  }, [previewId, send]);

  useEffect(() => {
    if (!isPreviewing) {
      return;
    }
    const timeout = window.setTimeout(() => send(false), DRAFT_SEND_DELAY_MS);
    return () => window.clearTimeout(timeout);
  });

  return { previewId };
}

interface QuestionPreviewDraftState<T> {
  draft: T | null;
  /** True until the editor answers, or EDITOR_REPLY_TIMEOUT_MS passes without an answer. */
  isWaiting: boolean;
}

/** For the preview tab: the editor's latest draft, or null when no editor is open. */
export function useQuestionPreviewDraft<T extends object = QuestionPreviewDraft>(
  previewId: string | null
): QuestionPreviewDraftState<T> {
  const [state, setState] = useState<QuestionPreviewDraftState<T> & { previewId: string | null }>({
    previewId: null,
    draft: null,
    isWaiting: false,
  });

  useEffect(() => {
    if (!previewId) {
      return;
    }
    const channel = openChannel(previewId);
    const settle = (draft: T | null) => setState({ previewId, draft, isWaiting: false });
    if (!channel) {
      const timeout = window.setTimeout(() => settle(null), 0);
      return () => window.clearTimeout(timeout);
    }
    channel.onmessage = (event: MessageEvent<QuestionPreviewMessage<T>>) => {
      if (event.data?.type === "draft") {
        settle(event.data.draft);
      } else if (event.data?.type === "closed") {
        settle(null);
      }
    };
    channel.postMessage({ type: "request" } satisfies QuestionPreviewMessage<T>);
    const timeout = window.setTimeout(
      () => setState((current) => (current.previewId === previewId ? current : { previewId, draft: null, isWaiting: false })),
      EDITOR_REPLY_TIMEOUT_MS
    );
    return () => {
      window.clearTimeout(timeout);
      channel.close();
    };
  }, [previewId]);

  if (!previewId) {
    return { draft: null, isWaiting: false };
  }
  return state.previewId === previewId ? { draft: state.draft, isWaiting: state.isWaiting } : { draft: null, isWaiting: true };
}
