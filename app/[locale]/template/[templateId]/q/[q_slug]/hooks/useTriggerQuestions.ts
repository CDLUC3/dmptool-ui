import { useMemo } from 'react';

import { isOptionsType } from '@/app/hooks/useEditQuestion';
import { getParsedQuestionJSON } from '@/components/hooks/getParsedQuestionJSON';
import { TriggerQuestionOption } from '@/app/types/displayLogic';

// Loosely matches the shape QuestionsDocument returns: nullable fields,
// and the array itself may contain null entries (GraphQL nullable list
// items). Add `json` to QuestionsDocument's selection set for this to be
// populated — it isn't currently being queried.
interface RawTriggerQuestion {
  id?: number | null;
  questionText?: string | null;
  displayOrder?: number | null;
  json?: string | null;
}

/**
 * Derives the list of questions this question's Display Logic can trigger
 * off of: questions earlier in the same section that are multiple
 * choice / checkbox type.
 *
 * Takes the already-fetched list of section questions (e.g. from
 * QuestionsDocument, queried once in the page) rather than querying
 * itself — the page owns data fetching, this hook owns shaping it into
 * what the Display Logic UI needs.
 *
 * NOTE: requires `json` to be selected in the QuestionsDocument query —
 * it's used here to determine question type and options, but isn't
 * currently part of that query's selection set.
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
  const triggerQuestions: TriggerQuestionOption[] = useMemo(() => {
    if (!questions) return [];

    return questions
      .filter((q): q is RawTriggerQuestion => q !== null && q.id != null)
      .filter((q) => q.id !== currentQuestionId)
      .filter((q) =>
        currentDisplayOrder === undefined || q.displayOrder == null
          ? true
          : q.displayOrder < currentDisplayOrder
      )
      .map((q) => {
        if (!q.json) return null;

        const { parsed } = getParsedQuestionJSON(q, '', (k: string) => k);

        if (!parsed?.type || !isOptionsType(parsed.type)) return null;
        if (!('options' in parsed) || !Array.isArray(parsed.options)) {
          return null;
        }

        return {
          id: q.id as number,
          questionText: q.questionText ?? '',
          options: parsed.options.map((opt: { value?: string; label?: string }) => ({
            value: opt.value ?? opt.label ?? '',
            label: opt.label ?? opt.value ?? '',
          })),
        } as TriggerQuestionOption;
      })
      .filter((q): q is TriggerQuestionOption => q !== null);
  }, [questions, currentQuestionId, currentDisplayOrder]);

  return { triggerQuestions };
}