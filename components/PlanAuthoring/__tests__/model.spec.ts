import {
  computeProgress,
  questionKey,
  sectionKey,
  type PlanSectionDefinition,
} from "../model";

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
        displayOrder: 1,
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
            displayOrder: 1,
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
            displayOrder: 2,
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
});
