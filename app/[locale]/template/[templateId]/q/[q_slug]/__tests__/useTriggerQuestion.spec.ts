import { renderHook } from '@testing-library/react';
import { useTriggerQuestions } from '../hooks/useTriggerQuestions';
import { isOptionsType } from '@/app/hooks/useEditQuestion';
import { getParsedQuestionJSON } from '@/components/hooks/getParsedQuestionJSON';

jest.mock('@/app/hooks/useEditQuestion', () => ({
  isOptionsType: jest.fn(),
}));

jest.mock('@/components/hooks/getParsedQuestionJSON', () => ({
  getParsedQuestionJSON: jest.fn(),
}));

const mockIsOptionsType = isOptionsType as jest.Mock;
const mockGetParsedQuestionJSON = getParsedQuestionJSON as jest.Mock;

// Helper to make mocking getParsedQuestionJSON's return value per-question less verbose.
// Keys the mock's behavior off q.id so different questions in the same test can parse differently.
const mockParsedResultsById = (resultsById: Record<number, { parsed: unknown } | { parsed: null }>) => {
  mockGetParsedQuestionJSON.mockImplementation((q: { id?: number | null }) => {
    return resultsById[q.id as number] ?? { parsed: null };
  });
};

describe('useTriggerQuestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: treat radioButtons/checkBoxes/selectBox/multiselectBox as options types
    mockIsOptionsType.mockImplementation((type: string) =>
      ['radioButtons', 'checkBoxes', 'selectBox', 'multiselectBox'].includes(type)
    );
  });

  it('should return an empty array when questions is null', () => {
    const { result } = renderHook(() => useTriggerQuestions(null, 1));
    expect(result.current.triggerQuestions).toEqual([]);
  });

  it('should return an empty array when questions is undefined', () => {
    const { result } = renderHook(() => useTriggerQuestions(undefined, 1));
    expect(result.current.triggerQuestions).toEqual([]);
  });

  it('should return an empty array when questions is an empty array', () => {
    const { result } = renderHook(() => useTriggerQuestions([], 1));
    expect(result.current.triggerQuestions).toEqual([]);
  });

  it('should filter out null entries in the questions array', () => {
    mockParsedResultsById({
      2: { parsed: { type: 'radioButtons', options: [{ label: 'Yes', value: 'yes' }] } },
    });

    const { result } = renderHook(() =>
      useTriggerQuestions(
        [null, { id: 2, questionText: 'Q2', displayOrder: 1, json: '{}' }],
        1
      )
    );

    expect(result.current.triggerQuestions).toHaveLength(1);
    expect(result.current.triggerQuestions[0].id).toBe(2);
  });

  it('should filter out questions with a null or undefined id', () => {
    const { result } = renderHook(() =>
      useTriggerQuestions(
        [
          { id: null, questionText: 'No id', displayOrder: 1, json: '{}' },
          { id: undefined, questionText: 'Also no id', displayOrder: 1, json: '{}' },
        ],
        1
      )
    );

    expect(result.current.triggerQuestions).toEqual([]);
  });

  it('should exclude the current question itself', () => {
    mockParsedResultsById({
      1: { parsed: { type: 'radioButtons', options: [{ label: 'Yes', value: 'yes' }] } },
      2: { parsed: { type: 'radioButtons', options: [{ label: 'Yes', value: 'yes' }] } },
    });

    const { result } = renderHook(() =>
      useTriggerQuestions(
        [
          { id: 1, questionText: 'Current question', displayOrder: 1, json: '{}' },
          { id: 2, questionText: 'Other question', displayOrder: 1, json: '{}' },
        ],
        1 // currentQuestionId
      )
    );

    expect(result.current.triggerQuestions).toHaveLength(1);
    expect(result.current.triggerQuestions[0].id).toBe(2);
  });

  describe('backend-provided candidate list behavior', () => {
    it('should include candidates regardless of displayOrder because backend pre-filters prior questions', () => {
      mockParsedResultsById({
        2: { parsed: { type: 'radioButtons', options: [{ label: 'Yes', value: 'yes' }] } },
        3: { parsed: { type: 'radioButtons', options: [{ label: 'Yes', value: 'yes' }] } },
      });

      const { result } = renderHook(() =>
        useTriggerQuestions(
          [
            { id: 2, questionText: 'Earlier question', displayOrder: 1, json: '{}' },
            { id: 3, questionText: 'Later question', displayOrder: 10, json: '{}' },
          ],
          1
        )
      );

      expect(result.current.triggerQuestions).toHaveLength(2);
    });
  });

  describe('JSON parsing / options-type filtering', () => {
    it('should exclude a question with no json', () => {
      const { result } = renderHook(() =>
        useTriggerQuestions([{ id: 2, questionText: 'No json', displayOrder: 1, json: null }], 1)
      );

      expect(result.current.triggerQuestions).toEqual([]);
      expect(mockGetParsedQuestionJSON).not.toHaveBeenCalled();
    });

    it('should exclude a question when parsed.type is missing', () => {
      mockParsedResultsById({ 2: { parsed: null } });

      const { result } = renderHook(() =>
        useTriggerQuestions([{ id: 2, questionText: 'Unparseable', displayOrder: 1, json: '{}' }], 1)
      );

      expect(result.current.triggerQuestions).toEqual([]);
    });

    it('should exclude a question whose type is not an options type', () => {
      mockIsOptionsType.mockReturnValue(false);
      mockParsedResultsById({ 2: { parsed: { type: 'text' } } });

      const { result } = renderHook(() =>
        useTriggerQuestions([{ id: 2, questionText: 'Text question', displayOrder: 1, json: '{}' }], 1)
      );

      expect(result.current.triggerQuestions).toEqual([]);
    });

    it('should exclude a question with an options-type type but no options array', () => {
      mockParsedResultsById({ 2: { parsed: { type: 'radioButtons' } } }); // no `options` key

      const { result } = renderHook(() =>
        useTriggerQuestions([{ id: 2, questionText: 'Missing options', displayOrder: 1, json: '{}' }], 1)
      );

      expect(result.current.triggerQuestions).toEqual([]);
    });

    it('should exclude a question when options is present but not an array', () => {
      mockParsedResultsById({ 2: { parsed: { type: 'radioButtons', options: 'not-an-array' } } });

      const { result } = renderHook(() =>
        useTriggerQuestions([{ id: 2, questionText: 'Bad options', displayOrder: 1, json: '{}' }], 1)
      );

      expect(result.current.triggerQuestions).toEqual([]);
    });
  });

  describe('mapping to TriggerQuestionOption', () => {
    it('should map a valid single-value (radioButtons) question correctly', () => {
      mockParsedResultsById({
        2: {
          parsed: {
            type: 'radioButtons',
            options: [
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ],
          },
        },
      });

      const { result } = renderHook(() =>
        useTriggerQuestions(
          [{ id: 2, questionText: 'Is this a test?', displayOrder: 1, json: '{}' }],
          1
        )
      );

      expect(result.current.triggerQuestions).toEqual([
        {
          id: 2,
          questionText: 'Is this a test?',
          questionType: 'radioButtons',
          isMultiValue: false,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        },
      ]);
    });

    it.each(['checkBoxes', 'multiselectBox'])(
      'marks %s questions as isMultiValue: true',
      (type) => {
        mockParsedResultsById({
          2: { parsed: { type, options: [{ label: 'A', value: 'a' }] } },
        });

        const { result } = renderHook(() =>
          useTriggerQuestions([{ id: 2, questionText: 'Q', displayOrder: 1, json: '{}' }], 1)
        );

        expect(result.current.triggerQuestions[0].isMultiValue).toBe(true);
      }
    );

    it.each(['radioButtons', 'selectBox'])(
      'marks %s questions as isMultiValue: false',
      (type) => {
        mockParsedResultsById({
          2: { parsed: { type, options: [{ label: 'A', value: 'a' }] } },
        });

        const { result } = renderHook(() =>
          useTriggerQuestions([{ id: 2, questionText: 'Q', displayOrder: 1, json: '{}' }], 1)
        );

        expect(result.current.triggerQuestions[0].isMultiValue).toBe(false);
      }
    );

    it('defaults questionText to an empty string when null', () => {
      mockParsedResultsById({
        2: { parsed: { type: 'radioButtons', options: [{ label: 'A', value: 'a' }] } },
      });

      const { result } = renderHook(() =>
        useTriggerQuestions([{ id: 2, questionText: null, displayOrder: 1, json: '{}' }], 1)
      );

      expect(result.current.triggerQuestions[0].questionText).toBe('');
    });

    it('should fall back option value to label when value is missing, and vice versa', () => {
      mockParsedResultsById({
        2: {
          parsed: {
            type: 'radioButtons',
            options: [
              { label: 'Only label' }, // no value
              { value: 'only-value' }, // no label
            ],
          },
        },
      });

      const { result } = renderHook(() =>
        useTriggerQuestions([{ id: 2, questionText: 'Q', displayOrder: 1, json: '{}' }], 1)
      );

      expect(result.current.triggerQuestions[0].options).toEqual([
        { value: 'Only label', label: 'Only label' },
        { value: 'only-value', label: 'only-value' },
      ]);
    });

    it('should default both option value and label to empty string when neither is present', () => {
      mockParsedResultsById({
        2: { parsed: { type: 'radioButtons', options: [{}] } },
      });

      const { result } = renderHook(() =>
        useTriggerQuestions([{ id: 2, questionText: 'Q', displayOrder: 1, json: '{}' }], 1)
      );

      expect(result.current.triggerQuestions[0].options).toEqual([{ value: '', label: '' }]);
    });
  });

  describe('memoization', () => {
    it('should return a new array only when questions, currentQuestionId, or currentDisplayOrder change', () => {
      mockParsedResultsById({
        2: { parsed: { type: 'radioButtons', options: [{ label: 'A', value: 'a' }] } },
      });

      const questions = [{ id: 2, questionText: 'Q', displayOrder: 1, json: '{}' }];

      const { result, rerender } = renderHook(
        ({ q, currentQuestionId }) =>
          useTriggerQuestions(q, currentQuestionId),
        { initialProps: { q: questions, currentQuestionId: 1 } }
      );

      const firstResult = result.current.triggerQuestions;

      // Rerender with the exact same props/values
      rerender({ q: questions, currentQuestionId: 1 });

      expect(result.current.triggerQuestions).toBe(firstResult); // same reference — memoized
    });

    it('should recompute when currentQuestionId changes', () => {
      mockParsedResultsById({
        2: { parsed: { type: 'radioButtons', options: [{ label: 'A', value: 'a' }] } },
      });

      const questions = [{ id: 2, questionText: 'Q', displayOrder: 1, json: '{}' }];

      const { result, rerender } = renderHook(
        ({ currentQuestionId }) => useTriggerQuestions(questions, currentQuestionId),
        { initialProps: { currentQuestionId: 1 } }
      );

      expect(result.current.triggerQuestions).toHaveLength(1);

      rerender({ currentQuestionId: 2 }); // now excludes question id 2

      expect(result.current.triggerQuestions).toHaveLength(0);
    });
  });
});