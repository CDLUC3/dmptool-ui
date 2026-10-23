// The same rules as displayLogic in @dmptool/utils, which the API applies to plans. That
// package can't be imported here: its only entry point also loads server-only code.

interface PreviewDisplayLogicCondition {
  conditionType: string;
  conditionMatch?: string | null;
}

interface PreviewDisplayLogicGroup {
  /** Null when the trigger question isn't in the template; it is then treated as unanswered. */
  triggerQuestionId: number | null;
  conditions: PreviewDisplayLogicCondition[];
}

export interface PreviewDisplayLogic {
  action?: string | null;
  matchType?: string | null;
  groups: PreviewDisplayLogicGroup[];
}

/** The selected option values of an option-based answer; other answer types can't be triggers. */
function extractAnswerValues(answerJson: unknown): string[] {
  let json: unknown = answerJson;
  if (typeof answerJson === "string") {
    try {
      json = JSON.parse(answerJson);
    } catch {
      return [];
    }
  }
  if (!json || typeof json !== "object") {
    return [];
  }
  const { type, answer } = json as { type?: unknown; answer?: unknown };
  switch (type) {
    case "radioButtons":
    case "selectBox":
      return typeof answer === "string" && answer !== "" ? [answer] : [];
    case "checkBoxes":
    case "multiselectBox":
      return Array.isArray(answer)
        ? answer.filter((value): value is string => typeof value === "string" && value !== "")
        : [];
    default:
      return [];
  }
}

function evaluateCondition(condition: PreviewDisplayLogicCondition, values: string[]): boolean {
  const match = condition.conditionMatch ?? "";
  switch (condition.conditionType) {
    case "EQUAL":
    case "INCLUDES":
      return values.includes(match);
    case "DOES_NOT_EQUAL":
    case "DOES_NOT_INCLUDE":
      return !values.includes(match);
    default:
      return false;
  }
}

function isQuestionVisible(
  logic: PreviewDisplayLogic | undefined,
  answerValues: Map<number, string[]>,
  hiddenQuestionIds: Set<number> = new Set()
): boolean {
  if (!logic || logic.groups.length === 0) {
    return true;
  }
  if (logic.action !== "SHOW_QUESTION" && logic.action !== "HIDE_QUESTION") {
    return true;
  }
  const matchesAll = logic.matchType === "ALL";
  const groupResults = logic.groups.map((group) => {
    const triggerId = group.triggerQuestionId;
    const values =
      triggerId != null && !hiddenQuestionIds.has(triggerId) ? answerValues.get(triggerId) ?? [] : [];
    const conditionMatches = group.conditions.map((condition) => evaluateCondition(condition, values));
    return {
      answered: values.length > 0,
      matched:
        values.length > 0 &&
        (matchesAll ? conditionMatches.every(Boolean) : conditionMatches.some(Boolean)),
    };
  });
  const anyUnanswered = groupResults.some((result) => !result.answered);

  let matched: boolean;
  if (matchesAll) {
    if (anyUnanswered) {
      return true;
    }
    matched = groupResults.every((result) => result.matched);
  } else {
    matched = groupResults.some((result) => result.matched);
    if (!matched && anyUnanswered) {
      return true;
    }
  }
  return logic.action === "SHOW_QUESTION" ? matched : !matched;
}

/**
 * @param orderedQuestionIds in display order; trigger questions always come before the
 * questions that depend on them
 */
export function findHiddenQuestionIds(
  orderedQuestionIds: number[],
  logicByQuestionId: Map<number, PreviewDisplayLogic>,
  answersByQuestionId: Map<number, unknown>
): Set<number> {
  const hidden = new Set<number>();
  if (logicByQuestionId.size === 0) {
    return hidden;
  }
  const answerValues = new Map<number, string[]>();
  for (const [questionId, answer] of answersByQuestionId) {
    answerValues.set(questionId, extractAnswerValues(answer));
  }
  for (const questionId of orderedQuestionIds) {
    if (!isQuestionVisible(logicByQuestionId.get(questionId), answerValues, hidden)) {
      hidden.add(questionId);
    }
  }
  return hidden;
}
