import { DisplayLogic, TriggerQuestionOption } from '@/app/types/displayLogic';


export type BackendAction = 'SHOW_QUESTION' | 'HIDE_QUESTION';
export type BackendMatchType = 'ANY' | 'ALL';
export type BackendConditionType = 'EQUAL' | 'DOES_NOT_EQUAL' | 'INCLUDES' | 'DOES_NOT_INCLUDE';

export interface SaveQuestionConditionInput {
  conditionType: BackendConditionType;
  conditionMatch: string;
  id?: number;
}

export interface SaveQuestionConditionGroupInput {
  triggerQuestionId: number;
  conditions: SaveQuestionConditionInput[];
}

export interface SaveQuestionDisplayLogicInput {
  questionId: number;
  action: BackendAction;
  matchType: BackendMatchType;
  groups: SaveQuestionConditionGroupInput[];
}


const OPERATOR_TO_CONDITION_TYPE = {
  single: { is: 'EQUAL', is_not: 'DOES_NOT_EQUAL' },
  multi: { is: 'INCLUDES', is_not: 'DOES_NOT_INCLUDE' },
} as const;


// Saves the display logic to the backend format, using the trigger questions to
// determine whether to use single-value or multi-value operators for each group
export function toSaveInput(
  questionId: number,
  logic: DisplayLogic,
  triggerQuestions: TriggerQuestionOption[]   // new param
): SaveQuestionDisplayLogicInput {
  const tqMap = new Map(triggerQuestions.map((q) => [q.id, q]));

  return {
    questionId,
    action: logic.action === 'show' ? 'SHOW_QUESTION' : 'HIDE_QUESTION',
    matchType: logic.matchType === 'all' ? 'ALL' : 'ANY',
    groups: logic.groups.map((g) => {
      const isMulti = tqMap.get(g.triggerQuestionId)?.isMultiValue ?? false;
      const ops = isMulti ? OPERATOR_TO_CONDITION_TYPE.multi : OPERATOR_TO_CONDITION_TYPE.single;
      return {
        triggerQuestionId: g.triggerQuestionId,
        conditions: g.conditions.map((c) => ({
          conditionType: ops[c.operator], // maps 'is'/'is_not' to the appropriate backend condition type based on whether the trigger question is multi-value
          conditionMatch: c.optionValue // the value to match against
        })),
      };
    }),
  };
}