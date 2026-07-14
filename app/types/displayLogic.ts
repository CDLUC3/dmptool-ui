// Display Logic types
// ---------------------------------------------------------------------------
// ASSUMPTION: these don't exist yet in @/app/types. Merge them in there,
// or import this file directly — whichever fits your project layout better.

export type DisplayLogicAction = 'show' | 'hide';
export type DisplayLogicMatchType = 'any' | 'all';
export type DisplayLogicOperator = 'is' | 'is_not';

export interface DisplayLogicCondition {
  id: string;
  operator: DisplayLogicOperator;
  // The `value` of the trigger question's option this condition checks
  // against (matches QuestionOption.value from your existing types).
  optionValue: string;
}

export interface DisplayLogic {
  action: DisplayLogicAction;
  matchType: DisplayLogicMatchType;
  triggerQuestionId: number | null;
  conditions: DisplayLogicCondition[];
}

// A trimmed-down shape of a "candidate trigger question" — i.e. a prior
// multiple-choice/checkbox question in the same section/template that this
// question's display logic can be based on.
export interface TriggerQuestionOption {
  id: number;
  questionText: string;
  options: { value: string; label: string }[];
}