import { useMemo } from 'react';

import { isOptionsType } from '@/app/hooks/useEditQuestion';
import { getParsedQuestionJSON } from '@/components/hooks/getParsedQuestionJSON';
import { TriggerQuestionOption } from '@/app/types/displayLogic';

// Loosely matches the shape that QuestionsDocument returns
interface RawTriggerQuestion {
  id?: number | null;
  questionText?: string | null;
  displayOrder?: number | null;
  json?: string | null;
}

/**
 * Will calculate the list of trigger questions for a given question.
 * Trigger questions are a list of questions this question's Display Logic can trigger
 * off of (i.e., questions displayed earlier in the same section that are option-type 
 * questions(["radioButtons", "checkBoxes", "multiselectBox", "selectBox"];)
 *
 * Takes the list of section questions from QuestionsDocument query.
 *
 * @param questions - all questions in the current section (unfiltered)
 * @param currentQuestionId - excluded from the list
 * @param currentDisplayOrder - only questions with a lower displayOrder
 *   are eligible triggers
 */
export function useTriggerQuestions(
  questions: (RawTriggerQuestion | null)[] | null | undefined,
  currentQuestionId: number,
  currentDisplayOrder: number | undefined
) {

  // Derive the list of questions that can be used as triggers for this question's Display Logic
  const triggerQuestions: TriggerQuestionOption[] = useMemo(() => {
    if (!questions) return [];

    return questions
      .filter((q): q is RawTriggerQuestion => q !== null && q.id != null) // Filters out nulls and questions with no id
      .filter((q) => q.id !== currentQuestionId) // Exclude the current question itself
      .filter((q) => // Only include questions with a lower displayOrder than the current question
        currentDisplayOrder === undefined
          ? q.displayOrder != null  // if we don't know our own order, still require the candidate to have one
          : q.displayOrder != null && q.displayOrder < currentDisplayOrder
      )
      .map((q) => {
        if (!q.json) return null;

        const { parsed } = getParsedQuestionJSON(q, '', (k: string) => k);

        if (!parsed?.type || !isOptionsType(parsed.type)) return null;
        if (!('options' in parsed) || !Array.isArray(parsed.options)) {
          return null;
        }

        const triggerQuestion: TriggerQuestionOption = {
          id: q.id as number,
          questionText: q.questionText ?? '',
          questionType: parsed.type, // 'radioButtons' | 'checkBoxes' | 'selectBox' | 'multiselectBox'
          isMultiValue: (parsed.type === 'checkBoxes') || (parsed.type === 'multiselectBox'),
          options: parsed.options.map((opt: { value?: string; label?: string }) => ({
            value: opt.value ?? opt.label ?? '',
            label: opt.label ?? opt.value ?? '',
          })),
        }

        return triggerQuestion;
      })
      .filter((q): q is TriggerQuestionOption => q !== null);
  }, [questions, currentQuestionId, currentDisplayOrder]);

  return { triggerQuestions };
}