// Display Logic types
// ---------------------------------------------------------------------------
// ASSUMPTION: these don't exist yet in @/app/types. Merge them in there,
// or import this file directly — whichever fits your project layout better.

export type DisplayLogicAction = 'show' | 'hide';
export type DisplayLogicMatchType = 'any' | 'all';
export type DisplayLogicOperator = 'is' | 'is_not';

export interface DisplayLogicCondition {
  id: string;
  operator: 'is' | 'is_not';
  optionValue: string;
}

export interface DisplayLogicGroup {
  id: string;
  triggerQuestionId: number;
  conditions: DisplayLogicCondition[];
}

export interface DisplayLogic {
  action: 'show' | 'hide';
  matchType: 'any' | 'all'; // combines the groups below
  groups: DisplayLogicGroup[];
}

export interface TriggerQuestionOption {
  id: number;
  questionText: string;
  options: { label: string; value: string }[];
}