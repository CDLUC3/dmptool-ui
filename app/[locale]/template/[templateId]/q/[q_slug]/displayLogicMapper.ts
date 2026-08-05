import { DisplayLogic, DisplayLogicGroup, TriggerQuestionOption } from '@/app/types/displayLogic';
import {
  QuestionConditionActionType,
  QuestionConditionMatchType,
  QuestionConditionCondition,
  SaveQuestionDisplayLogicInput,
  QuestionConditionGroupInput,
  QuestionConditionInput,
  QuestionConditionGroupsQuery
} from '@/generated/graphql';
import logECS from '@/utils/clientLogger';

type FetchedGroup = NonNullable<NonNullable<QuestionConditionGroupsQuery['questionConditionGroups']>[number]>;

// Maps the backend condition enum to the UI's operator type (is / is_not)
const CONDITION_TYPE_TO_OPERATOR: Record<QuestionConditionCondition, 'is' | 'is_not'> = {
  [QuestionConditionCondition.Equal]: 'is',
  [QuestionConditionCondition.Includes]: 'is',
  [QuestionConditionCondition.DoesNotEqual]: 'is_not',
  [QuestionConditionCondition.DoesNotInclude]: 'is_not',
  [QuestionConditionCondition.HasAnswer]: 'is', // not currently produced by the UI; included for exhaustiveness
};

// Reconstructs the UI's DisplayLogic shape from the question's stored
// displayLogicAction/displayLogicMatchType plus the groups returned by questionConditionGroups.
export function fromQuestionConditionGroups(
  displayLogicAction: QuestionConditionActionType,
  displayLogicMatchType: QuestionConditionMatchType,
  groups: FetchedGroup[]
): DisplayLogic | null {
  let action: DisplayLogic['action'];

  // Make sure it's an action we support; if not, log a warning and return null.
  // Returning null will cause the UI to show the "no display logic" state, which is better than crashing or showing a blank screen.
  if (displayLogicAction === QuestionConditionActionType.HideQuestion) {
    action = 'hide';
  } else if (displayLogicAction === QuestionConditionActionType.ShowQuestion) {
    action = 'show';
  } else {
    logECS('warn', 'fromQuestionConditionGroups', {
      error: `Unsupported displayLogicAction: ${displayLogicAction}`,
    });
    return null;
  }

  return {
    action,
    matchType: displayLogicMatchType === QuestionConditionMatchType.All ? 'all' : 'any',
    groups: groups.map((g): DisplayLogicGroup => ({
      id: `group-${g.id}`,
      triggerQuestionId: g.triggerQuestionId,
      conditions: (g.conditions ?? [])
        .filter((c): c is NonNullable<typeof c> => c != null)
        .map((c) => ({
          id: `cond-${c.id}`,
          operator: CONDITION_TYPE_TO_OPERATOR[c.conditionType],
          optionValue: c.conditionMatch ?? '',
        })),
    })),
  };
}

// Map operator + trigger-question value-type to the backend condition enum.
// NOTE: verify these enum member names against generated/graphql.ts — exact
// casing depends on your codegen config.
const OPERATOR_TO_CONDITION_TYPE = {
  single: {
    is: QuestionConditionCondition.Equal,
    is_not: QuestionConditionCondition.DoesNotEqual,
  },
  multi: {
    is: QuestionConditionCondition.Includes,
    is_not: QuestionConditionCondition.DoesNotInclude,
  },
} as const;



/**
 * Converts the display logic to the format expected by the backend. Use triggerQuestions to determine whether
 * to use single-value or multi-value operators for each group.
 * 
 * @param questionId - is for the question being edited
 * @param logic - displayLogic is the "show/hide" and "any/all" logic with the condition groups, made up of trigger question with an array of conditions
 * @param triggerQuestions - triggerQuestions is the list of questions that can be used to trigger the display logic (i.e., options 
// questions in the same section with a lower display order than this question)
 * @returns The graphqlinput object in the format expected by the backend.
 */
export function toSaveInput(
  questionId: number,
  logic: DisplayLogic,
  triggerQuestions: TriggerQuestionOption[]
): SaveQuestionDisplayLogicInput {
  const tqMap = new Map(triggerQuestions.map((q) => [q.id, q]));

  return {
    questionId,
    action: logic.action === 'show'
      ? QuestionConditionActionType.ShowQuestion
      : QuestionConditionActionType.HideQuestion,
    matchType: logic.matchType === 'all'
      ? QuestionConditionMatchType.All
      : QuestionConditionMatchType.Any,
    groups: logic.groups.map((g): QuestionConditionGroupInput => {
      const isMulti = tqMap.get(g.triggerQuestionId)?.isMultiValue ?? false;
      const ops = isMulti ? OPERATOR_TO_CONDITION_TYPE.multi : OPERATOR_TO_CONDITION_TYPE.single;
      return {
        triggerQuestionId: g.triggerQuestionId,
        conditions: g.conditions.map((c): QuestionConditionInput => ({
          conditionType: ops[c.operator],
          conditionMatch: c.optionValue,
        })),
      };
    }),
  };
}