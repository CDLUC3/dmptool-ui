import { CURRENT_SCHEMA_VERSION } from "@dmptool/types";
import type { ResearchOutputTableQuestionType } from "@dmptool/types";
import type { ResearchOutputTable } from "@/app/types";
import { RESEARCH_OUTPUT_QUESTION_TYPE } from "@/lib/constants";

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
