"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlanAuthoringDataSource, SaveAnswerResult } from "./dataSource";
import type { PlanQuestionSaveState } from "./model";
import type { RegisterUnsavedChange } from "./useUnsavedChangesRegistry";

interface UsePlanQuestionControllerArgs {
  questionKeyValue: string;
  initialAnswer: unknown;
  dataSource: PlanAuthoringDataSource;
  canEdit: boolean;
  registerUnsavedChange?: RegisterUnsavedChange;
  autosaveMs?: number;
}

interface UsePlanQuestionControllerResult {
  saveState: PlanQuestionSaveState;
  draftAnswer: unknown;
  setDraftAnswer: (answer: unknown) => void;
  saveNow: () => Promise<boolean>;
}

export function usePlanQuestionController({
  questionKeyValue,
  initialAnswer,
  dataSource,
  canEdit,
  registerUnsavedChange,
  autosaveMs = 1200,
}: UsePlanQuestionControllerArgs): UsePlanQuestionControllerResult {
  const [saveState, setSaveState] = useState<PlanQuestionSaveState>({
    status: "clean",
  });
  const [draftAnswer, setDraftAnswerState] = useState<unknown>(initialAnswer);

  const draftRef = useRef(draftAnswer);
  const initialAnswerRef = useRef(initialAnswer);
  const saveStatusRef = useRef<PlanQuestionSaveState["status"]>("clean");
  const generationRef = useRef(0);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistRef = useRef<() => Promise<boolean>>(async () => false);

  useEffect(() => {
    draftRef.current = draftAnswer;
  }, [draftAnswer]);

  useEffect(() => {
    saveStatusRef.current = saveState.status;
  }, [saveState.status]);

  useEffect(() => {
    initialAnswerRef.current = initialAnswer;
    // A successful save feeds the saved answer back in as initialAnswer, so
    // only adopt it when there are no local edits it would overwrite.
    if (saveStatusRef.current === "clean") {
      draftRef.current = initialAnswer;
      setDraftAnswerState(initialAnswer);
    }
  }, [initialAnswer]);

  useEffect(() => {
    draftRef.current = initialAnswerRef.current;
    setDraftAnswerState(initialAnswerRef.current);
    setSaveState({ status: "clean" });
  }, [questionKeyValue]);

  const persist = useCallback(async (): Promise<boolean> => {
    if (!canEdit) {
      return false;
    }

    if (inFlightRef.current) {
      queuedRef.current = true;
      return false;
    }

    inFlightRef.current = true;
    const generation = ++generationRef.current;
    setSaveState({ status: "saving" });

    let result: SaveAnswerResult;
    try {
      result = await dataSource.saveAnswer(questionKeyValue, draftRef.current);
    } catch (error) {
      console.error("Failed to save plan answer", error);
      result = { kind: "failed" };
    } finally {
      inFlightRef.current = false;
    }

    if (generation !== generationRef.current) {
      return false;
    }

    if (result.kind === "saved") {
      setSaveState({ status: "saved" });
      if (queuedRef.current) {
        queuedRef.current = false;
        return persist();
      }
      return true;
    }

    queuedRef.current = false;
    switch (result.kind) {
      case "invalid":
        setSaveState({ status: "invalid", messages: result.messages });
        break;
      case "failed":
        setSaveState({ status: "failed", message: result.message });
        break;
    }
    return false;
  }, [canEdit, dataSource, questionKeyValue]);

  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);

  const setDraftAnswer = useCallback(
    (answer: unknown) => {
      if (!canEdit) {
        return;
      }

      draftRef.current = answer;
      setDraftAnswerState(answer);
      setSaveState({ status: "dirty" });

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void persist();
      }, autosaveMs);
    },
    [autosaveMs, canEdit, persist]
  );

  const saveNow = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    return persist();
  }, [persist]);

  const hasUnsavedChanges =
    saveState.status !== "clean" && saveState.status !== "saved";

  useEffect(() => {
    if (!hasUnsavedChanges || !registerUnsavedChange) {
      return;
    }
    return registerUnsavedChange(questionKeyValue);
  }, [hasUnsavedChanges, questionKeyValue, registerUnsavedChange]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        void persistRef.current();
      }
    };
  }, []);

  return {
    saveState,
    draftAnswer,
    setDraftAnswer,
    saveNow,
  };
}
