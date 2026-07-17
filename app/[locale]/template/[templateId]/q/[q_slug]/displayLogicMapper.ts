import { DisplayLogic } from '@/app/types/displayLogic';


export type BackendAction = 'SHOW_QUESTION' | 'HIDE_QUESTION';
export type BackendMatchType = 'ANY' | 'ALL';
export type BackendConditionType = 'EQUAL' | 'DOES_NOT_EQUAL';

export interface SaveQuestionConditionInput {
  conditionType: BackendConditionType;
  target: string;
  id?: number; // optional for save input; present in fetched data
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

// What the query for an existing question's display logic returns —
// same shape as the save input, plus the real DB ids.
export interface FetchedQuestionDisplayLogic extends SaveQuestionDisplayLogicInput {
  id: number;
  groups: (SaveQuestionConditionGroupInput & {
    id: number;
    conditions: (SaveQuestionConditionInput & { id: number })[];
  })[];
}

const OPERATOR_TO_CONDITION_TYPE: Record<string, BackendConditionType> = {
  is: 'EQUAL',
  is_not: 'DOES_NOT_EQUAL',
};
const CONDITION_TYPE_TO_OPERATOR: Record<BackendConditionType, 'is' | 'is_not'> = {
  EQUAL: 'is',
  DOES_NOT_EQUAL: 'is_not',
};

// UI state -> save payload for handleSaveDisplayLogic.
export function toSaveInput(questionId: number, logic: DisplayLogic): SaveQuestionDisplayLogicInput {
  return {
    questionId,
    action: logic.action === 'show' ? 'SHOW_QUESTION' : 'HIDE_QUESTION',
    matchType: logic.matchType === 'all' ? 'ALL' : 'ANY',
    groups: logic.groups.map((g) => ({
      triggerQuestionId: g.triggerQuestionId,
      conditions: g.conditions.map((c) => ({
        conditionType: OPERATOR_TO_CONDITION_TYPE[c.operator] ?? 'EQUAL',
        target: c.optionValue,
      })),
    })),
  };
}

// Fetched/persisted data -> UI state, for hydrating the DisplayLogicComponent
// on load. DB ids are stringified into the local `id` fields the UI uses
// for React keys and lookups; they're otherwise not round-tripped back to
// the server (a save always replaces groups/conditions wholesale — see
// resolvers/saveQuestionDisplayLogic.ts).
export function fromFetched(fetched: FetchedQuestionDisplayLogic | null): DisplayLogic | null {
  if (!fetched) return null;

  return {
    action: fetched.action === 'SHOW_QUESTION' ? 'show' : 'hide',
    matchType: fetched.matchType === 'ALL' ? 'all' : 'any',
    groups: fetched.groups.map((g) => ({
      id: `group-${g.id}`,
      triggerQuestionId: g.triggerQuestionId,
      conditions: g.conditions.map((c) => ({
        id: `cond-${c.id}`,
        operator: (CONDITION_TYPE_TO_OPERATOR[c.conditionType] ?? 'is') as 'is' | 'is_not',
        optionValue: c.target,
      })),
    })),
  };
}