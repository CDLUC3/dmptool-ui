import { OPTIONS_QUESTION_TYPES } from '@/lib/constants';

// Configure what overrides you want to apply to the question type json objects
export const getOverrides = (questionType: string | null | undefined) => {
  switch (questionType) {
    case "text":
      return { maxLength: null };
    case "textArea":
      return { maxLength: null, rows: 20 };
    case "number":
      return { min: 0, max: 10000000, step: 1 };
    case "url":
      return { maxLength: 2048, minLength: 2, pattern: "https?://.+" };
    default:
      return {};
  }
};

// Check if question is an options type
export const isOptionsType = (questionType: string) => {
  return Boolean(questionType && OPTIONS_QUESTION_TYPES.includes(questionType));
}