import { CURRENT_SCHEMA_VERSION } from "@dmptool/types";
import type { ResearchOutputTableQuestionType } from "@dmptool/types";
import type { ResearchOutputTable } from "@/app/types";
import type { ResearchOutputRowNavigation } from "@/components/Form/ResearchOutputAnswerComponent";
import { RESEARCH_OUTPUT_QUESTION_TYPE } from "@/lib/constants";
import { questionKey, type PlanQuestionDefinition } from "./model";

export type ResearchOutputAnswerJson = {
  type: typeof RESEARCH_OUTPUT_QUESTION_TYPE;
  columnHeadings: string[];
  answer: ResearchOutputTable[];
  meta: { schemaVersion: string };
};

export function getResearchOutputColumns(
  parsedJson: unknown
): ResearchOutputTableQuestionType["columns"] | null {
  if (!parsedJson || typeof parsedJson !== "object") {
    return null;
  }
  const record = parsedJson as Record<string, unknown>;
  if (record.type !== RESEARCH_OUTPUT_QUESTION_TYPE) {
    return null;
  }
  if (!Array.isArray(record.columns)) {
    return null;
  }
  return record.columns as ResearchOutputTableQuestionType["columns"];
}

export function getResearchOutputRows(answerJson: unknown): ResearchOutputTable[] {
  if (!answerJson || typeof answerJson !== "object") {
    return [];
  }
  const answer = (answerJson as { answer?: unknown }).answer;
  return Array.isArray(answer) ? (answer as ResearchOutputTable[]) : [];
}

export function buildResearchOutputAnswer(
  parsedJson: unknown,
  rows: ResearchOutputTable[]
): ResearchOutputAnswerJson {
  const columns = getResearchOutputColumns(parsedJson) ?? [];
  return {
    type: RESEARCH_OUTPUT_QUESTION_TYPE,
    columnHeadings: columns.map((col) => col.heading),
    answer: rows,
    meta: {
      schemaVersion: CURRENT_SCHEMA_VERSION,
    },
  };
}

/** Row links for a research output question, `rowIndex` being a number or "new"; undefined for other question types. */
export function toResearchOutputRowNavigation(
  question: Pick<PlanQuestionDefinition, "identity" | "questionType">,
  rowHref: (questionKeyValue: string, rowIndex: string) => string
): ResearchOutputRowNavigation | undefined {
  if (question.questionType !== RESEARCH_OUTPUT_QUESTION_TYPE) {
    return undefined;
  }
  const key = questionKey(question.identity);
  return {
    editHref: (rowIndex) => rowHref(key, String(rowIndex)),
    addHref: rowHref(key, "new"),
  };
}

export function parseRowIndexParam(s: string): number | "new" | null {
  if (s === "new") {
    return "new";
  }
  if (!/^\d+$/.test(s)) {
    return null;
  }
  const index = Number(s);
  if (!Number.isInteger(index) || index < 0) {
    return null;
  }
  return index;
}
