import type {
  PlanAuthoringDataSource,
  PlanAuthoringState,
  SaveAnswerResult,
} from "../dataSource";
import {
  computeProgress,
  questionKey,
  type PlanAuthoringModel,
  type PlanComment,
  type PlanQuestionDefinition,
} from "../model";
import { makeModel } from "./builders";
import {
  MOCK_COMMENTS_ERROR,
  MOCK_GUIDANCE_ERROR,
  MOCK_SAVE_ERROR,
} from "./fakePlanAuthoringClient";

export interface MockDataSourceOptions {
  model?: PlanAuthoringModel;
  initialState?: PlanAuthoringState;
  delayMs?: number;
  failSaveOnce?: boolean;
  /** Returned by every save that doesn't fail; a "saved" result still updates the model. */
  saveResult?: SaveAnswerResult;
  commentsFail?: boolean;
  guidanceFail?: boolean;
}

export interface MockPlanAuthoringDataSource extends PlanAuthoringDataSource {
  /** Replaces the state and notifies subscribers, like a finished load would. */
  setState(state: PlanAuthoringState): void;
}

function wait(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * An in-memory PlanAuthoringDataSource over a hand-built model, for component
 * specs that test UI behaviour rather than the GraphQL mapping.
 */
export function createMockDataSource(
  options: MockDataSourceOptions = {}
): MockPlanAuthoringDataSource {
  const delayMs = options.delayMs ?? 0;
  const initialModel = options.model ?? makeModel();
  let failSaveOnce = Boolean(options.failSaveOnce);
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

  const assertComments = () => {
    if (options.commentsFail) {
      throw new Error(MOCK_COMMENTS_ERROR);
    }
  };

  const assertGuidance = () => {
    if (options.guidanceFail) {
      throw new Error(MOCK_GUIDANCE_ERROR);
    }
  };

  return {
    getState() {
      return state;
    },

    setState,

    reload() {
      setState({ status: "loading" });
      void wait(delayMs).then(() =>
        setState({ status: "ready", model: initialModel })
      );
    },

    async saveAnswer(key, answerJson) {
      await wait(delayMs);
      if (failSaveOnce) {
        failSaveOnce = false;
        return { kind: "failed", message: MOCK_SAVE_ERROR };
      }
      if (options.saveResult && options.saveResult.kind !== "saved") {
        return options.saveResult;
      }
      if (!findQuestion(key)) {
        return { kind: "failed", message: "Question not found." };
      }
      updateQuestion(key, (question) => ({
        ...question,
        answerJson,
        hasAnswer: answerJson != null && answerJson !== "",
        lastSavedAt: String(Date.now()),
      }));
      return { kind: "saved" };
    },

    async loadGuidance(key) {
      await wait(delayMs);
      assertGuidance();
      return findQuestion(key)?.guidanceSources ?? [];
    },

    async loadComments(key) {
      await wait(delayMs);
      assertComments();
      return findQuestion(key)?.comments ?? [];
    },

    async addComment(key, text) {
      await wait(delayMs);
      assertComments();
      requireQuestion(key);
      const model = currentModel();
      nextCommentId += 1;
      const comment: PlanComment = {
        id: `answer-mock-${nextCommentId}`,
        authorId: model?.currentUserId ?? 0,
        authorName: model?.currentUserName ?? "",
        createdLabel: "Just now",
        text,
        isFeedback: false,
        canEdit: true,
        canDelete: true,
      };
      updateQuestion(key, (question) => ({
        ...question,
        comments: [...question.comments, comment],
      }));
      return comment;
    },

    async updateComment(key, commentId, text) {
      await wait(delayMs);
      assertComments();
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
      await wait(delayMs);
      assertComments();
      requireQuestion(key);
      updateQuestion(key, (question) => ({
        ...question,
        comments: question.comments.filter((comment) => comment.id !== commentId),
      }));
    },

    async searchGuidanceOrgs(term) {
      await wait(delayMs);
      assertGuidance();
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
      await wait(delayMs);
      assertGuidance();
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
