import { isFilledAnswer } from "@/components/PlanAuthoring/answerUtils";
import type {
  PlanAuthoringDataSource,
  PlanAuthoringState,
} from "@/components/PlanAuthoring/dataSource";
import {
  computeProgress,
  questionKey,
  type PlanAuthoringModel,
} from "@/components/PlanAuthoring/model";
import { toStoredAnswerJson } from "@/components/PlanAuthoring/toPlanAuthoringModel";
import { findHiddenQuestionIds, type PreviewDisplayLogic } from "./displayLogic";

export interface LocalPreviewDataSource extends PlanAuthoringDataSource {
  setState(next: PlanAuthoringState): void;
  /** Keyed by the base questions' versionedQuestionId. */
  setDisplayLogic(logicByQuestionId: Map<number, PreviewDisplayLogic>): void;
  hasDisplayLogic(): boolean;
  isDisplayLogicApplied(): boolean;
  setDisplayLogicApplied(applied: boolean): void;
}

const COMMENTS_UNAVAILABLE = "Comments are not available in a preview.";

function withHiddenQuestions(
  model: PlanAuthoringModel,
  logicByQuestionId: Map<number, PreviewDisplayLogic> | null
): PlanAuthoringModel {
  let hidden = new Set<number>();
  if (logicByQuestionId) {
    const questions = model.sections.flatMap((section) => section.questions);
    const orderedIds: number[] = [];
    const answers = new Map<number, unknown>();
    for (const question of questions) {
      if (question.identity.kind !== "base") {
        continue;
      }
      orderedIds.push(question.identity.versionedQuestionId);
      if (question.hasAnswer) {
        answers.set(question.identity.versionedQuestionId, toStoredAnswerJson(question, question.answerJson));
      }
    }
    hidden = findHiddenQuestionIds(orderedIds, logicByQuestionId, answers);
  }
  const sections = model.sections.map((section) => ({
    ...section,
    questions: section.questions.map((question) => ({
      ...question,
      isHidden: question.identity.kind === "base" && hidden.has(question.identity.versionedQuestionId),
    })),
  }));
  return { ...model, sections, progress: computeProgress(sections) };
}

/** Answers are kept in memory and never sent to the API; comments and guidance selection do nothing. */
export function createLocalPreviewDataSource(
  initialState: PlanAuthoringState,
  onFirstSubscribe?: () => void
): LocalPreviewDataSource {
  let state = initialState;
  let subscribed = false;
  let logicByQuestionId = new Map<number, PreviewDisplayLogic>();
  let applied = false;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());

  const setState = (next: PlanAuthoringState) => {
    state =
      next.status === "ready"
        ? { status: "ready", model: withHiddenQuestions(next.model, applied ? logicByQuestionId : null) }
        : next;
    notify();
  };

  return {
    getState() {
      return state;
    },

    setState,

    setDisplayLogic(next) {
      logicByQuestionId = next;
      if (state.status === "ready") {
        setState(state);
      }
    },

    hasDisplayLogic() {
      return logicByQuestionId.size > 0;
    },

    isDisplayLogicApplied() {
      return applied;
    },

    setDisplayLogicApplied(next) {
      if (next === applied) {
        return;
      }
      applied = next;
      if (state.status === "ready") {
        setState(state);
      } else {
        notify();
      }
    },

    reload() {},

    async saveAnswer(questionKeyValue, answerJson) {
      if (state.status !== "ready") {
        return { kind: "failed", message: "Question not found." };
      }
      let found = false;
      const sections = state.model.sections.map((section) => ({
        ...section,
        questions: section.questions.map((question) => {
          if (questionKey(question.identity) !== questionKeyValue) {
            return question;
          }
          found = true;
          return {
            ...question,
            answerJson,
            hasAnswer: isFilledAnswer(answerJson),
            lastSavedAt: Date.now(),
          };
        }),
      }));
      if (!found) {
        return { kind: "failed", message: "Question not found." };
      }
      setState({ status: "ready", model: { ...state.model, sections } });
      return { kind: "saved" };
    },

    async addComment() {
      throw new Error(COMMENTS_UNAVAILABLE);
    },

    async updateComment() {
      throw new Error(COMMENTS_UNAVAILABLE);
    },

    async deleteComment() {
      throw new Error(COMMENTS_UNAVAILABLE);
    },

    async searchGuidanceOrgs() {
      return [];
    },

    async setSelectedGuidanceOrgs() {
      return [];
    },

    subscribe(listener) {
      listeners.add(listener);
      if (!subscribed) {
        subscribed = true;
        onFirstSubscribe?.();
      }
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
