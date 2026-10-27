import {
  computeProgress,
  questionKey,
  type PlanAuthoringModel,
  type PlanQuestionDefinition,
} from "@/components/PlanAuthoring/model";

export interface SingleQuestionPreview {
  model: PlanAuthoringModel;
  sectionIndex: number;
  totalSections: number;
  currentKey: string;
}

export function toSingleQuestionPreview(
  model: PlanAuthoringModel,
  currentKey: string
): SingleQuestionPreview | null {
  const sectionIndex = model.sections.findIndex((section) =>
    section.questions.some((question) => questionKey(question.identity) === currentKey)
  );
  if (sectionIndex < 0) {
    return null;
  }
  const section = model.sections[sectionIndex];
  const questions = section.questions.filter((question) => questionKey(question.identity) === currentKey);
  const sections = [{ ...section, questions }];
  return {
    model: { ...model, sections, progress: computeProgress(sections) },
    sectionIndex,
    totalSections: model.sections.length,
    currentKey,
  };
}

function sameAnswerShape(a: PlanQuestionDefinition, b: PlanQuestionDefinition): boolean {
  return a.questionType === b.questionType && JSON.stringify(a.parsedJson) === JSON.stringify(b.parsedJson);
}

/**
 * Keeps answers typed in the preview when the model is rebuilt from a newer draft, unless the
 * question's type or options changed and the old answer no longer fits.
 */
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
  const sections = next.sections.map((section) => ({
    ...section,
    questions: section.questions.map((question) => {
      const answered = answers.get(questionKey(question.identity));
      return answered && sameAnswerShape(answered, question)
        ? { ...question, answerJson: answered.answerJson, hasAnswer: true }
        : question;
    }),
  }));
  return { ...next, sections, progress: computeProgress(sections) };
}
