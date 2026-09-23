import {
  buildSampleAnswerDraft,
  getPlanSampleAnswers,
  resolveInitialAnswer,
} from "../sampleAnswers";
import type { PlanQuestionDefinition } from "../model";

function baseQuestion(
  overrides: Partial<PlanQuestionDefinition> = {}
): PlanQuestionDefinition {
  return {
    identity: { kind: "base", versionedQuestionId: 1 },
    sectionIdentity: { kind: "base", versionedSectionId: 1 },
    title: "Sample question",
    required: false,
    questionType: "textArea",
    parsedJson: { type: "textArea" },
    answerJson: null,
    hasAnswer: false,
    guidanceSources: [],
    comments: [],
    displayOrder: 1,
    ...overrides,
  };
}

describe("getPlanSampleAnswers", () => {
  it("returns an empty list when both sample strings are missing or blank", () => {
    expect(getPlanSampleAnswers(baseQuestion())).toEqual([]);
    expect(
      getPlanSampleAnswers(
        baseQuestion({ sampleText: "   ", customizationSampleText: "\n" })
      )
    ).toEqual([]);
  });

  it("returns only the base sample when customization is empty", () => {
    expect(
      getPlanSampleAnswers(
        baseQuestion({
          sampleText: "<p>Funder sample</p>",
          sampleTextOrgLabel: "NSF",
          customizationSampleText: "  ",
        })
      )
    ).toEqual([
      {
        id: "base",
        orgLabel: "NSF",
        html: "<p>Funder sample</p>",
      },
    ]);
  });

  it("returns base then customization when both are non-empty", () => {
    expect(
      getPlanSampleAnswers(
        baseQuestion({
          sampleText: "<p>Base</p>",
          customizationSampleText: "<p>Custom</p>",
          sampleTextOrgLabel: "NSF",
          customizationSampleOrgLabel: "UC Irvine",
        })
      )
    ).toEqual([
      { id: "base", orgLabel: "NSF", html: "<p>Base</p>" },
      {
        id: "customization",
        orgLabel: "UC Irvine",
        html: "<p>Custom</p>",
      },
    ]);
  });

  it("defaults missing org labels to empty strings", () => {
    expect(
      getPlanSampleAnswers(
        baseQuestion({
          sampleText: "<p>Only base</p>",
        })
      )
    ).toEqual([{ id: "base", orgLabel: "", html: "<p>Only base</p>" }]);
  });
});

describe("buildSampleAnswerDraft", () => {
  it("sets type and answer from the sample HTML", () => {
    expect(buildSampleAnswerDraft("textArea", "<p>Used</p>", null)).toEqual({
      type: "textArea",
      answer: "<p>Used</p>",
    });
  });

  it("preserves the additional-comment key when present on the draft", () => {
    expect(
      buildSampleAnswerDraft("textArea", "<p>Used</p>", {
        type: "textArea",
        answer: "<p>Old</p>",
        comment: "keep me",
      })
    ).toEqual({
      type: "textArea",
      answer: "<p>Used</p>",
      comment: "keep me",
    });
  });

  it("does not invent a comment key when the draft has none", () => {
    expect(
      buildSampleAnswerDraft("textArea", "<p>Used</p>", {
        type: "textArea",
        answer: "<p>Old</p>",
      })
    ).toEqual({
      type: "textArea",
      answer: "<p>Used</p>",
    });
  });
});

describe("resolveInitialAnswer", () => {
  it("returns answerJson when it is already set", () => {
    const answerJson = { type: "textArea", answer: "<p>Saved</p>" };
    expect(
      resolveInitialAnswer(
        baseQuestion({
          answerJson,
          useSampleTextAsDefault: true,
          sampleText: "<p>Sample</p>",
        })
      )
    ).toBe(answerJson);
  });

  it("prefills from sampleText when useSampleTextAsDefault is true and answerJson is null", () => {
    expect(
      resolveInitialAnswer(
        baseQuestion({
          answerJson: null,
          useSampleTextAsDefault: true,
          sampleText: "<p>Default sample</p>",
          questionType: "textArea",
        })
      )
    ).toEqual({
      type: "textArea",
      answer: "<p>Default sample</p>",
    });
  });

  it("returns null when answerJson is null and defaulting is off", () => {
    expect(
      resolveInitialAnswer(
        baseQuestion({
          answerJson: null,
          useSampleTextAsDefault: false,
          sampleText: "<p>Sample</p>",
        })
      )
    ).toBeNull();
  });

  it("returns null when defaulting is on but sampleText is missing", () => {
    expect(
      resolveInitialAnswer(
        baseQuestion({
          answerJson: null,
          useSampleTextAsDefault: true,
          sampleText: null,
        })
      )
    ).toBeNull();
  });
});
