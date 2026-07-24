"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlanAuthoringDataSource } from "./dataSource";
import type { PlanQuestionMode, PlanQuestionSaveState } from "./model";

interface UsePlanQuestionControllerArgs {
  questionKeyValue: string;
  initialAnswer: unknown;
  dataSource: PlanAuthoringDataSource;
  canEdit: boolean;
  autosaveMs?: number;
}

interface UsePlanQuestionControllerResult {
  mode: PlanQuestionMode;
  saveState: PlanQuestionSaveState;
  draftAnswer: unknown;
  errorMessage: string | null;
  setMode: (mode: PlanQuestionMode) => void;
  setDraftAnswer: (answer: unknown) => void;
  saveNow: () => Promise<boolean>;
}

export function usePlanQuestionController({
  questionKeyValue,
  initialAnswer,
  dataSource,
  canEdit,
  autosaveMs = 1200,
}: UsePlanQuestionControllerArgs): UsePlanQuestionControllerResult {
  const [mode, setMode] = useState<PlanQuestionMode>(
    canEdit ? "editing" : "view"
  );
  const [saveState, setSaveState] = useState<PlanQuestionSaveState>("clean");
  const [draftAnswer, setDraftAnswerState] = useState<unknown>(initialAnswer);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const draftRef = useRef(draftAnswer);
  const generationRef = useRef(0);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    draftRef.current = draftAnswer;
  }, [draftAnswer]);

  useEffect(() => {
    setDraftAnswerState(initialAnswer);
    setSaveState("clean");
    setErrorMessage(null);
  }, [questionKeyValue, initialAnswer]);

  useEffect(() => {
    setMode(canEdit ? "editing" : "view");
  }, [canEdit, questionKeyValue]);

  const persist = useCallback(async () => {
    if (!canEdit) {
      return false;
    }

    if (inFlightRef.current) {
      queuedRef.current = true;
      return false;
    }

    inFlightRef.current = true;
    const generation = ++generationRef.current;
    setSaveState("saving");
    setErrorMessage(null);

    const result = await dataSource.saveAnswer(
      questionKeyValue,
      draftRef.current
    );

    inFlightRef.current = false;

    if (generation !== generationRef.current) {
      return false;
    }

    if (!result.success) {
      setSaveState("error");
      setErrorMessage(result.error ?? "Unable to save answer.");
      if (queuedRef.current) {
        queuedRef.current = false;
      }
      return false;
    }

    setSaveState("saved");

    if (queuedRef.current) {
      queuedRef.current = false;
      return persist();
    }

    return true;
  }, [canEdit, dataSource, questionKeyValue]);

  const setDraftAnswer = useCallback(
    (answer: unknown) => {
      if (!canEdit) {
        return;
      }

      draftRef.current = answer;
      setDraftAnswerState(answer);
      setSaveState("dirty");
      setErrorMessage(null);
      setMode("editing");

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
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

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    mode,
    saveState,
    draftAnswer,
    errorMessage,
    setMode,
    setDraftAnswer,
    saveNow,
  };
}
