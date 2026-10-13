import { TEXT_QUESTION_TYPE } from "@/lib/constants";

export type PlanAnswerOption = { label: string; value: string };

export function getOptions(
  parsedJson: Record<string, unknown>
): PlanAnswerOption[] {
  const options = parsedJson.options;
  if (!Array.isArray(options)) {
    return [];
  }
  return options
    .map((option) => {
      if (!option || typeof option !== "object") {
        return null;
      }
      const record = option as Record<string, unknown>;
      const label = String(record.label ?? record.text ?? "");
      const value = String(record.value ?? record.label ?? record.text ?? "");
      if (!label || !value) {
        return null;
      }
      return { label, value };
    })
    .filter((option): option is PlanAnswerOption => Boolean(option));
}

export function getAnswerValue(answerJson: unknown): unknown {
  if (!answerJson || typeof answerJson !== "object") {
    return answerJson;
  }
  return (answerJson as { answer?: unknown }).answer;
}

/** Matches Apollo's `FILLED_ANSWER_CHECK`, so progress agrees with the server after a reload. */
export function isFilledAnswer(answerJson: unknown): boolean {
  if (!answerJson || typeof answerJson !== "object" || Array.isArray(answerJson)) {
    return false;
  }
  const { type } = answerJson as { type?: unknown };
  const answer = getAnswerValue(answerJson);
  return !(TEXT_QUESTION_TYPE.includes(String(type)) && (answer == null || answer === ""));
}

const isEmptyAnswerValue = (value: unknown) => value == null || value === "";

/** An empty editor reports `""` where an unanswered question has no answer, so the two count as the same. */
export function isSameAnswer(a: unknown, b: unknown): boolean {
  const valueA = getAnswerValue(a);
  const valueB = getAnswerValue(b);
  const sameValue =
    (isEmptyAnswerValue(valueA) && isEmptyAnswerValue(valueB)) ||
    JSON.stringify(valueA) === JSON.stringify(valueB);
  return sameValue && getAdditionalCommentValue(a) === getAdditionalCommentValue(b);
}

/** Answer-JSON key for the optional "explain your answer" field (legacy contract). */
export const ADDITIONAL_COMMENT_JSON_KEY = "comment" as const;

export function getAdditionalCommentValue(answerJson: unknown): string {
  if (!answerJson || typeof answerJson !== "object") {
    return "";
  }
  const additionalComment = (answerJson as { comment?: unknown }).comment;
  return typeof additionalComment === "string" ? additionalComment : "";
}

export function hasAdditionalCommentKey(answerJson: unknown): boolean {
  return (
    !!answerJson &&
    typeof answerJson === "object" &&
    ADDITIONAL_COMMENT_JSON_KEY in (answerJson as object)
  );
}

export function withAnswer(
  draftAnswer: unknown,
  questionType: string,
  answer: unknown
): unknown {
  const base = { type: questionType, answer };
  return hasAdditionalCommentKey(draftAnswer)
    ? { ...base, [ADDITIONAL_COMMENT_JSON_KEY]: getAdditionalCommentValue(draftAnswer) }
    : base;
}

export function withAdditionalComment(
  answerJson: unknown,
  questionType: string,
  additionalComment: string
): unknown {
  if (answerJson && typeof answerJson === "object") {
    const record = answerJson as Record<string, unknown>;
    return {
      ...record,
      type: typeof record.type === "string" ? record.type : questionType,
      answer: "answer" in record ? record.answer : null,
      [ADDITIONAL_COMMENT_JSON_KEY]: additionalComment,
    };
  }

  return {
    type: questionType,
    answer: getAnswerValue(answerJson) ?? null,
    [ADDITIONAL_COMMENT_JSON_KEY]: additionalComment,
  };
}
