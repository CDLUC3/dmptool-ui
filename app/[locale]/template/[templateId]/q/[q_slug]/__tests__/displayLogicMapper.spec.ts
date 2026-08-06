import { fromQuestionConditionGroups, toSaveInput } from '../displayLogicMapper';
import { DisplayLogic, TriggerQuestionOption } from '@/app/types/displayLogic';
import {
  QuestionConditionActionType,
  QuestionConditionMatchType,
  QuestionConditionCondition,
} from '@/generated/graphql';

jest.mock('@/utils/clientLogger', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import logECS from '@/utils/clientLogger';

const singleValueTriggerQuestion: TriggerQuestionOption = {
  id: 1,
  questionText: 'What type of data?',
  questionType: 'radioButtons',
  isMultiValue: false,
  options: [
    { value: 'observational', label: 'Observational' },
    { value: 'experimental', label: 'Experimental' },
  ],
};

const multiValueTriggerQuestion: TriggerQuestionOption = {
  id: 2,
  questionText: 'Which formats apply?',
  questionType: 'checkBoxes',
  isMultiValue: true,
  options: [
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' },
  ],
};

const makeLogic = (overrides?: Partial<DisplayLogic>): DisplayLogic => ({
  action: 'show',
  matchType: 'any',
  groups: [
    {
      id: 'group-1',
      triggerQuestionId: 1,
      conditions: [{ id: 'cond-1', operator: 'is', optionValue: 'observational' }],
    },
  ],
  ...overrides,
});

// Minimal shape matching what fromQuestionConditionGroups reads off each fetched
// group/condition. Cast to `any` when passed in, since the real FetchedGroup type
// (derived from generated GraphQL query types) may carry extra fields (__typename,
// etc.) that aren't relevant to the mapping logic under test.
const makeFetchedGroup = (overrides?: Record<string, unknown>) => ({
  id: 1,
  triggerQuestionId: 10,
  conditions: [
    { id: 1, conditionType: QuestionConditionCondition.Equal, conditionMatch: 'foo' },
  ],
  ...overrides,
});

describe('fromQuestionConditionGroups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('action mapping', () => {
    it('should map HideQuestion to "hide"', () => {
      const result = fromQuestionConditionGroups(
        QuestionConditionActionType.HideQuestion,
        QuestionConditionMatchType.Any,
        []
      );
      expect(result?.action).toBe('hide');
    });

    it('should map ShowQuestion to "show"', () => {
      const result = fromQuestionConditionGroups(
        QuestionConditionActionType.ShowQuestion,
        QuestionConditionMatchType.Any,
        []
      );
      expect(result?.action).toBe('show');
    });

    it('should return null and log a warning for an unsupported action value', () => {
      const unsupportedAction = 'SOME_UNSUPPORTED_ACTION' as QuestionConditionActionType;

      const result = fromQuestionConditionGroups(
        unsupportedAction,
        QuestionConditionMatchType.Any,
        []
      );

      expect(result).toBeNull();
      expect(logECS).toHaveBeenCalledWith(
        'warn',
        'fromQuestionConditionGroups',
        expect.objectContaining({
          error: expect.stringContaining('SOME_UNSUPPORTED_ACTION'),
        })
      );
    });

    it('should not log a warning when the action is supported', () => {
      fromQuestionConditionGroups(
        QuestionConditionActionType.ShowQuestion,
        QuestionConditionMatchType.Any,
        []
      );
      expect(logECS).not.toHaveBeenCalled();
    });
  });

  describe('matchType mapping', () => {
    it('should map All to "all"', () => {
      const result = fromQuestionConditionGroups(
        QuestionConditionActionType.ShowQuestion,
        QuestionConditionMatchType.All,
        []
      );
      expect(result?.matchType).toBe('all');
    });

    it('should map Any to "any"', () => {
      const result = fromQuestionConditionGroups(
        QuestionConditionActionType.ShowQuestion,
        QuestionConditionMatchType.Any,
        []
      );
      expect(result?.matchType).toBe('any');
    });
  });

  describe('groups mapping', () => {
    it('should prefix the group id with "group-"', () => {
      const result = fromQuestionConditionGroups(
        QuestionConditionActionType.ShowQuestion,
        QuestionConditionMatchType.Any,
        [makeFetchedGroup({ id: 42 })] as any
      );
      expect(result?.groups[0].id).toBe('group-42');
    });

    it('should preserve triggerQuestionId on each group', () => {
      const result = fromQuestionConditionGroups(
        QuestionConditionActionType.ShowQuestion,
        QuestionConditionMatchType.Any,
        [makeFetchedGroup({ triggerQuestionId: 99 })] as any
      );
      expect(result?.groups[0].triggerQuestionId).toBe(99);
    });

    it('should map multiple groups in order', () => {
      const result = fromQuestionConditionGroups(
        QuestionConditionActionType.ShowQuestion,
        QuestionConditionMatchType.Any,
        [
          makeFetchedGroup({ id: 1, triggerQuestionId: 10 }),
          makeFetchedGroup({ id: 2, triggerQuestionId: 20 }),
        ] as any
      );
      expect(result?.groups).toHaveLength(2);
      expect(result?.groups[0].triggerQuestionId).toBe(10);
      expect(result?.groups[1].triggerQuestionId).toBe(20);
    });

    it('should return an empty conditions array when conditions is null', () => {
      const result = fromQuestionConditionGroups(
        QuestionConditionActionType.ShowQuestion,
        QuestionConditionMatchType.Any,
        [makeFetchedGroup({ conditions: null })] as any
      );
      expect(result?.groups[0].conditions).toEqual([]);
    });

    it('should return an empty conditions array when conditions is undefined', () => {
      const result = fromQuestionConditionGroups(
        QuestionConditionActionType.ShowQuestion,
        QuestionConditionMatchType.Any,
        [makeFetchedGroup({ conditions: undefined })] as any
      );
      expect(result?.groups[0].conditions).toEqual([]);
    });

    it('should filter out null entries within a conditions array', () => {
      const result = fromQuestionConditionGroups(
        QuestionConditionActionType.ShowQuestion,
        QuestionConditionMatchType.Any,
        [
          makeFetchedGroup({
            conditions: [
              { id: 1, conditionType: QuestionConditionCondition.Equal, conditionMatch: 'foo' },
              null,
              { id: 2, conditionType: QuestionConditionCondition.Equal, conditionMatch: 'bar' },
            ],
          }),
        ] as any
      );
      expect(result?.groups[0].conditions).toHaveLength(2);
    });

    it('should prefix condition ids with "cond-"', () => {
      const result = fromQuestionConditionGroups(
        QuestionConditionActionType.ShowQuestion,
        QuestionConditionMatchType.Any,
        [
          makeFetchedGroup({
            conditions: [{ id: 7, conditionType: QuestionConditionCondition.Equal, conditionMatch: 'foo' }],
          }),
        ] as any
      );
      expect(result?.groups[0].conditions[0].id).toBe('cond-7');
    });

    it('should default optionValue to an empty string when conditionMatch is null', () => {
      const result = fromQuestionConditionGroups(
        QuestionConditionActionType.ShowQuestion,
        QuestionConditionMatchType.Any,
        [
          makeFetchedGroup({
            conditions: [{ id: 1, conditionType: QuestionConditionCondition.Equal, conditionMatch: null }],
          }),
        ] as any
      );
      expect(result?.groups[0].conditions[0].optionValue).toBe('');
    });

    it('should preserve conditionMatch as optionValue when present', () => {
      const result = fromQuestionConditionGroups(
        QuestionConditionActionType.ShowQuestion,
        QuestionConditionMatchType.Any,
        [
          makeFetchedGroup({
            conditions: [{ id: 1, conditionType: QuestionConditionCondition.Equal, conditionMatch: 'observational' }],
          }),
        ] as any
      );
      expect(result?.groups[0].conditions[0].optionValue).toBe('observational');
    });
  });

  describe('condition type -> operator mapping', () => {
    it.each([
      [QuestionConditionCondition.Equal, 'is'],
      [QuestionConditionCondition.Includes, 'is'],
      [QuestionConditionCondition.DoesNotEqual, 'is_not'],
      [QuestionConditionCondition.DoesNotInclude, 'is_not'],
      [QuestionConditionCondition.HasAnswer, 'is'],
    ])('should map %s to operator "%s"', (conditionType: QuestionConditionCondition, expectedOperator: string) => {
      const result = fromQuestionConditionGroups(
        QuestionConditionActionType.ShowQuestion,
        QuestionConditionMatchType.Any,
        [
          makeFetchedGroup({
            conditions: [{ id: 1, conditionType, conditionMatch: 'x' }],
          }),
        ] as any
      );
      expect(result?.groups[0].conditions[0].operator).toBe(expectedOperator);
    });
  });

  describe('full round-trip', () => {
    it('should reconstruct a complete DisplayLogic object from a realistic backend response', () => {
      const result = fromQuestionConditionGroups(
        QuestionConditionActionType.HideQuestion,
        QuestionConditionMatchType.All,
        [
          {
            id: 5,
            triggerQuestionId: 3691,
            conditions: [
              { id: 11, conditionType: QuestionConditionCondition.Equal, conditionMatch: 'Observational' },
              { id: 12, conditionType: QuestionConditionCondition.DoesNotEqual, conditionMatch: 'Experimental' },
            ],
          },
        ] as any
      );

      expect(result).toEqual({
        action: 'hide',
        matchType: 'all',
        groups: [
          {
            id: 'group-5',
            triggerQuestionId: 3691,
            conditions: [
              { id: 'cond-11', operator: 'is', optionValue: 'Observational' },
              { id: 'cond-12', operator: 'is_not', optionValue: 'Experimental' },
            ],
          },
        ],
      });
    });
  });
});

describe('toSaveInput', () => {
  describe('top-level fields', () => {
    it('should pass questionId through unchanged', () => {
      const result = toSaveInput(42, makeLogic(), [singleValueTriggerQuestion]);
      expect(result.questionId).toBe(42);
    });

    it('should map action "show" to "SHOW_QUESTION"', () => {
      const result = toSaveInput(1, makeLogic({ action: 'show' }), [singleValueTriggerQuestion]);
      expect(result.action).toBe('SHOW_QUESTION');
    });

    it('should map action "hide" to "HIDE_QUESTION"', () => {
      const result = toSaveInput(1, makeLogic({ action: 'hide' }), [singleValueTriggerQuestion]);
      expect(result.action).toBe('HIDE_QUESTION');
    });

    it('should map matchType "any" to "ANY"', () => {
      const result = toSaveInput(1, makeLogic({ matchType: 'any' }), [singleValueTriggerQuestion]);
      expect(result.matchType).toBe('ANY');
    });

    it('should map matchType "all" to "ALL"', () => {
      const result = toSaveInput(1, makeLogic({ matchType: 'all' }), [singleValueTriggerQuestion]);
      expect(result.matchType).toBe('ALL');
    });
  });

  describe('groups mapping', () => {
    it('should preserve triggerQuestionId on each group', () => {
      const result = toSaveInput(1, makeLogic(), [singleValueTriggerQuestion]);
      expect(result.groups[0].triggerQuestionId).toBe(1);
    });

    it('should map multiple groups in order', () => {
      const logic = makeLogic({
        groups: [
          { id: 'group-1', triggerQuestionId: 1, conditions: [{ id: 'c1', operator: 'is', optionValue: 'observational' }] },
          { id: 'group-2', triggerQuestionId: 2, conditions: [{ id: 'c2', operator: 'is', optionValue: 'csv' }] },
        ],
      });

      const result = toSaveInput(1, logic, [singleValueTriggerQuestion, multiValueTriggerQuestion]);

      expect(result.groups).toHaveLength(2);
      expect(result.groups[0].triggerQuestionId).toBe(1);
      expect(result.groups[1].triggerQuestionId).toBe(2);
    });

    it('should return an empty groups array when logic.groups is empty', () => {
      const result = toSaveInput(1, makeLogic({ groups: [] }), [singleValueTriggerQuestion]);
      expect(result.groups).toEqual([]);
    });
  });

  describe('conditionMatch', () => {
    it('should set conditionMatch to the condition\'s optionValue', () => {
      const logic = makeLogic({
        groups: [
          {
            id: 'group-1',
            triggerQuestionId: 1,
            conditions: [{ id: 'cond-1', operator: 'is', optionValue: 'experimental' }],
          },
        ],
      });

      const result = toSaveInput(1, logic, [singleValueTriggerQuestion]);
      expect(result.groups[0].conditions[0].conditionMatch).toBe('experimental');
    });

    it('should map multiple conditions within a group in order', () => {
      const logic = makeLogic({
        groups: [
          {
            id: 'group-1',
            triggerQuestionId: 1,
            conditions: [
              { id: 'cond-1', operator: 'is', optionValue: 'observational' },
              { id: 'cond-2', operator: 'is_not', optionValue: 'experimental' },
            ],
          },
        ],
      });

      const result = toSaveInput(1, logic, [singleValueTriggerQuestion]);

      expect(result.groups[0].conditions).toEqual([
        { conditionType: 'EQUAL', conditionMatch: 'observational' },
        { conditionType: 'DOES_NOT_EQUAL', conditionMatch: 'experimental' },
      ]);
    });
  });

  describe('operator -> conditionType mapping (single-value trigger questions)', () => {
    it('should map "is" to "EQUAL"', () => {
      const logic = makeLogic({
        groups: [{ id: 'g1', triggerQuestionId: 1, conditions: [{ id: 'c1', operator: 'is', optionValue: 'observational' }] }],
      });
      const result = toSaveInput(1, logic, [singleValueTriggerQuestion]);
      expect(result.groups[0].conditions[0].conditionType).toBe('EQUAL');
    });

    it('should map "is_not" to "DOES_NOT_EQUAL"', () => {
      const logic = makeLogic({
        groups: [{ id: 'g1', triggerQuestionId: 1, conditions: [{ id: 'c1', operator: 'is_not', optionValue: 'observational' }] }],
      });
      const result = toSaveInput(1, logic, [singleValueTriggerQuestion]);
      expect(result.groups[0].conditions[0].conditionType).toBe('DOES_NOT_EQUAL');
    });
  });

  describe('operator -> conditionType mapping (multi-value trigger questions)', () => {
    it('should map "is" to "INCLUDES"', () => {
      const logic = makeLogic({
        groups: [{ id: 'g1', triggerQuestionId: 2, conditions: [{ id: 'c1', operator: 'is', optionValue: 'csv' }] }],
      });
      const result = toSaveInput(1, logic, [multiValueTriggerQuestion]);
      expect(result.groups[0].conditions[0].conditionType).toBe('INCLUDES');
    });

    it('should map "is_not" to "DOES_NOT_INCLUDE"', () => {
      const logic = makeLogic({
        groups: [{ id: 'g1', triggerQuestionId: 2, conditions: [{ id: 'c1', operator: 'is_not', optionValue: 'csv' }] }],
      });
      const result = toSaveInput(1, logic, [multiValueTriggerQuestion]);
      expect(result.groups[0].conditions[0].conditionType).toBe('DOES_NOT_INCLUDE');
    });
  });

  describe('isMultiValue resolution', () => {
    it('should treat a group as single-value when its trigger question is not found in triggerQuestions', () => {
      const logic = makeLogic({
        groups: [{ id: 'g1', triggerQuestionId: 999, conditions: [{ id: 'c1', operator: 'is', optionValue: 'x' }] }],
      });

      // triggerQuestions doesn't contain id 999
      const result = toSaveInput(1, logic, [singleValueTriggerQuestion, multiValueTriggerQuestion]);

      expect(result.groups[0].conditions[0].conditionType).toBe('EQUAL'); // falls back to single-value mapping
    });

    it('should treat a group as single-value when triggerQuestions is empty', () => {
      const result = toSaveInput(1, makeLogic(), []);
      expect(result.groups[0].conditions[0].conditionType).toBe('EQUAL');
    });

    it('should correctly distinguish single vs multi within the same call across different groups', () => {
      const logic = makeLogic({
        groups: [
          { id: 'g1', triggerQuestionId: 1, conditions: [{ id: 'c1', operator: 'is', optionValue: 'observational' }] },
          { id: 'g2', triggerQuestionId: 2, conditions: [{ id: 'c2', operator: 'is', optionValue: 'csv' }] },
        ],
      });

      const result = toSaveInput(1, logic, [singleValueTriggerQuestion, multiValueTriggerQuestion]);

      expect(result.groups[0].conditions[0].conditionType).toBe('EQUAL');
      expect(result.groups[1].conditions[0].conditionType).toBe('INCLUDES');
    });
  });

  describe('full snapshot-style integration', () => {
    it('should produce the expected full payload for a mixed-condition, multi-group logic object', () => {
      const logic: DisplayLogic = {
        action: 'hide',
        matchType: 'all',
        groups: [
          {
            id: 'group-1',
            triggerQuestionId: 1,
            conditions: [
              { id: 'cond-1', operator: 'is', optionValue: 'observational' },
              { id: 'cond-2', operator: 'is_not', optionValue: 'experimental' },
            ],
          },
          {
            id: 'group-2',
            triggerQuestionId: 2,
            conditions: [{ id: 'cond-3', operator: 'is', optionValue: 'csv' }],
          },
        ],
      };

      const result = toSaveInput(7, logic, [singleValueTriggerQuestion, multiValueTriggerQuestion]);

      expect(result).toEqual({
        questionId: 7,
        action: 'HIDE_QUESTION',
        matchType: 'ALL',
        groups: [
          {
            triggerQuestionId: 1,
            conditions: [
              { conditionType: 'EQUAL', conditionMatch: 'observational' },
              { conditionType: 'DOES_NOT_EQUAL', conditionMatch: 'experimental' },
            ],
          },
          {
            triggerQuestionId: 2,
            conditions: [{ conditionType: 'INCLUDES', conditionMatch: 'csv' }],
          },
        ],
      });
    });
  });
});