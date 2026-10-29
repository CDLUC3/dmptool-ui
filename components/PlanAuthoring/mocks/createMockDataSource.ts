import { isFilledAnswer } from "../answerUtils";
import type { PlanAuthoringDataSource, PlanAuthoringState } from "../dataSource";
import {
  computeProgress,
  questionKey,
  type PlanAuthoringModel,
  type PlanComment,
  type PlanQuestionDefinition,
} from "../model";
import { makeComment, makeModel } from "./builders";

export interface MockDataSourceOptions {
  model?: PlanAuthoringModel;
  initialState?: PlanAuthoringState;
}

export interface MockPlanAuthoringDataSource extends PlanAuthoringDataSource {
  /** Replaces the state and notifies subscribers, like a finished load would. */
  setState(state: PlanAuthoringState): void;
}

/**
 * An in-memory PlanAuthoringDataSource over a hand-built model, for component
 * specs that test UI behaviour rather than the GraphQL mapping.
 */
export function createMockDataSource(
  options: MockDataSourceOptions = {}
): MockPlanAuthoringDataSource {
  const initialModel = options.model ?? makeModel();
  let nextCommentId = 0;
  const listeners = new Set<() => void>();

  let state: PlanAuthoringState =
    options.initialState ?? { status: "ready", model: initialModel };

  const setState = (next: PlanAuthoringState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };

  const currentModel = () => (state.status === "ready" ? state.model : undefined);

  const findQuestion = (key: string) =>
    currentModel()
      ?.sections.flatMap((section) => section.questions)
      .find((question) => questionKey(question.identity) === key);

  const requireQuestion = (key: string) => {
    const question = findQuestion(key);
    if (!question) {
      throw new Error("Question not found.");
    }
    return question;
  };

  const updateModel = (update: (model: PlanAuthoringModel) => PlanAuthoringModel) => {
    const model = currentModel();
    if (model) {
      setState({ status: "ready", model: update(model) });
    }
  };

  const updateQuestion = (
    key: string,
    update: (question: PlanQuestionDefinition) => PlanQuestionDefinition
  ) => {
    updateModel((model) => {
      const sections = model.sections.map((section) => ({
        ...section,
        questions: section.questions.map((question) =>
          questionKey(question.identity) === key ? update(question) : question
        ),
      }));
      return { ...model, sections, progress: computeProgress(sections) };
    });
  };

  return {
    getState() {
      return state;
    },

    setState,

    reload() {
      setState({ status: "loading" });
      void Promise.resolve().then(() =>
        setState({ status: "ready", model: initialModel })
      );
    },

    async saveAnswer(key, answerJson) {
      if (!findQuestion(key)) {
        return { kind: "failed", message: "Question not found." };
      }
      updateQuestion(key, (question) => ({
        ...question,
        answerJson,
        hasAnswer: isFilledAnswer(answerJson),
        lastSavedAt: Date.now(),
      }));
      return { kind: "saved" };
    },

    async addComment(key, text) {
      requireQuestion(key);
      nextCommentId += 1;
      const comment = makeComment({
        id: `answer-mock-${nextCommentId}`,
        createdLabel: "Just now",
        text,
        isFeedback: false,
      });
      updateQuestion(key, (question) => ({
        ...question,
        comments: [...question.comments, comment],
      }));
      return comment;
    },

    async updateComment(key, commentId, text) {
      const existing = requireQuestion(key).comments.find(
        (comment) => comment.id === commentId
      );
      if (!existing) {
        throw new Error("Comment not found.");
      }
      const updated: PlanComment = { ...existing, text, isEdited: true };
      updateQuestion(key, (question) => ({
        ...question,
        comments: question.comments.map((comment) =>
          comment.id === commentId ? updated : comment
        ),
      }));
      return updated;
    },

    async deleteComment(key, commentId) {
      requireQuestion(key);
      updateQuestion(key, (question) => ({
        ...question,
        comments: question.comments.filter((comment) => comment.id !== commentId),
      }));
    },

    async searchGuidanceOrgs(term) {
      const orgs = currentModel()?.availableGuidanceOrgs ?? [];
      const normalized = term.trim().toLowerCase();
      if (!normalized) {
        return orgs;
      }
      return orgs.filter(
        (org) =>
          org.label.toLowerCase().includes(normalized) ||
          org.shortName.toLowerCase().includes(normalized)
      );
    },

    async setSelectedGuidanceOrgs(orgIds) {
      const availableIds = new Set(
        (currentModel()?.availableGuidanceOrgs ?? []).map((org) => org.id)
      );
      const selected = [...new Set(orgIds)].filter((id) => availableIds.has(id));
      updateModel((model) => ({ ...model, selectedGuidanceOrgIds: selected }));
      return selected;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
