import { DisplayLogicOrderConflict } from '@/app/types/displayLogic';
import { ErrorMessageItem } from '@/components/ErrorMessages';
import { routePath } from '@/utils/routes';
import { stripHtml } from '@/utils/general';

// Groups display logic conflicts by the question whose display logic would break, collecting the trigger questions
// that are blocking the action for each one
export const groupConflictsByQuestion = (
  conflicts: DisplayLogicOrderConflict[]
): { questionId: number; triggerQuestionIds: number[] }[] => {
  const triggerQuestionIds = new Map<number, Set<number>>();
  for (const conflict of conflicts) {
    if (!triggerQuestionIds.has(conflict.questionId)) triggerQuestionIds.set(conflict.questionId, new Set());
    triggerQuestionIds.get(conflict.questionId)!.add(conflict.triggerQuestionId);
  }
  return [...triggerQuestionIds].map(([questionId, ids]) => ({ questionId, triggerQuestionIds: [...ids] }));
};

/**
 * Builds the error message for an action that was blocked because it would break display logic, e.g. moving a
 * question above its trigger question. It links to each question whose display logic is blocking the action. The
 * links open the question's Display Logic tab with the blocking trigger questions highlighted.
 *
 * @param conflicts - the display logic rules that would break
 * @param questions - questions to look up the text of the linked questions in
 * @param templateId - the template the questions belong to
 * @param message - why the action was blocked
 * @param linksHeading - shown above the links
 * @param untitledQuestion - label for a linked question that has no text
 * @returns the error message, for ErrorMessages
 */
export const buildDisplayLogicConflictError = ({
  conflicts,
  questions,
  templateId,
  message,
  linksHeading,
  untitledQuestion,
}: {
  conflicts: DisplayLogicOrderConflict[];
  questions: ({ id?: number | null; questionText?: string | null } | null)[];
  templateId: string | number;
  message: string;
  linksHeading: string;
  untitledQuestion: (id: number) => string;
}): ErrorMessageItem => {
  const questionTexts = new Map<number, string | null | undefined>();
  for (const question of questions) {
    if (question?.id != null) questionTexts.set(question.id, question.questionText);
  }

  return {
    message,
    linksHeading,
    links: groupConflictsByQuestion(conflicts).map(({ questionId, triggerQuestionIds }) => ({
      href: routePath(
        'template.q.slug',
        { templateId, q_slug: questionId },
        { tab: 'logic', trigger: triggerQuestionIds.join(',') }
      ),
      label: stripHtml(questionTexts.get(questionId) ?? '') || untitledQuestion(questionId),
    })),
  };
};
