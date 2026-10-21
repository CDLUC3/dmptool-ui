import { TemplateQuery } from '@/generated/graphql';
import { DisplayLogicOrderConflict } from '@/app/types/displayLogic';

type TemplateSection = NonNullable<NonNullable<NonNullable<TemplateQuery['template']>['sections']>[number]>;
type TemplateQuestion = NonNullable<NonNullable<TemplateSection['questions']>[number]>;

// Only the fields of a TemplateDocument section and its questions that the display logic check needs
type OrderedSection = Pick<TemplateSection, 'id' | 'displayOrder'> & {
  questions?: (Pick<TemplateQuestion, 'id' | 'conditionGroups'> | null)[] | null;
};

/**
 * Display logic can only use trigger questions that come before the question being shown/hidden, and a
 * trigger question can be in an earlier section. This returns the display logic rules that would break if
 * the section with `movedSectionId` were moved to `newDisplayOrder`, either because a question in the moved
 * section would end up in a section before one of its trigger questions, or because a trigger question in
 * the moved section would end up after a question that depends on it.
 *
 * Only rules that cross between the moved section and another section can change, since moving a section
 * does not change the order of questions within it or the relative order of the other sections.
 *
 * @param sections - all sections in the template, including their questions' conditionGroups
 * @param movedSectionId - the section being moved
 * @param newDisplayOrder - the 1-based position (started from 1) the section is being moved to
 * @returns An array of the rules that would break (empty if the move is safe)
 */
export function findSectionMoveConflicts(
  sections: OrderedSection[],
  movedSectionId: number,
  newDisplayOrder: number
): DisplayLogicOrderConflict[] {
  // Generate the new order of section ids, and filter out the moved section so it can be spliced in at its new position
  const orderedIds = [...sections]
    .filter((s): s is OrderedSection & { id: number } => s.id != null)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((s) => s.id)
    .filter((id) => id !== movedSectionId);

  orderedIds.splice(newDisplayOrder - 1, 0, movedSectionId); // Convert 1-based display order to 0-based index for splice

  const sectionPositions = new Map(orderedIds.map((id, index) => [id, index]));

  // Map each question to the position of the section it will be in. Condition groups only have the trigger
  // question's id, so this is used to look up which section each trigger question is in
  const questionSectionPositions = new Map<number, number>();
  for (const section of sections) {
    if (section.id == null) continue;
    const position = sectionPositions.get(section.id);

    if (position === undefined) continue;

    for (const question of section.questions ?? []) {
      if (question?.id != null) questionSectionPositions.set(question.id, position);
    }
  }

  const movedPosition = sectionPositions.get(movedSectionId);

  /*
  * Find the display logic rules that the move would break.
  *
  * For each question that has display logic, compare the new position of its section with the new
  * position of each trigger question's section. A rule breaks when the trigger question's section
  * would come after the question's section.
  *
  * Only rules that link the moved section to a different section are checked. Moving a section keeps
  * the questions within it in the same order, and keeps every other section in the same order
  * relative to each other, so rules entirely inside the moved section, or entirely outside it,
  * can't change. This also means a rule that is already broken elsewhere won't block this move.
  */
  const conflicts: DisplayLogicOrderConflict[] = [];
  for (const section of sections) {
    // Find where this section will be after the move
    if (section.id == null) continue;

    const questionPosition = sectionPositions.get(section.id);
    if (questionPosition === undefined) continue;

    for (const question of section.questions ?? []) {
      if (question?.id == null) continue;

      for (const group of question.conditionGroups ?? []) {
        if (!group) continue;

        const triggerPosition = questionSectionPositions.get(group.triggerQuestionId);
        if (triggerPosition === undefined) continue;

        // Only rules with exactly one side in the moved section can change
        // Is the question with the display logic in the moved section? Is the trigger question in the moved section? If yes,
        // then both move together so their order doesn't change. If no, then neither moves so their order doesn't change. 
        // If one is in the moved section and the other isn't, then the move could break the rule.  
        if ((questionPosition === movedPosition) === (triggerPosition === movedPosition)) continue;

        if (triggerPosition > questionPosition) {
          conflicts.push({ questionId: question.id, triggerQuestionId: group.triggerQuestionId });
        }
      }
    }
  }

  return conflicts;
}
