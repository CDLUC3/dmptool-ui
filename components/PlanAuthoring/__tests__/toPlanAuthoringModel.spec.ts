import {
  GuidanceSourceType,
  ProjectCollaboratorAccessLevel,
  UserRole,
} from "@/generated/graphql";
import {
  EMPTY_PLAN_AUTHORING_VIEWER,
  toPlanAuthoringModel,
  toPlanAuthoringViewer,
  toStoredAnswerJson,
  type PlanAuthoringPlan,
  type PlanAuthoringQuestion,
  type PlanAuthoringViewer,
} from "../toPlanAuthoringModel";
import {
  makeRawAnswer,
  makeRawComment,
  makeRawGuidanceSource,
  makeRawMe,
  makeRawPlan,
  makeRawQuestion,
  makeRawSection,
} from "../mocks";

const NSF = "https://ror.org/nsf";
const UCOP = "https://ror.org/ucop";

function mapQuestions(
  questions: PlanAuthoringQuestion[],
  viewer: PlanAuthoringViewer = EMPTY_PLAN_AUTHORING_VIEWER,
  plan: Partial<PlanAuthoringPlan> = {}
) {
  const model = toPlanAuthoringModel(
    makeRawPlan({
      ...plan,
      sections: [makeRawSection({ versionedSectionId: 1, questions })],
    }),
    viewer
  );
  return model.sections[0].questions;
}

describe("toPlanAuthoringModel structure", () => {
  it("maps identities and keeps the resolver's section and question order", () => {
    const model = toPlanAuthoringModel(
      makeRawPlan({
        sections: [
          makeRawSection({
            versionedSectionId: 10,
            displayOrder: 1,
            title: "Data",
            introduction: "<p>Intro</p>",
            requirements: "<p>Section req</p>",
            questions: [
              makeRawQuestion({ versionedQuestionId: 100 }),
              makeRawQuestion({ questionType: "CUSTOM", customQuestionId: 200 }),
              makeRawQuestion({ versionedQuestionId: 101 }),
            ],
          }),
          makeRawSection({
            sectionType: "CUSTOM",
            customSectionId: 20,
            displayOrder: 2,
            title: "Custom section",
            questions: [makeRawQuestion({ questionType: "CUSTOM", customQuestionId: 300 })],
          }),
        ],
      }),
      EMPTY_PLAN_AUTHORING_VIEWER
    );

    expect(
      model.sections.map((section) => ({
        identity: section.identity,
        title: section.title,
        introductionHtml: section.introductionHtml,
        requirementsHtml: section.requirementsHtml,
        questions: section.questions.map((question) => question.identity),
      }))
    ).toEqual([
      {
        identity: { kind: "base", versionedSectionId: 10 },
        title: "Data",
        introductionHtml: "<p>Intro</p>",
        requirementsHtml: "<p>Section req</p>",
        questions: [
          { kind: "base", versionedQuestionId: 100 },
          { kind: "custom", customQuestionId: 200 },
          { kind: "base", versionedQuestionId: 101 },
        ],
      },
      {
        identity: { kind: "custom", customSectionId: 20 },
        title: "Custom section",
        introductionHtml: undefined,
        requirementsHtml: undefined,
        questions: [{ kind: "custom", customQuestionId: 300 }],
      },
    ]);
    expect(model.sections[0].questions[1].sectionIdentity).toEqual({ kind: "base", versionedSectionId: 10 });
    expect(model.progress).toEqual({ answeredQuestions: 0, totalQuestions: 4, percentComplete: 0 });
  });

  it("maps sections with null question lists", () => {
    const model = toPlanAuthoringModel(
      makeRawPlan({ sections: [makeRawSection({ requirements: "", questions: null })] }),
      EMPTY_PLAN_AUTHORING_VIEWER
    );

    expect(model.sections.map(({ requirementsHtml, questions }) => ({ requirementsHtml, questions }))).toEqual([
      { requirementsHtml: "", questions: [] },
    ]);
  });

  it("rejects a section whose kind has no id", () => {
    expect(() =>
      toPlanAuthoringModel(
        makeRawPlan({ sections: [{ sectionType: "BASE", customSectionId: 5, displayOrder: 1, title: "x" }] }),
        EMPTY_PLAN_AUTHORING_VIEWER
      )
    ).toThrow("BASE plan section is missing its id");
  });

  it.each([
    [false, true],
    [true, false],
    [null, true],
  ])("readOnly %p gives canEditAnswers %p", (readOnly, expected) => {
    const model = toPlanAuthoringModel(
      makeRawPlan({ readOnly }),
      EMPTY_PLAN_AUTHORING_VIEWER
    );

    expect(model.capabilities.canEditAnswers).toBe(expected);
  });

  it("maps plan header fields and the members label", () => {
    const model = toPlanAuthoringModel(
      makeRawPlan({
        title: "Ocean plan",
        versionedTemplate: { name: "NSF DMP", version: "v3" },
        fundings: [{ projectFunding: { affiliation: { displayName: "National Science Foundation" } } }],
        members: [
          { projectMember: { givenName: "Jennifer", surName: "Frost" }, memberRoles: [{ label: "PI" }, { label: "Contact" }] },
          { projectMember: { givenName: "Amelia", surName: "Snow" }, memberRoles: [] },
        ],
      }),
      { ...EMPTY_PLAN_AUTHORING_VIEWER, affiliationName: "CDL" }
    );

    expect(model).toMatchObject({
      title: "Ocean plan",
      templateName: "NSF DMP",
      templateVersion: "v3",
      funderName: "National Science Foundation",
      affiliationName: "CDL",
      membersLabel: "Jennifer Frost (PI, Contact), Amelia Snow",
    });
  });
});

describe("toPlanAuthoringModel question fields", () => {
  it("maps required, requirement and sample text with their org labels", () => {
    const [withSamples, plain] = mapQuestions(
      [
        makeRawQuestion({
          versionedQuestionId: 1,
          json: '{"type":"textArea"}',
          questionText: "Describe your data",
          required: true,
          requirementText: "<p>Funder requires this</p>",
          useSampleTextAsDefault: true,
          guidanceSources: [
            makeRawGuidanceSource({
              orgURI: NSF,
              type: GuidanceSourceType.TemplateOwner,
              label: "National Science Foundation",
              items: [{ guidanceText: "", sampleText: "<p>Sample</p>" }],
            }),
            makeRawGuidanceSource({
              id: `customization-${UCOP}`,
              orgURI: UCOP,
              type: GuidanceSourceType.UserAffiliation,
              label: "University of California",
              items: [{ guidanceText: "<p>custom</p>", sampleText: "<p>Org sample</p>" }],
            }),
          ],
        }),
        makeRawQuestion({ versionedQuestionId: 2, json: '{"type":"textArea"}' }),
      ],
      EMPTY_PLAN_AUTHORING_VIEWER,
      { versionedTemplate: { name: "NSF", version: "v1", owner: { name: "National Science Foundation", uri: NSF } } }
    );

    expect(withSamples).toMatchObject({
      title: "Describe your data",
      required: true,
      requirementHtml: "<p>Funder requires this</p>",
      requirementOrgLabel: "National Science Foundation",
      sampleText: "<p>Sample</p>",
      useSampleTextAsDefault: true,
      sampleTextOrgLabel: "National Science Foundation",
      customizationSampleText: "<p>Org sample</p>",
      customizationSampleOrgLabel: "University of California",
    });
    expect(plain).toMatchObject({
      title: "",
      required: false,
      requirementHtml: undefined,
      requirementOrgLabel: undefined,
      useSampleTextAsDefault: false,
    });
    expect(plain.customizationSampleText).toBeUndefined();
  });

  it.each([
    [
      "dateRange",
      '{"type":"dateRange","answer":{"start":"2025-05-15","end":"2025-07-05"},"meta":{"schemaVersion":"1.0"},"comment":""}',
      { type: "dateRange", answer: { startDate: "2025-05-15", endDate: "2025-07-05" }, comment: "" },
    ],
    [
      "numberRange",
      '{"type":"numberRange","answer":{"start":2,"end":10},"meta":{"schemaVersion":"1.0"}}',
      { type: "numberRange", answer: { startNumber: 2, endNumber: 10 } },
    ],
    [
      "checkBoxes",
      '{"type":"checkBoxes","answer":["Barbara","Charlie"],"meta":{"schemaVersion":"1.0"},"comment":""}',
      { type: "checkBoxes", answer: ["Barbara", "Charlie"], comment: "" },
    ],
    [
      "boolean",
      '{"type":"boolean","answer":false,"meta":{"schemaVersion":"1.0"}}',
      { type: "boolean", answer: false },
    ],
  ])("parses a stored %s answer into the renderer shape without meta", (type, stored, expected) => {
    const [question] = mapQuestions([
      makeRawQuestion({
        versionedQuestionId: 1,
        json: JSON.stringify({ type }),
        hasAnswer: true,
        answer: { id: 5, json: stored, modified: "1751929006000" },
      }),
    ]);

    expect(question).toMatchObject({ answerJson: expected, hasAnswer: true, lastSavedAt: 1751929006000 });
  });

  it("leaves a question without an answer empty and unanswered", () => {
    const [question] = mapQuestions([makeRawQuestion({ versionedQuestionId: 1, hasAnswer: false })]);

    expect(question).toMatchObject({ answerJson: null, hasAnswer: false, lastSavedAt: undefined, comments: [] });
  });

  it("drops a non-numeric modified time", () => {
    const [question] = mapQuestions([
      makeRawQuestion({
        versionedQuestionId: 1,
        answer: makeRawAnswer("text", "hi", { modified: "yesterday" }),
      }),
    ]);

    expect(question.lastSavedAt).toBeUndefined();
    expect(question.answerJson).toEqual({ type: "text", answer: "hi" });
  });
});

describe("toPlanAuthoringModel guidance", () => {
  const question = makeRawQuestion({
    versionedQuestionId: 1,
    guidanceSources: [
      makeRawGuidanceSource({
        id: "bestPractice",
        orgURI: "bestPractice",
        type: GuidanceSourceType.BestPractice,
        label: "DMP Tool",
        shortName: "DMP Tool",
        items: [{ guidanceText: "<p>a</p>" }, { guidanceText: "<p>b</p>" }],
      }),
      makeRawGuidanceSource({
        orgURI: NSF,
        type: GuidanceSourceType.TemplateOwner,
        label: "NSF",
        shortName: "NSF",
        items: [{ guidanceText: "<p>nsf</p>" }],
      }),
      makeRawGuidanceSource({
        orgURI: UCOP,
        type: GuidanceSourceType.UserAffiliation,
        label: "UCOP",
        shortName: "UCOP",
        items: [{ guidanceText: "<p>tagged</p>" }],
      }),
      makeRawGuidanceSource({ orgURI: "https://ror.org/empty", items: [] }),
      makeRawGuidanceSource({
        id: `customization-${UCOP}`,
        orgURI: UCOP,
        type: GuidanceSourceType.UserAffiliation,
        label: "UCOP",
        shortName: "UCOP",
        items: [{ guidanceText: "<p>custom</p>" }],
      }),
    ],
  });
  const plan = { versionedTemplate: { name: "NSF", version: "v1", owner: { name: "NSF", uri: NSF } } };

  it("keys sources by org URI, merges customization guidance first, drops empty sources and locks always-shown orgs", () => {
    const [mapped] = mapQuestions([question], EMPTY_PLAN_AUTHORING_VIEWER, plan);

    expect(mapped.guidanceSources).toEqual([
      {
        id: "bestPractice",
        type: "BEST_PRACTICE",
        label: "DMP Tool",
        shortName: "DMP Tool",
        locked: false,
        bodyHtml: "<p>a</p><p>b</p>",
      },
      { id: NSF, type: "TEMPLATE_OWNER", label: "NSF", shortName: "NSF", locked: true, bodyHtml: "<p>nsf</p>" },
      {
        id: UCOP,
        type: "USER_AFFILIATION",
        label: "UCOP",
        shortName: "UCOP",
        locked: true,
        bodyHtml: "<p>custom</p><p>tagged</p>",
      },
    ]);
  });

  it("keeps best practice in its own DMP Tool tab when it shares an org with another source", () => {
    const [mapped] = mapQuestions(
      [
        makeRawQuestion({
          guidanceSources: [
            makeRawGuidanceSource({
              id: "bestPractice",
              orgURI: UCOP,
              type: GuidanceSourceType.BestPractice,
              label: "UCOP",
              shortName: "UCOP",
              items: [{ guidanceText: "<p>best practice</p>" }],
            }),
            makeRawGuidanceSource({
              orgURI: UCOP,
              type: GuidanceSourceType.UserAffiliation,
              label: "UCOP",
              shortName: "UCOP",
              items: [{ guidanceText: "<p>own</p>" }],
            }),
          ],
        }),
      ],
      EMPTY_PLAN_AUTHORING_VIEWER,
      plan
    );

    expect(mapped.guidanceSources).toEqual([
      {
        id: "bestPractice",
        type: "BEST_PRACTICE",
        label: "DMP Tool",
        shortName: "DMP Tool",
        locked: false,
        bodyHtml: "<p>best practice</p>",
      },
      {
        id: UCOP,
        type: "USER_AFFILIATION",
        label: "UCOP",
        shortName: "UCOP",
        locked: true,
        bodyHtml: "<p>own</p>",
      },
    ]);
  });

  it("puts each tag name above its tagged guidance", () => {
    const [mapped] = mapQuestions(
      [
        makeRawQuestion({
          guidanceSources: [
            makeRawGuidanceSource({
              orgURI: NSF,
              type: GuidanceSourceType.TemplateOwner,
              items: [
                { title: null, guidanceText: "<p>question</p>" },
                { title: "Data & <Metadata>", guidanceText: "<p>tagged</p>" },
              ],
            }),
          ],
        }),
      ],
      EMPTY_PLAN_AUTHORING_VIEWER,
      plan
    );

    expect(mapped.guidanceSources[0].bodyHtml).toBe(
      "<p>question</p><h5>Data &amp; &lt;Metadata&gt;</h5><p>tagged</p>"
    );
  });

  it("does not lock USER_SELECTED orgs", () => {
    const [mapped] = mapQuestions(
      [
        makeRawQuestion({
          guidanceSources: [
            makeRawGuidanceSource({ orgURI: UCOP, items: [{ guidanceText: "<p>picked</p>" }] }),
          ],
        }),
      ],
      EMPTY_PLAN_AUTHORING_VIEWER,
      plan
    );

    expect(mapped.guidanceSources.map(({ id, locked }) => [id, locked])).toEqual([[UCOP, false]]);
  });

  it("selects always-shown orgs plus every USER_SELECTED org, even without guidance text", () => {
    const model = toPlanAuthoringModel(
      makeRawPlan({
        ...plan,
        availableGuidanceSources: [
          {
            id: "bestPractice",
            type: GuidanceSourceType.BestPractice,
            label: "DMP Tool",
            shortName: "DMP Tool",
            orgURI: "bestPractice",
          },
          {
            id: `affiliation-${NSF}`,
            type: GuidanceSourceType.TemplateOwner,
            label: "NSF",
            shortName: "NSF",
            orgURI: NSF,
          },
          {
            id: "affiliation-https://ror.org/stanford",
            type: GuidanceSourceType.OtherAffiliation,
            label: "Stanford",
            shortName: "Stanford",
            orgURI: "https://ror.org/stanford",
          },
        ],
        sections: [makeRawSection({ questions: [question] })],
      }),
      { ...EMPTY_PLAN_AUTHORING_VIEWER, canCustomizeGuidance: true }
    );

    expect(model.availableGuidanceOrgs).toEqual([
      { id: NSF, label: "NSF", shortName: "NSF" },
      { id: "https://ror.org/stanford", label: "Stanford", shortName: "Stanford" },
      { id: UCOP, label: "UCOP", shortName: "UCOP" },
      {
        id: "https://ror.org/empty",
        label: "https://ror.org/empty",
        shortName: "https://ror.org/empty",
      },
    ]);
    expect(model.selectedGuidanceOrgIds).toEqual([NSF, UCOP, "https://ror.org/empty"]);
    expect(model.capabilities.canCustomizeGuidance).toBe(true);
  });

  it("hides guidance customization until Apollo returns an organization source", () => {
    const viewer = {
      ...EMPTY_PLAN_AUTHORING_VIEWER,
      canCustomizeGuidance: true,
    };
    const withoutSources = toPlanAuthoringModel(makeRawPlan(), viewer);
    const withBestPracticeOnly = toPlanAuthoringModel(
      makeRawPlan({
        availableGuidanceSources: [
          {
            id: "bestPractice",
            type: GuidanceSourceType.BestPractice,
            label: "DMP Tool",
            shortName: "DMP Tool",
            orgURI: UCOP,
          },
        ],
      }),
      viewer
    );

    expect(withoutSources.capabilities.canCustomizeGuidance).toBe(false);
    expect(withBestPracticeOnly.capabilities.canCustomizeGuidance).toBe(false);
  });
});

describe("toPlanAuthoringModel comments", () => {
  const answerWithComments = makeRawQuestion({
    versionedQuestionId: 1,
    answer: makeRawAnswer("text", "hi", {
      id: 10,
      json: '{"type":"text","answer":"hi"}',
      comments: [
        makeRawComment({ id: 5, commentText: "Mine", created: "3000" }),
        makeRawComment({ id: 6, commentText: "Undated", created: null, user: { id: 8, givenName: "Bo" } }),
        { id: null, commentText: "No id, skipped", created: "1" },
      ],
      feedbackComments: [
        makeRawComment({ id: 5, commentText: "Admin note", user: { id: 9, givenName: "Max", surName: "Admin" } }),
      ],
    }),
  });

  const viewer: PlanAuthoringViewer = {
    ...EMPTY_PLAN_AUTHORING_VIEWER,
    currentUserId: 3,
    formatCommentCreated: (created) => `at ${created}`,
  };

  it("merges answer and feedback comments oldest first, undated last, with per-comment actions", () => {
    const [question] = mapQuestions([answerWithComments], viewer);

    expect(question.comments).toEqual([
      {
        id: "feedback-5",
        authorId: 9,
        authorName: "Max Admin",
        createdLabel: "at 1000",
        text: "Admin note",
        isFeedback: true,
        isEdited: false,
        canEdit: false,
        canDelete: false,
      },
      {
        id: "answer-5",
        authorId: 3,
        authorName: "Ann Lee",
        createdLabel: "at 3000",
        text: "Mine",
        isFeedback: false,
        isEdited: false,
        canEdit: true,
        canDelete: true,
      },
      {
        id: "answer-6",
        authorId: 8,
        authorName: "Bo",
        createdLabel: "",
        text: "Undated",
        isFeedback: false,
        isEdited: false,
        canEdit: false,
        canDelete: false,
      },
    ]);
  });

  it("marks a comment edited when modified differs from created", () => {
    const [question] = mapQuestions([
      makeRawQuestion({
        versionedQuestionId: 1,
        answer: makeRawAnswer("text", "hi", {
          comments: [
            makeRawComment({ id: 1, created: "1000", modified: "2000" }),
            makeRawComment({ id: 2, created: "1000", modified: "1000" }),
            makeRawComment({ id: 3, created: "1000", modified: null }),
          ],
        }),
      }),
    ]);

    expect(question.comments.map((comment) => [comment.id, comment.isEdited])).toEqual([
      ["answer-1", true],
      ["answer-2", false],
      ["answer-3", false],
    ]);
  });

  it("lets a moderator delete but not edit other people's comments", () => {
    const [question] = mapQuestions([answerWithComments], { ...viewer, canModerateComments: true });

    expect(question.comments.map((c) => [c.id, c.canEdit, c.canDelete])).toEqual([
      ["feedback-5", false, true],
      ["answer-5", true, true],
      ["answer-6", false, true],
    ]);
  });
});

describe("toPlanAuthoringViewer", () => {
  it("derives the user, guidance access and comment permissions from Me and the plan", () => {
    const viewer = toPlanAuthoringViewer({
      me: makeRawMe({ id: 5, givenName: "Ada", surName: "Lovelace" }),
      plan: makeRawPlan({
        readOnly: false,
        myAccessLevel: ProjectCollaboratorAccessLevel.Edit,
      }),
      locale: "en-US",
    });

    expect(viewer).toMatchObject({
      currentUserId: 5,
      currentUserName: "Ada Lovelace",
      affiliationName: "California Digital Library",
      canCustomizeGuidance: true,
      canComment: true,
      canModerateComments: false,
      newCommentTarget: { kind: "answer" },
    });
  });

  it("targets the open feedback round for an admin", () => {
    const viewer = toPlanAuthoringViewer({
      me: makeRawMe({ id: 8, role: UserRole.Admin }),
      plan: makeRawPlan({
        readOnly: true,
        feedback: [
          { id: 30, requested: "1751900000000", completed: "1751929006000" },
          { id: 31, requested: "1751950000000", completed: null },
        ],
      }),
      locale: "en-US",
    });

    expect(viewer).toMatchObject({
      canComment: true,
      canCustomizeGuidance: false,
      newCommentTarget: { kind: "feedback", planFeedbackId: 31 },
    });
  });

  it("gives an empty viewer when Me is missing", () => {
    expect(toPlanAuthoringViewer({ me: null, plan: null, locale: "en-US" })).toMatchObject({
      currentUserId: 0,
      currentUserName: "",
      affiliationName: "",
      canComment: false,
    });
  });
});

describe("toStoredAnswerJson", () => {
  it.each([
    ["dateRange", { type: "dateRange", answer: { startDate: "2025-05-15", endDate: "2025-07-05" }, comment: "" }],
    ["numberRange", { type: "numberRange", answer: { startNumber: 2, endNumber: 10 } }],
    ["text", { type: "text", answer: "New input value" }],
    [
      "researchOutputTable",
      {
        type: "researchOutputTable",
        columnHeadings: ["Title", "Description"],
        answer: [{ columns: [{ type: "text", answer: "My Dataset", meta: { schemaVersion: "1.0" } }] }],
      },
    ],
  ])("round-trips a %s answer through storage and back", (type, answerJson) => {
    const stored = toStoredAnswerJson({ questionType: type }, answerJson);
    const [question] = mapQuestions([
      makeRawQuestion({
        versionedQuestionId: 1,
        json: JSON.stringify({ type }),
        answer: { id: 5, json: stored },
      }),
    ]);

    expect(JSON.parse(stored).meta).toEqual({ schemaVersion: "1.0" });
    expect(question.answerJson).toEqual(answerJson);
  });

  it("writes ranges as { start, end } and fills a missing bound with null", () => {
    expect(
      JSON.parse(toStoredAnswerJson({ questionType: "dateRange" }, { type: "dateRange", answer: { startDate: "2025-05-15" } }))
    ).toEqual({ type: "dateRange", answer: { start: "2025-05-15", end: null }, meta: { schemaVersion: "1.0" } });
  });

  it("wraps a bare value and always writes the question's type", () => {
    expect(toStoredAnswerJson({ questionType: "boolean" }, false)).toBe(
      '{"answer":false,"type":"boolean","meta":{"schemaVersion":"1.0"}}'
    );
    expect(JSON.parse(toStoredAnswerJson({ questionType: "text" }, { type: "textArea", answer: "x" }))).toEqual({
      type: "text",
      answer: "x",
      meta: { schemaVersion: "1.0" },
    });
  });
});

describe("toPlanAuthoringModel question JSON", () => {
  it("flags only the malformed question and still maps the rest of the plan", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    const [broken, unknownType, missing, valid] = mapQuestions([
      makeRawQuestion({ versionedQuestionId: 1, json: "{not json" }),
      makeRawQuestion({ versionedQuestionId: 2, json: '{"type":"nope"}' }),
      makeRawQuestion({ versionedQuestionId: 3, json: null }),
      makeRawQuestion({
        versionedQuestionId: 4,
        json: '{"type":"text"}',
        answer: { id: 40, json: '{"type":"text","answer":"hi"}', modified: "1758800000000" },
      }),
    ]);

    expect(broken).toMatchObject({ jsonError: "parseFailed", parsedJson: {}, questionType: "" });
    expect(unknownType).toMatchObject({ jsonError: "unexpectedFormat", parsedJson: {} });
    expect(missing).toMatchObject({ jsonError: "missing", parsedJson: {} });
    expect(valid.jsonError).toBeUndefined();
    expect(valid).toMatchObject({
      questionType: "text",
      answerJson: { type: "text", answer: "hi" },
      lastSavedAt: 1758800000000,
    });
  });

  it("treats an unparseable answer as empty and logs it", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    const [question] = mapQuestions([
      makeRawQuestion({ versionedQuestionId: 1, answer: { id: 10, json: "{broken" } }),
    ]);

    expect(question.answerJson).toBeNull();
    expect(question.jsonError).toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to parse plan answer JSON",
      expect.any(SyntaxError)
    );
  });
});

describe("toPlanAuthoringModel display logic", () => {
  it("maps isHidden, defaulting to visible", () => {
    const [hidden, shown, unset] = mapQuestions([
      makeRawQuestion({ versionedQuestionId: 1, isHidden: true }),
      makeRawQuestion({ versionedQuestionId: 2, isHidden: false }),
      makeRawQuestion({ versionedQuestionId: 3 }),
    ]);

    expect(hidden.isHidden).toBe(true);
    expect(shown.isHidden).toBe(false);
    expect(unset.isHidden).toBe(false);
  });
});
