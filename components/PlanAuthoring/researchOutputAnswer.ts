import { CURRENT_SCHEMA_VERSION, ResearchOutputTableColumnsEnum } from "@dmptool/types";
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

type ResearchOutputColumn = ResearchOutputTableQuestionType["columns"][number];
type ResearchOutputColumnId = ResearchOutputColumn["commonStandardId"];

const COLUMN_IDS: ReadonlySet<string> = new Set(ResearchOutputTableColumnsEnum.options);

function isColumnId(value: unknown): value is ResearchOutputColumnId {
  return typeof value === "string" && COLUMN_IDS.has(value);
}

const LEGACY_HEADING_COLUMN_IDS: Record<string, ResearchOutputColumnId> = {
  "output type": "type",
  "data flags": "data_flags",
  "access level": "data_access",
  "initial access levels": "data_access",
  "anticipated release date": "issued",
  "byte size": "byte_size",
  "anticipated file size": "byte_size",
  repositories: "host",
  "repository(ies)": "host",
  "metadata standards": "metadata",
  "metadata standard(s)": "metadata",
  license: "license_ref",
  licenses: "license_ref",
};

const LEGACY_CONTENT_TYPE_COLUMN_IDS: Record<string, ResearchOutputColumnId> = {
  repositorySearch: "host",
  metadataStandardSearch: "metadata",
  licenseSearch: "license_ref",
};

/** Older templates stored research output columns without `commonStandardId`. */
function inferColumnId(column: ResearchOutputColumn): ResearchOutputColumnId {
  const raw = column as { commonStandardId?: unknown; heading?: unknown; content?: { type?: unknown } };
  if (isColumnId(raw.commonStandardId)) {
    return raw.commonStandardId;
  }
  const heading = typeof raw.heading === "string" ? raw.heading.trim().toLowerCase() : "";
  if (isColumnId(heading)) {
    return heading;
  }
  const contentType = typeof raw.content?.type === "string" ? raw.content.type : "";
  return (
    LEGACY_HEADING_COLUMN_IDS[heading] ??
    LEGACY_CONTENT_TYPE_COLUMN_IDS[contentType] ??
    "custom"
  );
}

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
  return (record.columns as ResearchOutputColumn[]).map((column) => {
    const commonStandardId = inferColumnId(column);
    return column.commonStandardId === commonStandardId
      ? column
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- each column variant pins a literal commonStandardId, so the spread can't be narrowed
      : ({ ...column, commonStandardId } as ResearchOutputColumn);
  });
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
