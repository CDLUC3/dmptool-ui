'use client'

import {
  Question,
} from '@/app/types';
import { QuestionTypeMap } from '@dmptool/types';
import logECS from '@/utils/clientLogger';

type ParsedQuestionResult<T extends keyof QuestionTypeMap = keyof QuestionTypeMap> = {
  parsed: QuestionTypeMap[T] | null;
  error?: string;
};

// Type guard to check if parsed object has valid question type
/*eslint-disable @typescript-eslint/no-explicit-any */
export const isValidQuestionType = (obj: any): obj is QuestionTypeMap[keyof QuestionTypeMap] => {
  return obj &&
    typeof obj === 'object' &&
    'type' in obj &&
    typeof obj.type === 'string' &&
    obj.type in ({
      text: true,
      textArea: true,
      radioButtons: true,
      checkBoxes: true,
      selectBox: true,
      boolean: true,
      url: true,
      currency: true,
      date: true,
      dateRange: true,
      email: true,
      filteredSearch: true,
      number: true,
      numberRange: true,
      table: true,
      affiliationSearch: true,
      multiselectBox: true,
      researchOutputTable: true
    } as const);
};

/*eslint-disable @typescript-eslint/no-explicit-any */
export const getParsedQuestionJSON = (
  question: Question | null,
  path: string,
  t: any
): ParsedQuestionResult => {
  if (!question?.json) {
    return { parsed: null, error: t('messaging.errors.invalidQuestionType') };
  }

  const { json: source } = question;

  // Handle string JSON
  if (typeof source === 'string') {
    try {
      const parsed = JSON.parse(source);
      if (!isValidQuestionType(parsed)) {
        logECS('error', 'getParsedQuestionJSON: Invalid question type', {
          questionType: parsed?.type,
          url: { path }
        });
        return { parsed: null, error: t('messaging.errors.questionUnexpectedFormat') };
      }
      return { parsed };
    } catch (err) {
      logECS('error', 'getParsedQuestionJSON: JSON parse failed', {
        error: err,
        url: { path }
      });
      return { parsed: null, error: t('messaging.errors.questionJSONFParseFailed') };
    }
  }

  // Handle object JSON
  if (isValidQuestionType(source)) {
    return { parsed: source };
  }

  // Log unexpected format
  /*eslint-disable @typescript-eslint/no-explicit-any */
  logECS('error', 'getParsedQuestionJSON: Unexpected format', {
    error: `Invalid question format. Expected valid question type, got: ${(source as any)?.type || typeof source}`,
    url: { path }
  });

  return { parsed: null, error: "error" };
};
