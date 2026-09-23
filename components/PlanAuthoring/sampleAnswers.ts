import type { PlanQuestionDefinition } from "./model";
import {
  ADDITIONAL_COMMENT_JSON_KEY,
  getAdditionalCommentValue,
  hasAdditionalCommentKey,
} from "./answerUtils";

export type PlanSampleAnswer = {
  id: "base" | "customization";
  orgLabel: string;
  html: string;
};

export function getPlanSampleAnswers(
  question: Pick<
    PlanQuestionDefinition,
    | "sampleText"
    | "customizationSampleText"
    | "sampleTextOrgLabel"
    | "customizationSampleOrgLabel"
  >
): PlanSampleAnswer[] {
  const samples: PlanSampleAnswer[] = [];

  if (question.sampleText?.trim()) {
    samples.push({
      id: "base",
      orgLabel: question.sampleTextOrgLabel ?? "",
      html: question.sampleText,
    });
  }

  if (question.customizationSampleText?.trim()) {
    samples.push({
      id: "customization",
      orgLabel: question.customizationSampleOrgLabel ?? "",
      html: question.customizationSampleText,
    });
  }

  return samples;
}

export function buildSampleAnswerDraft(
  questionType: string,
  html: string,
  currentDraft: unknown
): unknown {
  const draft: Record<string, unknown> = {
    type: questionType,
    answer: html,
  };

  if (hasAdditionalCommentKey(currentDraft)) {
    draft[ADDITIONAL_COMMENT_JSON_KEY] = getAdditionalCommentValue(currentDraft);
  }

  return draft;
}

export function resolveInitialAnswer(
  question: PlanQuestionDefinition
): unknown {
  if (question.answerJson != null) {
    return question.answerJson;
  }

  if (question.useSampleTextAsDefault && question.sampleText) {
    return {
      type: question.questionType,
      answer: question.sampleText,
    };
  }

  return question.answerJson;
}
