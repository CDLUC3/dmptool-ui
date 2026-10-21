import { buildDisplayLogicConflictError, groupConflictsByQuestion } from '../displayLogicConflictError';

describe('groupConflictsByQuestion', () => {
  it('should group conflicts by the question whose display logic is blocking the action', () => {
    expect(groupConflictsByQuestion([
      { questionId: 10, triggerQuestionId: 3 },
      { questionId: 11, triggerQuestionId: 3 },
      { questionId: 11, triggerQuestionId: 4 },
      { questionId: 11, triggerQuestionId: 4 },
    ])).toEqual([
      { questionId: 10, triggerQuestionIds: [3] },
      { questionId: 11, triggerQuestionIds: [3, 4] },
    ]);
  });
});

describe('buildDisplayLogicConflictError', () => {
  const build = (questions: { id?: number | null; questionText?: string | null }[]) => buildDisplayLogicConflictError({
    conflicts: [
      { questionId: 10, triggerQuestionId: 3 },
      { questionId: 11, triggerQuestionId: 3 },
      { questionId: 11, triggerQuestionId: 4 },
    ],
    questions,
    templateId: 123,
    message: 'This section contains questions used in display logic.',
    linksHeading: 'Edit the display logic on:',
    untitledQuestion: (id) => `Question ${id}`,
  });

  it('should link to the Display Logic tab of each blocking question, highlighting its blocking trigger questions', () => {
    expect(build([
      { id: 10, questionText: 'Do you have pets?' },
      { id: 11, questionText: 'Which pets?' },
    ])).toEqual({
      message: 'This section contains questions used in display logic.',
      linksHeading: 'Edit the display logic on:',
      links: [
        { href: '/template/123/q/10?tab=logic&trigger=3', label: 'Do you have pets?' },
        { href: '/template/123/q/11?tab=logic&trigger=3%2C4', label: 'Which pets?' },
      ],
    });
  });

  it('should strip HTML from question text and label questions without text', () => {
    const error = build([{ id: 10, questionText: '<p>Do you have <strong>pets</strong>?</p>' }]);

    expect(error.links).toEqual([
      { href: '/template/123/q/10?tab=logic&trigger=3', label: 'Do you have pets?' },
      { href: '/template/123/q/11?tab=logic&trigger=3%2C4', label: 'Question 11' },
    ]);
  });
});
