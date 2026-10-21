import { findQuestionMoveConflicts } from '../questionMoveConflicts';

// Q1 (options question) -> Q2 -> Q3 (shows only when Q1 matches)
const questions = [
  { id: 1, displayOrder: 1, conditionGroups: [] },
  { id: 2, displayOrder: 2, conditionGroups: [] },
  { id: 3, displayOrder: 3, conditionGroups: [{ triggerQuestionId: 1 }] },
];

describe('findQuestionMoveConflicts', () => {
  it('should flag moving a question above its trigger question', () => {
    expect(findQuestionMoveConflicts(questions, 3, 1)).toEqual([
      { questionId: 3, triggerQuestionId: 1 },
    ]);
  });

  it('should flag moving a trigger question below a question that depends on it', () => {
    expect(findQuestionMoveConflicts(questions, 1, 3)).toEqual([
      { questionId: 3, triggerQuestionId: 1 },
    ]);
  });

  it('should allow moving a question that stays after its trigger question', () => {
    expect(findQuestionMoveConflicts(questions, 3, 2)).toEqual([]);
  });

  it('should allow moving an unrelated question between the trigger and dependent questions', () => {
    expect(findQuestionMoveConflicts(questions, 2, 1)).toEqual([]);
    expect(findQuestionMoveConflicts(questions, 2, 3)).toEqual([]);
  });

  it('should ignore trigger questions that are in another section', () => {
    const withOtherSectionTrigger = [
      { id: 1, displayOrder: 1, conditionGroups: [{ triggerQuestionId: 99 }] },
      { id: 2, displayOrder: 2, conditionGroups: [] },
    ];
    expect(findQuestionMoveConflicts(withOtherSectionTrigger, 1, 2)).toEqual([]);
  });

  it('should not block a move because of an unrelated rule that is already broken', () => {
    const alreadyBroken = [
      { id: 1, displayOrder: 1, conditionGroups: [{ triggerQuestionId: 2 }] },
      { id: 2, displayOrder: 2, conditionGroups: [] },
      { id: 3, displayOrder: 3, conditionGroups: [] },
      { id: 4, displayOrder: 4, conditionGroups: [] },
    ];
    expect(findQuestionMoveConflicts(alreadyBroken, 4, 3)).toEqual([]);
  });

  it('should handle questions with no conditionGroups and null groups', () => {
    const sparse = [
      { id: 1, displayOrder: 1 },
      { id: 2, displayOrder: 2, conditionGroups: null },
      { id: 3, displayOrder: 3, conditionGroups: [null, { triggerQuestionId: 1 }] },
    ];
    expect(findQuestionMoveConflicts(sparse, 3, 1)).toEqual([
      { questionId: 3, triggerQuestionId: 1 },
    ]);
    expect(findQuestionMoveConflicts(sparse, 2, 1)).toEqual([]);
  });
});
