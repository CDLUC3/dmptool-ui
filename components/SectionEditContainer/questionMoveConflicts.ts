import { SectionQuery } from '@/generated/graphql';
import { DisplayLogicOrderConflict } from '@/app/types/displayLogic';

type SectionQuestion = NonNullable<NonNullable<NonNullable<SectionQuery['section']>['questions']>[number]>;

// Only the fields of a SectionDocument question that the display logic check needs
type OrderedQuestion = Pick<SectionQuestion, 'id' | 'displayOrder' | 'conditionGroups'>;

/**
 * Display logic can only use trigger questions that come before the question being shown/hidden.
 * This returns the display logic rules that would break if the question with `movedQuestionId` were
 * moved to `newDisplayOrder` within its section, either because the question would move above one of its
 * trigger questions, or because a trigger question would move below a question that depends on it.
 *
 * Only rules involving the moved question are checked, so a pre-existing broken rule elsewhere in the
 * section does not block unrelated moves. Trigger questions in other sections are unaffected by a move
 * within this section, so they are ignored.
 *
 * @param questions - all questions in the section, including their conditionGroups
 * @param movedQuestionId - the question being moved
 * @param newDisplayOrder - the 1-based position (started from 1) the question is being moved to
 * @returns An array of the rules that would break (empty if the move is safe)
 */
export function findQuestionMoveConflicts(
  questions: OrderedQuestion[],
  movedQuestionId: number,
  newDisplayOrder: number
): DisplayLogicOrderConflict[] {
  // Simulate the new order of question ids
  const orderedIds = [...questions]
    .filter((q): q is OrderedQuestion & { id: number } => q.id != null)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((q) => q.id)
    .filter((id) => id !== movedQuestionId);
  orderedIds.splice(newDisplayOrder - 1, 0, movedQuestionId);

  const positions = new Map(orderedIds.map((id, index) => [id, index]));

  /*
   * Find the display logic rules that the move would break.
   *
   * For each question that has display logic, compare its new position with the new position of each of
   * its trigger questions. A rule breaks when the trigger question would come after the question it
   * controls.
   *
   * Only rules that involve the moved question are checked, either as the question with the display logic
   * or as the trigger question. Moving one question keeps every other question in the same order relative
   * to each other, so rules that don't involve it can't change. This also means a rule that is already
   * broken elsewhere in the section won't block this move.
   *
   * Trigger questions in other sections aren't in `positions`, so their rules are skipped. Moving a
   * question within its section can't change its order relative to other sections.
   */
  const conflicts: DisplayLogicOrderConflict[] = [];
  for (const question of questions) {
    if (question.id == null) continue;

    for (const group of question.conditionGroups ?? []) {
      if (!group) continue;

      // Only rules involving the moved question can change
      if (question.id !== movedQuestionId && group.triggerQuestionId !== movedQuestionId) continue;

      const triggerPosition = positions.get(group.triggerQuestionId);
      const questionPosition = positions.get(question.id);
      if (triggerPosition === undefined || questionPosition === undefined) continue;

      if (triggerPosition > questionPosition) {
        conflicts.push({ questionId: question.id, triggerQuestionId: group.triggerQuestionId });
      }
    }
  }

  return conflicts;
}
