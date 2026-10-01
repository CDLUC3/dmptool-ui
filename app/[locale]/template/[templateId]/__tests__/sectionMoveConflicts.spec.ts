import { findSectionMoveConflicts } from '../sectionMoveConflicts';

// Section 10 has the trigger question (Q1); Section 30 has Q3, which shows only when Q1 matches
const sections = [
  { id: 10, displayOrder: 1, questions: [{ id: 1, conditionGroups: [] }] },
  { id: 20, displayOrder: 2, questions: [{ id: 2, conditionGroups: [] }] },
  { id: 30, displayOrder: 3, questions: [{ id: 3, conditionGroups: [{ triggerQuestionId: 1 }] }] },
];

describe('findSectionMoveConflicts', () => {
  it('should flag moving a section above the section containing its trigger question', () => {
    expect(findSectionMoveConflicts(sections, 30, 1)).toEqual([
      { questionId: 3, triggerQuestionId: 1 },
    ]);
  });

  it('should flag moving a section with a trigger question below a section that depends on it', () => {
    expect(findSectionMoveConflicts(sections, 10, 3)).toEqual([
      { questionId: 3, triggerQuestionId: 1 },
    ]);
  });

  it('should allow moves that keep the trigger question section first', () => {
    expect(findSectionMoveConflicts(sections, 30, 2)).toEqual([]);
    expect(findSectionMoveConflicts(sections, 10, 2)).toEqual([]);
  });

  it('should allow moving an unrelated section', () => {
    expect(findSectionMoveConflicts(sections, 20, 1)).toEqual([]);
    expect(findSectionMoveConflicts(sections, 20, 3)).toEqual([]);
  });

  it('should ignore display logic within the moved section', () => {
    const sameSection = [
      {
        id: 10,
        displayOrder: 1,
        questions: [
          { id: 1, conditionGroups: [] },
          { id: 2, conditionGroups: [{ triggerQuestionId: 1 }] },
        ],
      },
      { id: 20, displayOrder: 2, questions: [{ id: 3, conditionGroups: [] }] },
    ];
    expect(findSectionMoveConflicts(sameSection, 10, 2)).toEqual([]);
  });

  it('should handle sections with no questions and questions with no conditionGroups', () => {
    const sparse = [
      { id: 10, displayOrder: 1, questions: [{ id: 1 }] },
      { id: 20, displayOrder: 2, questions: null },
      { id: 30, displayOrder: 3, questions: [null, { id: 3, conditionGroups: [null, { triggerQuestionId: 1 }] }] },
    ];
    expect(findSectionMoveConflicts(sparse, 30, 1)).toEqual([
      { questionId: 3, triggerQuestionId: 1 },
    ]);
    expect(findSectionMoveConflicts(sparse, 20, 1)).toEqual([]);
  });
});
