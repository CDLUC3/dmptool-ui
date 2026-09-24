import { RESEARCH_OUTPUT_QUESTION_TYPE } from "@/lib/constants";
import { createPlanAuthoringDemo } from "./demoData";
import type { PlanAuthoringDataSource } from "../dataSource";
import {
  PlanAuthoringModel,
  PlanComment,
  computeProgress,
  questionKey,
} from "../model";
import { getResearchOutputRows } from "../researchOutputAnswer";

export interface DemoDataSourceOptions {
  initialModel?: PlanAuthoringModel;
  failSaveOnce?: boolean;
  delayMs?: number;
  /** When set, hydrate/save the model in sessionStorage (SSR-safe). */
  persistKey?: string;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function readPersistedModel(persistKey: string): PlanAuthoringModel | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(persistKey);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PlanAuthoringModel;
  } catch {
    return null;
  }
}

function writePersistedModel(
  persistKey: string,
  model: PlanAuthoringModel
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(persistKey, JSON.stringify(model));
  } catch {
    // Quota or private mode — demo still works in-memory.
  }
}

function hasAnswerForQuestion(
  questionType: string,
  answerJson: unknown
): boolean {
  if (questionType === RESEARCH_OUTPUT_QUESTION_TYPE) {
    const rows = getResearchOutputRows(answerJson);
    return rows.length > 0;
  }
  return answerJson != null && answerJson !== "";
}

export function createPlanAuthoringDemoDataSource(
  options: DemoDataSourceOptions = {}
): PlanAuthoringDataSource {
  const delayMs = options.delayMs ?? 350;
  const persistKey = options.persistKey;
  const persisted =
    persistKey !== undefined ? readPersistedModel(persistKey) : null;
  let model: PlanAuthoringModel = structuredClone(
    persisted ?? options.initialModel ?? createPlanAuthoringDemo()
  );
  let failSaveOnce = Boolean(options.failSaveOnce);
  const listeners = new Set<() => void>();

  const notify = () => {
    if (persistKey !== undefined) {
      writePersistedModel(persistKey, model);
    }
    listeners.forEach((listener) => listener());
  };

  const findQuestion = (questionKeyValue: string) => {
    for (const section of model.sections) {
      const question = section.questions.find(
        (item) => questionKey(item.identity) === questionKeyValue
      );
      if (question) {
        return question;
      }
    }
    return undefined;
  };

  return {
    getModel() {
      return model;
    },

    async saveAnswer(questionKeyValue, answerJson) {
      await wait(delayMs);

      if (failSaveOnce) {
        failSaveOnce = false;
        return {
          success: false,
          error: "Simulated save failure. Try again.",
        };
      }

      const question = findQuestion(questionKeyValue);
      if (!question) {
        return { success: false, error: "Question not found." };
      }

      question.answerJson = answerJson;
      question.hasAnswer = hasAnswerForQuestion(
        question.questionType,
        answerJson
      );
      model = {
        ...model,
        progress: computeProgress(model.sections),
        sections: [...model.sections],
      };
      notify();
      return { success: true };
    },

    async loadGuidance(questionKeyValue) {
      await wait(delayMs);
      const question = findQuestion(questionKeyValue);
      return question?.guidanceSources ?? [];
    },

    async loadComments(questionKeyValue) {
      await wait(delayMs);
      const question = findQuestion(questionKeyValue);
      return question?.comments ?? [];
    },

    async addComment(questionKeyValue, text) {
      await wait(delayMs);
      const question = findQuestion(questionKeyValue);
      if (!question) {
        throw new Error("Question not found.");
      }

      const comment: PlanComment = {
        id: Date.now(),
        authorId: model.currentUserId,
        authorName: model.currentUserName,
        user: {
          id: model.currentUserId,
          givenName: model.currentUserName,
          surName: "",
        },
        createdLabel: "Just now",
        text,
      };
      question.comments = [...question.comments, comment];
      model = { ...model, sections: [...model.sections] };
      notify();
      return comment;
    },

    async updateComment(questionKeyValue, commentId, text) {
      await wait(delayMs);
      const question = findQuestion(questionKeyValue);
      if (!question) {
        throw new Error("Question not found.");
      }

      const existing = question.comments.find((item) => item.id === commentId);
      if (!existing) {
        throw new Error("Comment not found.");
      }

      const updated: PlanComment = {
        ...existing,
        text,
        isEdited: true,
        createdLabel: existing.createdLabel,
      };
      question.comments = question.comments.map((item) =>
        item.id === commentId ? updated : item
      );
      model = { ...model, sections: [...model.sections] };
      notify();
      return updated;
    },

    async deleteComment(questionKeyValue, commentId) {
      await wait(delayMs);
      const question = findQuestion(questionKeyValue);
      if (!question) {
        throw new Error("Question not found.");
      }

      question.comments = question.comments.filter(
        (item) => item.id !== commentId
      );
      model = { ...model, sections: [...model.sections] };
      notify();
    },

    async searchGuidanceOrgs(term) {
      await wait(delayMs);
      const normalized = term.trim().toLowerCase();
      if (!normalized) {
        return model.availableGuidanceOrgs;
      }
      return model.availableGuidanceOrgs.filter((org) => {
        return (
          org.label.toLowerCase().includes(normalized) ||
          org.shortName.toLowerCase().includes(normalized)
        );
      });
    },

    async setSelectedGuidanceOrgs(orgIds) {
      await wait(delayMs);
      const availableIds = new Set(
        model.availableGuidanceOrgs.map((org) => org.id)
      );
      model = {
        ...model,
        selectedGuidanceOrgIds: [...new Set(orgIds)].filter((orgId) =>
          availableIds.has(orgId)
        ),
      };
      notify();
      return model.selectedGuidanceOrgIds;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
