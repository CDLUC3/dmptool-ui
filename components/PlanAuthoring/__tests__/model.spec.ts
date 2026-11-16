import { GuidanceSourceType } from "@/generated/graphql";
import {
  collectLockedGuidanceOrgIds,
  computeProgress,
  questionKey,
  sectionKey,
  visibleQuestions,
  type PlanSectionDefinition,
} from "../model";
import { makeQuestion, makeSection } from "../mocks";

describe("PlanAuthoring model helpers", () => {
  it("keeps base and custom identity keys distinct", () => {
    expect(sectionKey({ kind: "base", versionedSectionId: 4 })).toBe(
      "base-section-4"
    );
    expect(sectionKey({ kind: "custom", customSectionId: 4 })).toBe(
      "custom-section-4"
    );
    expect(questionKey({ kind: "base", versionedQuestionId: 9 })).toBe(
      "base-question-9"
    );
    expect(questionKey({ kind: "custom", customQuestionId: 9 })).toBe(
      "custom-question-9"
    );
  });

  it("computes progress from answered questions", () => {
    const sections: PlanSectionDefinition[] = [
      {
        identity: { kind: "base", versionedSectionId: 1 },
        title: "One",
        questions: [
          {
            identity: { kind: "base", versionedQuestionId: 1 },
            sectionIdentity: { kind: "base", versionedSectionId: 1 },
            title: "A",
            required: true,
            questionType: "text",
            parsedJson: { type: "text" },
            answerJson: { type: "text", answer: "yes" },
            hasAnswer: true,
            guidanceSources: [],
            comments: [],
          },
          {
            identity: { kind: "base", versionedQuestionId: 2 },
            sectionIdentity: { kind: "base", versionedSectionId: 1 },
            title: "B",
            required: false,
            questionType: "text",
            parsedJson: { type: "text" },
            answerJson: null,
            hasAnswer: false,
            guidanceSources: [],
            comments: [],
          },
        ],
      },
    ];

    expect(computeProgress(sections)).toEqual({
      answeredQuestions: 1,
      totalQuestions: 2,
      percentComplete: 50,
    });
  });

  it("collects unique locked guidance org ids", () => {
    const sections: PlanSectionDefinition[] = [
      {
        identity: { kind: "base", versionedSectionId: 1 },
        title: "One",
        questions: [
          {
            identity: { kind: "base", versionedQuestionId: 1 },
            sectionIdentity: { kind: "base", versionedSectionId: 1 },
            title: "A",
            required: true,
            questionType: "text",
            parsedJson: { type: "text" },
            answerJson: null,
            hasAnswer: false,
            guidanceSources: [
              {
                id: "nih",
                type: GuidanceSourceType.TemplateOwner,
                label: "NIH",
                shortName: "NIH",
                locked: true,
                bodyHtml: "<p>Locked</p>",
              },
              {
                id: "uci",
                type: GuidanceSourceType.UserAffiliation,
                label: "UCI",
                shortName: "UCI",
                locked: false,
                bodyHtml: "<p>Optional</p>",
              },
            ],
            comments: [],
          },
          {
            identity: { kind: "base", versionedQuestionId: 2 },
            sectionIdentity: { kind: "base", versionedSectionId: 1 },
            title: "B",
            required: false,
            questionType: "text",
            parsedJson: { type: "text" },
            answerJson: null,
            hasAnswer: false,
            guidanceSources: [
              {
                id: "nih",
                type: GuidanceSourceType.TemplateOwner,
                label: "NIH",
                shortName: "NIH",
                locked: true,
                bodyHtml: "<p>Locked again</p>",
              },
              {
                id: "stanford",
                type: GuidanceSourceType.UserSelected,
                label: "Stanford",
                shortName: "SU",
                locked: true,
                bodyHtml: "<p>Also locked</p>",
              },
            ],
            comments: [],
          },
        ],
      },
    ];

    expect(collectLockedGuidanceOrgIds(sections).sort()).toEqual([
      "nih",
      "stanford",
    ]);
  });

  it("leaves hidden questions out of the visible questions and the progress", () => {
    const shown = makeQuestion({ identity: { kind: "base", versionedQuestionId: 1 }, hasAnswer: true });
    const hiddenAnswered = makeQuestion({
      identity: { kind: "base", versionedQuestionId: 2 },
      hasAnswer: true,
      isHidden: true,
    });
    const hiddenUnanswered = makeQuestion({ identity: { kind: "base", versionedQuestionId: 3 }, isHidden: true });
    const section = makeSection({ questions: [shown, hiddenAnswered, hiddenUnanswered] });

    expect(visibleQuestions(section)).toEqual([shown]);
    expect(computeProgress([section])).toEqual({ answeredQuestions: 1, totalQuestions: 1, percentComplete: 100 });
  });
});
