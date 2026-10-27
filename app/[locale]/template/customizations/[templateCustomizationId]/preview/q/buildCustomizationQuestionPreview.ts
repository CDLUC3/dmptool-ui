import { questionKey, type PlanQuestionIdentity } from "@/components/PlanAuthoring/model";
import { toSingleQuestionPreview, type SingleQuestionPreview } from "@/components/PlanPreview/singleQuestionPreview";
import {
  NEW_QUESTION_ID,
  UNSAVED_QUESTION_ID,
  type QuestionPreviewDraft,
} from "@/components/QuestionPreviewLink/questionPreviewDraft";
import type { CustomizationPreviewData, CustomizationPreviewQuestion } from "../customizationPreviewData";
import { toCustomizationPreviewModel } from "../toCustomizationPreviewModel";

export interface QuestionCustomizationPreviewDraft {
  guidanceText: string;
  sampleText: string;
}

export type CustomizationQuestionPreviewDraft = QuestionPreviewDraft | QuestionCustomizationPreviewDraft;

export interface CustomizationQuestionPreviewTarget {
  /** A question key such as base-question-12, or NEW_QUESTION_ID. */
  questionKey: string;
  /** The overview section a new custom question is being added to. */
  sectionId?: number;
  draft: CustomizationQuestionPreviewDraft | null;
}

function isFullQuestionDraft(draft: CustomizationQuestionPreviewDraft): draft is QuestionPreviewDraft {
  return "json" in draft;
}

export function parseCustomizationQuestionKey(key: string): PlanQuestionIdentity | null {
  const match = /^(base|custom)-question-(\d+)$/.exec(key);
  if (!match) {
    return null;
  }
  const id = Number(match[2]);
  return match[1] === "base" ? { kind: "base", versionedQuestionId: id } : { kind: "custom", customQuestionId: id };
}

function fromFullDraft(identity: PlanQuestionIdentity, draft: QuestionPreviewDraft): CustomizationPreviewQuestion {
  return {
    identity,
    questionText: draft.questionText ?? null,
    requirementText: draft.requirementText ?? null,
    guidanceText: draft.guidanceText ?? null,
    sampleText: draft.sampleText ?? null,
    useSampleTextAsDefault: draft.useSampleTextAsDefault ?? false,
    required: draft.required ?? false,
    json: draft.json ?? null,
  };
}

function applyDraft(
  question: CustomizationPreviewQuestion,
  draft: CustomizationQuestionPreviewDraft | null
): CustomizationPreviewQuestion {
  if (!draft) {
    return question;
  }
  if (isFullQuestionDraft(draft)) {
    return question.identity.kind === "custom" ? fromFullDraft(question.identity, draft) : question;
  }
  return question.identity.kind === "base"
    ? { ...question, customization: { guidanceText: draft.guidanceText, sampleText: draft.sampleText } }
    : question;
}

/** Returns null when the question can't be found, or a new question has no draft to show. */
export function buildCustomizationQuestionPreview(
  data: CustomizationPreviewData,
  { questionKey: key, sectionId, draft }: CustomizationQuestionPreviewTarget
): SingleQuestionPreview | null {
  const isNew = key === NEW_QUESTION_ID;
  let currentKey: string;
  let sections = data.sections;

  if (isNew) {
    if (!draft || !isFullQuestionDraft(draft)) {
      return null;
    }
    const targetSectionId = sectionId ?? draft.sectionId;
    // Matches the editor, which takes the first overview section with this id.
    const index = sections.findIndex(({ identity }) =>
      identity.kind === "base" ? identity.versionedSectionId === targetSectionId : identity.customSectionId === targetSectionId
    );
    if (index < 0) {
      return null;
    }
    const identity: PlanQuestionIdentity = { kind: "custom", customQuestionId: UNSAVED_QUESTION_ID };
    sections = sections.map((section, sectionIndex) =>
      sectionIndex === index ? { ...section, questions: [...section.questions, fromFullDraft(identity, draft)] } : section
    );
    currentKey = questionKey(identity);
  } else {
    const identity = parseCustomizationQuestionKey(key);
    if (!identity) {
      return null;
    }
    currentKey = questionKey(identity);
    let found = false;
    sections = sections.map((section) => {
      if (!section.questions.some((question) => questionKey(question.identity) === currentKey)) {
        return section;
      }
      found = true;
      return {
        ...section,
        questions: section.questions.map((question) =>
          questionKey(question.identity) === currentKey ? applyDraft(question, draft) : question
        ),
      };
    });
    if (!found) {
      return null;
    }
  }

  return toSingleQuestionPreview(toCustomizationPreviewModel({ ...data, sections }), currentKey);
}
