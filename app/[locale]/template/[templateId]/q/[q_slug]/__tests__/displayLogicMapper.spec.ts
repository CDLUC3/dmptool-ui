import { toSaveInput } from '../displayLogicMapper';
import { DisplayLogic, TriggerQuestionOption } from '@/app/types/displayLogic';

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