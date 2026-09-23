import { createPlanAuthoringDemo } from "./demoData";
import type { PlanAuthoringDataSource } from "../dataSource";
import {
  PlanAuthoringModel,
  PlanComment,
  computeProgress,
  questionKey,
} from "../model";

export interface DemoDataSourceOptions {
  initialModel?: PlanAuthoringModel;
  failSaveOnce?: boolean;
  delayMs?: number;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createPlanAuthoringDemoDataSource(
  options: DemoDataSourceOptions = {}
): PlanAuthoringDataSource {
  const delayMs = options.delayMs ?? 350;
  let model: PlanAuthoringModel = structuredClone(
    options.initialModel ?? createPlanAuthoringDemo()
  );
  let failSaveOnce = Boolean(options.failSaveOnce);
  const listeners = new Set<() => void>();

  const notify = () => {
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
      question.hasAnswer = answerJson != null && answerJson !== "";
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
