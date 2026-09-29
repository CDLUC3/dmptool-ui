import { act, renderHook } from "@testing-library/react";
import type { SaveAnswerResult } from "../dataSource";
import { createMockDataSource, makeModel, makeQuestion, makeSection } from "../mocks";
import { spyOnDataSource } from "../mocks/spyOnDataSource";
import { usePlanQuestionController } from "../usePlanQuestionController";

const KEY = "base-question-101";
const AUTOSAVE_MS = 1200;

function createDataSource() {
  const model = makeModel({ sections: [makeSection({ questions: [makeQuestion()] })] });
  return spyOnDataSource(createMockDataSource({ model }));
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}

type HookProps = Parameters<typeof usePlanQuestionController>[0];

function renderController(overrides: Partial<HookProps> = {}) {
  const dataSource = overrides.dataSource ?? createDataSource();
  const initialProps: HookProps = {
    questionKeyValue: KEY,
    initialAnswer: { type: "text", answer: "server" },
    dataSource,
    canEdit: true,
    ...overrides,
  };
  const hook = renderHook((props: HookProps) => usePlanQuestionController(props), {
    initialProps,
  });
  return { ...hook, dataSource, initialProps };
}

describe("usePlanQuestionController", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("autosave", () => {
    it("saves once after the debounce and not before", async () => {
      const { result, dataSource } = renderController();

      act(() => {
        result.current.setDraftAnswer({ type: "text", answer: "a" });
      });
      act(() => {
        result.current.setDraftAnswer({ type: "text", answer: "ab" });
      });
      expect(result.current.saveState).toEqual({ status: "dirty" });

      act(() => {
        jest.advanceTimersByTime(AUTOSAVE_MS - 1);
      });
      expect(dataSource.saveAnswer).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      await flushPromises();

      expect(dataSource.saveAnswer).toHaveBeenCalledTimes(1);
      expect(dataSource.saveAnswer).toHaveBeenCalledWith(KEY, {
        type: "text",
        answer: "ab",
      });
      expect(result.current.saveState).toEqual({ status: "saved" });
    });

    it("saveNow cancels the pending timer and saves immediately", async () => {
      const { result, dataSource } = renderController();

      act(() => {
        result.current.setDraftAnswer({ type: "text", answer: "now" });
      });

      let saved: boolean | undefined;
      await act(async () => {
        saved = await result.current.saveNow();
      });

      expect(saved).toBe(true);
      expect(dataSource.saveAnswer).toHaveBeenCalledTimes(1);
      expect(dataSource.saveAnswer).toHaveBeenCalledWith(KEY, {
        type: "text",
        answer: "now",
      });

      act(() => {
        jest.advanceTimersByTime(AUTOSAVE_MS * 3);
      });
      await flushPromises();
      expect(dataSource.saveAnswer).toHaveBeenCalledTimes(1);
    });

    it("queues a save requested while one is in flight and runs it afterwards", async () => {
      const dataSource = createDataSource();
      const first = deferred<SaveAnswerResult>();
      dataSource.saveAnswer
        .mockReturnValueOnce(first.promise)
        .mockResolvedValueOnce({ kind: "saved" });
      const { result } = renderController({ dataSource });

      act(() => {
        result.current.setDraftAnswer({ type: "text", answer: "one" });
      });
      act(() => {
        void result.current.saveNow();
      });
      expect(result.current.saveState).toEqual({ status: "saving" });

      act(() => {
        result.current.setDraftAnswer({ type: "text", answer: "two" });
      });
      let queuedResult: boolean | undefined;
      await act(async () => {
        queuedResult = await result.current.saveNow();
      });
      expect(queuedResult).toBe(false);
      expect(dataSource.saveAnswer).toHaveBeenCalledTimes(1);

      await act(async () => {
        first.resolve({ kind: "saved" });
        await first.promise;
      });
      await flushPromises();

      expect(dataSource.saveAnswer).toHaveBeenCalledTimes(2);
      expect(dataSource.saveAnswer).toHaveBeenNthCalledWith(1, KEY, {
        type: "text",
        answer: "one",
      });
      expect(dataSource.saveAnswer).toHaveBeenNthCalledWith(2, KEY, {
        type: "text",
        answer: "two",
      });
      expect(result.current.saveState).toEqual({ status: "saved" });
    });
  });

  describe("save results", () => {
    it("reports failed when saveAnswer throws, and the next save still runs", async () => {
      jest.spyOn(console, "error").mockImplementation(() => undefined);
      const dataSource = createDataSource();
      dataSource.saveAnswer
        .mockRejectedValueOnce(new Error("network down"))
        .mockResolvedValueOnce({ kind: "saved" });
      const { result } = renderController({ dataSource });

      act(() => {
        result.current.setDraftAnswer({ type: "text", answer: "x" });
      });
      await act(async () => {
        await result.current.saveNow();
      });
      expect(result.current.saveState).toEqual({
        status: "failed",
        message: undefined,
      });

      await act(async () => {
        await result.current.saveNow();
      });
      expect(dataSource.saveAnswer).toHaveBeenCalledTimes(2);
      expect(result.current.saveState).toEqual({ status: "saved" });
    });

    it("carries the messages of an invalid result", async () => {
      const dataSource = createDataSource();
      dataSource.saveAnswer.mockResolvedValue({
        kind: "invalid",
        messages: ["The answer is not in the proper format.", "Too long."],
      });
      const { result } = renderController({ dataSource });

      act(() => {
        result.current.setDraftAnswer({ type: "text", answer: "x" });
      });
      let saved: boolean | undefined;
      await act(async () => {
        saved = await result.current.saveNow();
      });

      expect(saved).toBe(false);
      expect(result.current.saveState).toEqual({
        status: "invalid",
        messages: ["The answer is not in the proper format.", "Too long."],
      });
    });

    it("carries the message of a failed result", async () => {
      const dataSource = createDataSource();
      dataSource.saveAnswer.mockResolvedValue({
        kind: "failed",
        message: "Forbidden",
      });
      const { result } = renderController({ dataSource });

      act(() => {
        result.current.setDraftAnswer({ type: "text", answer: "x" });
      });
      await act(async () => {
        await result.current.saveNow();
      });

      expect(result.current.saveState).toEqual({
        status: "failed",
        message: "Forbidden",
      });
    });
  });

  describe("draft and initialAnswer", () => {
    it("adopts a new initialAnswer while clean", () => {
      const { result, rerender, initialProps } = renderController();

      rerender({
        ...initialProps,
        initialAnswer: { type: "text", answer: "reloaded" },
      });

      expect(result.current.draftAnswer).toEqual({
        type: "text",
        answer: "reloaded",
      });
    });

    it("keeps local edits when a new initialAnswer arrives while dirty", () => {
      const { result, rerender, initialProps } = renderController();

      act(() => {
        result.current.setDraftAnswer({ type: "text", answer: "typing" });
      });
      rerender({
        ...initialProps,
        initialAnswer: { type: "text", answer: "reloaded" },
      });

      expect(result.current.draftAnswer).toEqual({
        type: "text",
        answer: "typing",
      });
      expect(result.current.saveState).toEqual({ status: "dirty" });
    });

    it("keeps the draft when the saved answer is fed back in after a save", async () => {
      const { result, rerender, initialProps } = renderController();

      act(() => {
        result.current.setDraftAnswer({ type: "text", answer: "typed " });
      });
      await act(async () => {
        await result.current.saveNow();
      });
      expect(result.current.saveState).toEqual({ status: "saved" });

      rerender({
        ...initialProps,
        initialAnswer: {
          meta: { schemaVersion: "1.0" },
          type: "text",
          answer: "typed",
        },
      });

      expect(result.current.draftAnswer).toEqual({
        type: "text",
        answer: "typed ",
      });
      expect(result.current.saveState).toEqual({ status: "saved" });
    });

    it("resets the draft and status when the question key changes", () => {
      const { result, rerender, initialProps } = renderController();

      act(() => {
        result.current.setDraftAnswer({ type: "text", answer: "typing" });
      });
      rerender({
        ...initialProps,
        questionKeyValue: "base-question-202",
        initialAnswer: { type: "text", answer: "other question" },
      });

      expect(result.current.draftAnswer).toEqual({
        type: "text",
        answer: "other question",
      });
      expect(result.current.saveState).toEqual({ status: "clean" });
    });
  });

  it("flushes a pending autosave on unmount", () => {
    const { result, unmount, dataSource } = renderController();

    act(() => {
      result.current.setDraftAnswer({ type: "text", answer: "unsaved" });
    });
    unmount();

    expect(dataSource.saveAnswer).toHaveBeenCalledTimes(1);
    expect(dataSource.saveAnswer).toHaveBeenCalledWith(KEY, {
      type: "text",
      answer: "unsaved",
    });
  });

  it("does not save on unmount when nothing is pending", () => {
    const { unmount, dataSource } = renderController();

    unmount();

    expect(dataSource.saveAnswer).not.toHaveBeenCalled();
  });

  describe("unsaved changes registry", () => {
    it("registers while dirty or saving and unregisters once saved", async () => {
      const dataSource = createDataSource();
      const pending = deferred<SaveAnswerResult>();
      dataSource.saveAnswer.mockReturnValueOnce(pending.promise);
      const unregister = jest.fn();
      const registerUnsavedChange = jest.fn(() => unregister);
      const { result } = renderController({ dataSource, registerUnsavedChange });

      expect(registerUnsavedChange).not.toHaveBeenCalled();

      act(() => {
        result.current.setDraftAnswer({ type: "text", answer: "x" });
      });
      expect(registerUnsavedChange).toHaveBeenCalledTimes(1);
      expect(registerUnsavedChange).toHaveBeenCalledWith(KEY);

      act(() => {
        void result.current.saveNow();
      });
      expect(result.current.saveState).toEqual({ status: "saving" });
      expect(unregister).not.toHaveBeenCalled();

      await act(async () => {
        pending.resolve({ kind: "saved" });
        await pending.promise;
      });

      expect(result.current.saveState).toEqual({ status: "saved" });
      expect(unregister).toHaveBeenCalledTimes(1);
      expect(registerUnsavedChange).toHaveBeenCalledTimes(1);
    });

    it.each<[string, SaveAnswerResult]>([
      ["invalid", { kind: "invalid", messages: ["Bad"] }],
      ["failed", { kind: "failed", message: "Nope" }],
    ])("stays registered while %s", async (_status, saveResult) => {
      const dataSource = createDataSource();
      dataSource.saveAnswer.mockResolvedValue(saveResult);
      const unregister = jest.fn();
      const registerUnsavedChange = jest.fn(() => unregister);
      const { result, unmount } = renderController({
        dataSource,
        registerUnsavedChange,
      });

      act(() => {
        result.current.setDraftAnswer({ type: "text", answer: "x" });
      });
      await act(async () => {
        await result.current.saveNow();
      });

      expect(result.current.saveState.status).toBe(_status);
      expect(registerUnsavedChange).toHaveBeenCalledTimes(1);
      expect(unregister).not.toHaveBeenCalled();

      unmount();
      expect(unregister).toHaveBeenCalledTimes(1);
    });
  });

  describe("when canEdit is false", () => {
    it("ignores edits and never saves", async () => {
      const registerUnsavedChange = jest.fn(() => jest.fn());
      const { result, unmount, dataSource } = renderController({
        canEdit: false,
        registerUnsavedChange,
      });

      act(() => {
        result.current.setDraftAnswer({ type: "text", answer: "nope" });
      });
      expect(result.current.draftAnswer).toEqual({
        type: "text",
        answer: "server",
      });
      expect(result.current.saveState).toEqual({ status: "clean" });

      let saved: boolean | undefined;
      await act(async () => {
        saved = await result.current.saveNow();
      });
      act(() => {
        jest.advanceTimersByTime(AUTOSAVE_MS * 3);
      });
      unmount();

      expect(saved).toBe(false);
      expect(dataSource.saveAnswer).not.toHaveBeenCalled();
      expect(registerUnsavedChange).not.toHaveBeenCalled();
    });
  });
});
