import { questionKey } from "@/components/PlanAuthoring/model";
import { toSingleQuestionPreview, type SingleQuestionPreview } from "@/components/PlanPreview/singleQuestionPreview";
import {
  NEW_QUESTION_ID,
  UNSAVED_QUESTION_ID,
  type QuestionPreviewDraft,
} from "@/components/QuestionPreviewLink/questionPreviewDraft";
import {
  toTemplatePreviewModel,
  type TemplatePreviewData,
  type TemplatePreviewExampleGuidance,
  type TemplatePreviewQuestion,
} from "../toTemplatePreviewModel";

export interface TemplateQuestionPreviewTarget {
  /** A saved question's id, or NEW_QUESTION_ID. */
  questionId: string;
  /** Where a new question is being added; also read from the draft. */
  sectionId?: number;
  draft: QuestionPreviewDraft | null;
}

function applyDraft(
  question: TemplatePreviewQuestion,
  draft: QuestionPreviewDraft | null
): TemplatePreviewQuestion {
  if (!draft) {
    return question;
  }
  const { sectionId: _sectionId, ...fields } = draft;
  return { ...question, ...fields };
}

/** Returns null when the question can't be found, or a new question has no draft to show. */
export function buildTemplateQuestionPreview(
  { template, guidance }: TemplatePreviewData,
  { questionId, sectionId, draft }: TemplateQuestionPreviewTarget,
  exampleGuidance: TemplatePreviewExampleGuidance
): SingleQuestionPreview | null {
  const isNew = questionId === NEW_QUESTION_ID;
  const savedId = Number(questionId);
  const targetSectionId = isNew ? sectionId ?? draft?.sectionId : undefined;
  if (isNew && !draft) {
    return null;
  }

  let found = false;
  const sections = (template.sections ?? []).map((section) => {
    if (!section) {
      return section;
    }
    const questions = section.questions ?? [];
    if (isNew) {
      if (section.id !== targetSectionId) {
        return section;
      }
      found = true;
      const lastOrder = Math.max(0, ...questions.map((question) => question.displayOrder ?? 0));
      return {
        ...section,
        questions: [
          ...questions,
          applyDraft({ id: UNSAVED_QUESTION_ID, displayOrder: lastOrder + 1 }, draft),
        ],
      };
    }
    if (!questions.some((question) => question.id === savedId)) {
      return section;
    }
    found = true;
    return {
      ...section,
      questions: questions.map((question) => (question.id === savedId ? applyDraft(question, draft) : question)),
    };
  });
  if (!found) {
    return null;
  }

  const model = toTemplatePreviewModel({ ...template, sections }, exampleGuidance, guidance);
  return toSingleQuestionPreview(
    model,
    questionKey({ kind: "base", versionedQuestionId: isNew ? UNSAVED_QUESTION_ID : savedId })
  );
}
