
import { QuestionTypeMap } from "@dmptool/types";

// Define the type for the options in json.options
export interface QuestionOption {
  label: string;
  value: string;
  selected?: boolean;
  checked?: boolean;
}

export type UpdateQuestionErrors = {
  general?: string;
  questionText?: string;
  json?: string;
}

export type RemoveQuestionErrors = {
  general?: string;
  guidanceText?: string;
  json?: string;
  questionText?: string;
  requirementText?: string;
  sampleText?: string;
}

export type AnyParsedQuestion = QuestionTypeMap[keyof QuestionTypeMap];