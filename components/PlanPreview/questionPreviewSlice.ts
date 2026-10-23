import {
  computeProgress,
  questionKey,
  type PlanAuthoringModel,
} from "@/components/PlanAuthoring/model";

export interface QuestionPreviewSlice {
  model: PlanAuthoringModel;
  sectionIndex: number;
  totalSections: number;
  currentKey: string;
}

export function sliceQuestionPreview(
  model: PlanAuthoringModel,
  currentKey: string
): QuestionPreviewSlice | null {
  const sectionIndex = model.sections.findIndex((section) =>
    section.questions.some((question) => questionKey(question.identity) === currentKey)
  );
  if (sectionIndex < 0) {
    return null;
  }
  const section = model.sections[sectionIndex];
  const index = section.questions.findIndex((question) => questionKey(question.identity) === currentKey);
  const questions = section.questions.slice(Math.max(index - 1, 0), index + 2);
  const sections = [{ ...section, questions }];
  return {
    model: { ...model, sections, progress: computeProgress(sections) },
    sectionIndex,
    totalSections: model.sections.length,
    currentKey,
  };
}

/** Keeps answers typed in the preview when the model is rebuilt from a newer draft. */
export function withAnswersFrom(
  previous: PlanAuthoringModel | null,
  next: PlanAuthoringModel
): PlanAuthoringModel {
  if (!previous) {
    return next;
  }
  const answers = new Map(
    previous.sections
      .flatMap((section) => section.questions)
      .filter((question) => question.hasAnswer)
      .map((question) => [questionKey(question.identity), question])
  );
  return {
    ...next,
    sections: next.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => {
        const answered = answers.get(questionKey(question.identity));
        return answered
          ? { ...question, answerJson: answered.answerJson, hasAnswer: true }
          : question;
      }),
    })),
  };
}
