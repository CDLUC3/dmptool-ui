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
  matchType: 'any' | 'all';
  groups: DisplayLogicGroup[];
}

export interface TriggerQuestionOption {
  id: number;
  questionText: string;
  questionType: string;       // e.g. 'radioButtons' | 'checkBoxes' | 'selectBox'
  isMultiValue: boolean;      // true for checkbox-type questions
  options: { value: string; label: string }[];
}