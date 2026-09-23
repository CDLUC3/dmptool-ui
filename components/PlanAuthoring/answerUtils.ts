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
