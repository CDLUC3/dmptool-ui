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
