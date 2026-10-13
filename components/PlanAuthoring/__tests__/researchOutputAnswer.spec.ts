import { CURRENT_SCHEMA_VERSION } from "@dmptool/types";
import { RESEARCH_OUTPUT_QUESTION_TYPE } from "@/lib/constants";
import { parseQuestionKey } from "../model";
import {
  buildResearchOutputAnswer,
  getResearchOutputColumns,
  getResearchOutputRows,
  parseRowIndexParam,
  toResearchOutputRowNavigation,
} from "../researchOutputAnswer";

describe("parseQuestionKey", () => {
  it("parses base and custom keys", () => {
    expect(parseQuestionKey("base-question-9")).toEqual({
      kind: "base",
      versionedQuestionId: 9,
    });
    expect(parseQuestionKey("custom-question-3")).toEqual({
      kind: "custom",
      customQuestionId: 3,
    });
  });

  it("returns null for unrecognized keys", () => {
    expect(parseQuestionKey("base-section-1")).toBeNull();
    expect(parseQuestionKey("base-question-x")).toBeNull();
    expect(parseQuestionKey("")).toBeNull();
  });
});

describe("researchOutputAnswer helpers", () => {
  const parsedJson = {
    type: RESEARCH_OUTPUT_QUESTION_TYPE,
    columns: [
      {
        heading: "Title",
        commonStandardId: "title",
        content: { type: "text", meta: { schemaVersion: "1.0" }, attributes: {} },
      },
      {
        heading: "Output Type",
        commonStandardId: "type",
        content: {
          type: "selectBox",
          meta: { schemaVersion: "1.0" },
          options: [],
          attributes: {},
        },
      },
    ],
  };

  const rows = [
    {
      columns: [
        {
          type: "text",
          commonStandardId: "title",
          meta: { schemaVersion: "1.0" },
          answer: "Dataset A",
        },
      ],
    },
  ];

  it("reads columns from parsed question JSON", () => {
    expect(getResearchOutputColumns(parsedJson)?.map((c) => c.heading)).toEqual([
      "Title",
      "Output Type",
    ]);
    expect(getResearchOutputColumns({ type: "text" })).toBeNull();
    expect(getResearchOutputColumns(null)).toBeNull();
  });

  it("infers commonStandardId for legacy columns that lack it", () => {
    const legacy = {
      type: RESEARCH_OUTPUT_QUESTION_TYPE,
      columns: [
        { heading: "Title", content: { type: "text" } },
        { heading: "Output Type", content: { type: "selectBox" } },
        { heading: "Initial Access Levels", content: { type: "radioButtons" } },
        { heading: "Where it lives", content: { type: "repositorySearch" } },
        { heading: "Funder notes", content: { type: "text" } },
      ],
    };
    expect(
      getResearchOutputColumns(legacy)?.map((c) => c.commonStandardId)
    ).toEqual(["title", "type", "data_access", "host", "custom"]);
  });

  it("reads rows from answer JSON", () => {
    expect(
      getResearchOutputRows({
        type: RESEARCH_OUTPUT_QUESTION_TYPE,
        answer: rows,
      })
    ).toEqual(rows);
    expect(getResearchOutputRows({ type: RESEARCH_OUTPUT_QUESTION_TYPE })).toEqual(
      []
    );
    expect(getResearchOutputRows(null)).toEqual([]);
  });

  it("builds researchOutputTable answer JSON", () => {
    expect(buildResearchOutputAnswer(parsedJson, rows as never)).toEqual({
      type: RESEARCH_OUTPUT_QUESTION_TYPE,
      columnHeadings: ["Title", "Output Type"],
      answer: rows,
      meta: { schemaVersion: CURRENT_SCHEMA_VERSION },
    });
  });

  it("parses row index route params", () => {
    expect(parseRowIndexParam("new")).toBe("new");
    expect(parseRowIndexParam("0")).toBe(0);
    expect(parseRowIndexParam("12")).toBe(12);
    expect(parseRowIndexParam("-1")).toBeNull();
    expect(parseRowIndexParam("1.5")).toBeNull();
    expect(parseRowIndexParam("abc")).toBeNull();
  });

  const rowHref = (questionKeyValue: string, rowIndex: string) =>
    `/en-US/ro/${questionKeyValue}/${rowIndex}`;

  it("links research output rows by question key and row index", () => {
    const navigation = toResearchOutputRowNavigation(
      {
        identity: { kind: "custom", customQuestionId: 3 },
        questionType: RESEARCH_OUTPUT_QUESTION_TYPE,
      },
      rowHref
    );

    expect(navigation?.addHref).toBe("/en-US/ro/custom-question-3/new");
    expect(navigation?.editHref(4)).toBe("/en-US/ro/custom-question-3/4");
  });

  it("has no row links for other question types", () => {
    expect(
      toResearchOutputRowNavigation(
        { identity: { kind: "base", versionedQuestionId: 9 }, questionType: "text" },
        rowHref
      )
    ).toBeUndefined();
  });
});
