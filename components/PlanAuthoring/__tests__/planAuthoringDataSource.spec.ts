import type { ApolloClient } from "@apollo/client";
import {
  AddAnswerCommentDocument,
  AddAnswerDocument,
  AddFeedbackCommentDocument,
  AddPlanGuidanceDocument,
  GuidanceSourceType,
  ManagedAffiliationsWithGuidanceDocument,
  PlanAuthoringDocument,
  ProjectCollaboratorAccessLevel,
  RemoveAnswerCommentDocument,
  RemoveFeedbackCommentDocument,
  RemovePlanGuidanceDocument,
  UpdateAnswerCommentDocument,
  UpdateAnswerDocument,
  UpdateFeedbackCommentDocument,
  UserRole,
} from "@/generated/graphql";
import type { PlanAuthoringDataSource } from "../dataSource";
import { questionKey } from "../model";
import { createPlanAuthoringDataSource } from "../planAuthoringDataSource";
import type {
  PlanAuthoringMe,
  PlanAuthoringPlan,
  PlanAuthoringQuestion,
} from "../toPlanAuthoringModel";
import {
  MOCK_LOAD_ERROR,
  createFakePlanAuthoringClient,
  makeRawAnswer,
  makeRawComment,
  makeRawGuidanceSource,
  makeRawMe,
  makeRawPlan,
  makeRawQuestion,
  makeRawSection,
  type FakePlanAuthoringOptions,
} from "../mocks";

type MutateResult = Awaited<ReturnType<ApolloClient["mutate"]>>;

const NOW = 1758800000000;
const UCOP = "https://ror.org/ucop";
const CDL = "https://ror.org/cdl";

const ANSWERED_TEXT: PlanAuthoringQuestion = makeRawQuestion({
  questionText: "What data will you collect?",
  hasAnswer: true,
  guidanceSources: [
    makeRawGuidanceSource({ orgURI: UCOP, label: "UCOP", items: [{ guidanceText: "<p>old</p>" }] }),
  ],
  answer: makeRawAnswer("text", "old answer", {
    id: 500,
    comments: [makeRawComment()],
    feedbackComments: [
      makeRawComment({ commentText: "Admin note", created: "2000", user: { id: 9, givenName: "Max", surName: "Admin" } }),
    ],
  }),
});

function makePlan(overrides: Partial<PlanAuthoringQuestion> = {}): PlanAuthoringPlan {
  return makeRawPlan({
    planCreator: { affiliation: { uri: UCOP } },
    project: {
      collaborators: [{ accessLevel: ProjectCollaboratorAccessLevel.Comment, user: { id: 3 } }],
    },
    feedback: [{ id: 44, completed: null }],
    sections: [
      makeRawSection({
        questions: [
          { ...ANSWERED_TEXT, ...overrides },
          makeRawQuestion({ versionedQuestionId: 101, json: '{"type":"dateRange"}' }),
          makeRawQuestion({ questionType: "CUSTOM" }),
        ],
      }),
      makeRawSection({
        sectionType: "CUSTOM",
        displayOrder: 2,
        questions: [makeRawQuestion({ questionType: "CUSTOM", customQuestionId: 300 })],
      }),
    ],
  });
}

const ME: PlanAuthoringMe = makeRawMe({ id: 3, givenName: "Ann", surName: "Lee" });
const ADMIN: PlanAuthoringMe = makeRawMe({
  id: 8,
  role: UserRole.Admin,
  affiliation: { ...makeRawMe().affiliation!, uri: UCOP },
});

const GUIDANCE_ORGS = [
  { uri: CDL, displayName: "California Digital Library", displayAbbreviation: "CDL", guidanceText: "<p>new</p>" },
  { uri: UCOP, displayName: "UC Office of the President", displayAbbreviation: "UCOP", guidanceText: "<p>old</p>" },
];

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Each fake operation resolves on a timer, so let a few rounds run.
async function flush() {
  for (let round = 0; round < 5; round += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

function setup(options: FakePlanAuthoringOptions = {}) {
  const client = createFakePlanAuthoringClient({
    plan: makePlan(),
    me: ME,
    guidanceOrgs: GUIDANCE_ORGS,
    ...options,
  });
  const realQuery = client.query.bind(client);
  const realMutate = client.mutate.bind(client);
  const query = jest.spyOn(client, "query");
  const mutate = jest.spyOn(client, "mutate");
  const dataSource = createPlanAuthoringDataSource({ client, planId: 7, locale: "en-US" });
  return { client, query, mutate, realQuery, realMutate, dataSource };
}

async function setupReady(options?: FakePlanAuthoringOptions) {
  const context = setup(options);
  await flush();
  expect(context.dataSource.getState().status).toBe("ready");
  return context;
}

function modelOf(dataSource: PlanAuthoringDataSource) {
  const state = dataSource.getState();
  if (state.status !== "ready") {
    throw new Error(`Expected ready state, got ${state.status}`);
  }
  return state.model;
}

function questionOf(dataSource: PlanAuthoringDataSource, key: string) {
  const question = modelOf(dataSource)
    .sections.flatMap((section) => section.questions)
    .find((item) => questionKey(item.identity) === key);
  if (!question) {
    throw new Error(`No question ${key}`);
  }
  return question;
}

function mutationsOf(mutate: jest.SpyInstance) {
  return mutate.mock.calls.map(([options]) => [options.mutation, options.variables]);
}

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(NOW);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("planAuthoringDataSource loading", () => {
  it("loads the plan and the viewer, maps them to ready and notifies subscribers", async () => {
    const { dataSource, query } = setup();
    const listener = jest.fn();
    dataSource.subscribe(listener);

    expect(dataSource.getState()).toEqual({ status: "loading" });
    await flush();

    expect(listener).toHaveBeenCalledTimes(1);
    const model = modelOf(dataSource);
    expect(model.title).toBe("Ocean plan");
    expect(model.currentUserName).toBe("Ann Lee");
    expect(model.capabilities.canComment).toBe(true);
    expect(model.progress).toEqual({ answeredQuestions: 1, totalQuestions: 4, percentComplete: 25 });
    expect(
      model.sections.map((section) => section.questions.map((q) => questionKey(q.identity)))
    ).toEqual([
      ["base-question-100", "base-question-101", "custom-question-200"],
      ["custom-question-300"],
    ]);
    expect(query).toHaveBeenCalledWith({
      query: PlanAuthoringDocument,
      variables: { planId: 7 },
      fetchPolicy: "network-only",
    });
  });

  it("moves to the error state when the plan query fails and logs it", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const { dataSource } = setup({ loadFails: true });
    await flush();

    expect(dataSource.getState()).toEqual({
      status: "error",
      message: expect.stringContaining(MOCK_LOAD_ERROR),
    });
    expect(consoleError).toHaveBeenCalledWith("Failed to load plan authoring data", expect.any(Error));
  });

  it("moves to the error state when the plan is null", async () => {
    const { dataSource } = setup({ plan: null });
    await flush();

    expect(dataSource.getState()).toEqual({ status: "error", message: "Plan not found." });
  });

  it("ignores a stale load that settles after a newer reload", async () => {
    const { dataSource, query, realQuery } = await setupReady();
    const first = deferred<unknown>();
    const second = deferred<unknown>();
    const pending = [first, second];
    query.mockImplementation(((options: Parameters<ApolloClient["query"]>[0]) =>
      options.query === PlanAuthoringDocument
        ? pending.shift()!.promise
        : realQuery(options)) as ApolloClient["query"]);

    dataSource.reload();
    dataSource.reload();
    second.resolve({ data: { plan: { ...makePlan(), title: "Newest" } } });
    await flush();
    first.resolve({ data: { plan: { ...makePlan(), title: "Stale" } } });
    await flush();

    expect(modelOf(dataSource).title).toBe("Newest");
  });
});

describe("planAuthoringDataSource saveAnswer", () => {
  it.each([
    [
      "base section / base question",
      "base-question-101",
      { planId: 7, versionedSectionId: 10, versionedQuestionId: 101 },
    ],
    [
      "base section / custom question",
      "custom-question-200",
      { planId: 7, versionedSectionId: 10, versionedCustomQuestionId: 200 },
    ],
    [
      "custom section / custom question",
      "custom-question-300",
      { planId: 7, versionedCustomSectionId: 20, versionedCustomQuestionId: 300 },
    ],
  ])("adds a first answer for a %s with the matching ids", async (_label, key, target) => {
    const { dataSource, mutate } = await setupReady();

    await expect(dataSource.saveAnswer(key, { type: "text", answer: "first" })).resolves.toEqual({ kind: "saved" });

    expect(mutationsOf(mutate)).toEqual([[AddAnswerDocument, { ...target, json: expect.any(String) }]]);
  });

  it("updates with the id the add returned on the next save, without a second add", async () => {
    const { dataSource, mutate } = await setupReady();

    await dataSource.saveAnswer("custom-question-300", { type: "text", answer: "first" });
    await dataSource.saveAnswer("custom-question-300", { type: "text", answer: "second" });

    const [, [document, variables]] = mutationsOf(mutate);
    expect(mutate).toHaveBeenCalledTimes(2);
    expect(document).toBe(UpdateAnswerDocument);
    expect(variables).toEqual({
      answerId: expect.any(Number),
      json: '{"type":"text","answer":"second","meta":{"schemaVersion":"1.0"}}',
    });
  });

  it("adds again after a failed add, because no answer id came back", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const { dataSource, mutate } = await setupReady({ failSaveOnce: true });

    await expect(
      dataSource.saveAnswer("custom-question-300", { type: "text", answer: "a" })
    ).resolves.toMatchObject({ kind: "failed" });
    await dataSource.saveAnswer("custom-question-300", { type: "text", answer: "b" });

    expect(mutationsOf(mutate).map(([document]) => document)).toEqual([AddAnswerDocument, AddAnswerDocument]);
    expect(consoleError).toHaveBeenCalledWith("Failed to save plan answer", expect.any(Error));
  });

  it("updates an existing answer with the stored JSON shape the old page wrote", async () => {
    const { dataSource, mutate } = await setupReady();

    await dataSource.saveAnswer("base-question-100", { type: "text", answer: "New input value" });

    expect(mutationsOf(mutate)).toEqual([
      [UpdateAnswerDocument, { answerId: 500, json: '{"type":"text","answer":"New input value","meta":{"schemaVersion":"1.0"}}' }],
    ]);
  });

  it("stores date ranges as { start, end }", async () => {
    const { dataSource, mutate } = await setupReady();

    await dataSource.saveAnswer("base-question-101", {
      type: "dateRange",
      answer: { startDate: "2025-05-15", endDate: "2025-07-05" },
      comment: "",
    });

    const [[, variables]] = mutationsOf(mutate);
    expect(JSON.parse(variables.json)).toEqual({
      type: "dateRange",
      answer: { start: "2025-05-15", end: "2025-07-05" },
      comment: "",
      meta: { schemaVersion: "1.0" },
    });
  });

  it("maps update field errors to invalid and leaves the model alone", async () => {
    const { dataSource, mutate } = await setupReady();
    const response: MutateResult = {
      data: {
        updateAnswer: {
          errors: {
            general: "The answer is not in the proper format.",
            versionedQuestionId: "versionedQuestionId already exists",
            json: null,
          },
        },
      },
    };
    mutate.mockResolvedValueOnce(response);

    await expect(dataSource.saveAnswer("base-question-100", { type: "text", answer: "x" })).resolves.toEqual({
      kind: "invalid",
      messages: ["The answer is not in the proper format.", "versionedQuestionId already exists"],
    });
    expect(questionOf(dataSource, "base-question-100").answerJson).toEqual({ type: "text", answer: "old answer" });
  });

  it("maps add field errors to invalid and adds again on the next save", async () => {
    const { dataSource, mutate } = await setupReady();
    const response: MutateResult = {
      data: { addAnswer: { id: null, errors: { general: "Unable to create the answer.", json: null } } },
    };
    mutate.mockResolvedValueOnce(response);

    await expect(dataSource.saveAnswer("custom-question-300", { type: "text", answer: "x" })).resolves.toEqual({
      kind: "invalid",
      messages: ["Unable to create the answer."],
    });
    await dataSource.saveAnswer("custom-question-300", { type: "text", answer: "y" });

    expect(mutationsOf(mutate).map(([document]) => document)).toEqual([AddAnswerDocument, AddAnswerDocument]);
  });

  it("fails for an unknown question key", async () => {
    const { dataSource } = await setupReady();

    await expect(dataSource.saveAnswer("base-question-999", "x")).resolves.toEqual({
      kind: "failed",
      message: "Question not found.",
    });
  });

  it("stores the exact saved object, recomputes progress and notifies subscribers", async () => {
    const { dataSource } = await setupReady();
    const listener = jest.fn();
    dataSource.subscribe(listener);
    const answer = { type: "dateRange", answer: { startDate: "2025-05-15", endDate: "2025-07-05" } };

    await dataSource.saveAnswer("base-question-101", answer);

    const saved = questionOf(dataSource, "base-question-101");
    expect(saved.answerJson).toBe(answer);
    expect(saved.hasAnswer).toBe(true);
    expect(saved.lastSavedAt).toBe(String(NOW));
    expect(modelOf(dataSource).progress).toEqual({ answeredQuestions: 2, totalQuestions: 4, percentComplete: 50 });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("planAuthoringDataSource comments", () => {
  it("adds an answer comment with the answer id and appends it to the question", async () => {
    const { dataSource, mutate } = await setupReady();

    const comment = await dataSource.addComment("base-question-100", "Looks good");

    expect(comment).toMatchObject({
      authorId: 3,
      authorName: "Ann Lee",
      text: "Looks good",
      isFeedback: false,
      canEdit: true,
      canDelete: true,
    });
    expect(mutationsOf(mutate)).toEqual([[AddAnswerCommentDocument, { answerId: 500, commentText: "Looks good" }]]);
    expect(questionOf(dataSource, "base-question-100").comments.map((c) => c.id)).toEqual([
      "answer-1",
      "feedback-1",
      comment.id,
    ]);
  });

  it("adds a feedback comment when an org admin comments during an open feedback round", async () => {
    const { dataSource, mutate } = await setupReady({ me: ADMIN });

    const comment = await dataSource.addComment("base-question-100", "Admin says");

    expect(mutationsOf(mutate)).toEqual([
      [AddFeedbackCommentDocument, { planId: 7, planFeedbackId: 44, answerId: 500, commentText: "Admin says" }],
    ]);
    expect(comment).toMatchObject({ isFeedback: true, text: "Admin says" });
  });

  it("uses the answer id from a first save when adding a comment", async () => {
    const { dataSource, mutate } = await setupReady();

    await expect(dataSource.addComment("custom-question-300", "Nice")).rejects.toThrow(
      "Save an answer before commenting."
    );
    await dataSource.saveAnswer("custom-question-300", { type: "text", answer: "now answered" });
    await dataSource.addComment("custom-question-300", "Nice");

    const [[, added], [, commented]] = mutationsOf(mutate);
    expect(commented).toEqual({ answerId: expect.any(Number), commentText: "Nice" });
    expect(added).toMatchObject({ versionedCustomQuestionId: 300 });
  });

  it("rejects an add with the payload's field errors and keeps the comments unchanged", async () => {
    const { dataSource, mutate } = await setupReady();
    const response: MutateResult = {
      data: { addAnswerComment: { id: 5, errors: { general: "Too long", commentText: null } } },
    };
    mutate.mockResolvedValueOnce(response);

    await expect(dataSource.addComment("base-question-100", "x")).rejects.toThrow("Too long");
    expect(questionOf(dataSource, "base-question-100").comments.map((c) => c.id)).toEqual(["answer-1", "feedback-1"]);
  });

  it("edits answer and feedback comments through their own mutations", async () => {
    const { dataSource, mutate } = await setupReady();

    const answerComment = await dataSource.updateComment("base-question-100", "answer-1", "Expanded");
    const feedbackComment = await dataSource.updateComment("base-question-100", "feedback-1", "Revised note");

    expect(mutationsOf(mutate)).toEqual([
      [UpdateAnswerCommentDocument, { answerId: 500, answerCommentId: 1, commentText: "Expanded" }],
      [UpdateFeedbackCommentDocument, { planId: 7, planFeedbackCommentId: 1, commentText: "Revised note" }],
    ]);
    expect(answerComment).toMatchObject({ id: "answer-1", text: "Expanded", isEdited: true, canEdit: true });
    expect(feedbackComment).toMatchObject({ id: "feedback-1", text: "Revised note", isFeedback: true, isEdited: true });
  });

  it("deletes answer and feedback comments and drops them from the model", async () => {
    const { dataSource, mutate } = await setupReady();

    await dataSource.deleteComment("base-question-100", "answer-1");
    await dataSource.deleteComment("base-question-100", "feedback-1");

    expect(mutationsOf(mutate)).toEqual([
      [RemoveAnswerCommentDocument, { answerId: 500, answerCommentId: 1 }],
      [RemoveFeedbackCommentDocument, { planId: 7, planFeedbackCommentId: 1 }],
    ]);
    expect(questionOf(dataSource, "base-question-100").comments).toEqual([]);
    await expect(dataSource.deleteComment("base-question-100", "answer-1")).rejects.toThrow("Comment not found.");
  });

  it("keeps a comment whose delete failed", async () => {
    const { dataSource, mutate } = await setupReady();
    mutate.mockRejectedValueOnce(new Error("Not allowed"));

    await expect(dataSource.deleteComment("base-question-100", "answer-1")).rejects.toThrow("Not allowed");
    expect(questionOf(dataSource, "base-question-100").comments.map((c) => c.id)).toEqual(["answer-1", "feedback-1"]);
  });
});

describe("planAuthoringDataSource guidance", () => {
  it("adds and removes the changed orgs, then refreshes only guidance", async () => {
    const { dataSource, mutate } = await setupReady();
    const localAnswer = { type: "text", answer: "saved locally" };
    await dataSource.saveAnswer("base-question-100", localAnswer);
    mutate.mockClear();

    await expect(dataSource.setSelectedGuidanceOrgs([CDL])).resolves.toEqual([CDL]);

    expect(mutationsOf(mutate)).toEqual([
      [AddPlanGuidanceDocument, { planId: 7, affiliationId: CDL }],
      [RemovePlanGuidanceDocument, { planId: 7, affiliationId: UCOP }],
    ]);
    const question = questionOf(dataSource, "base-question-100");
    expect(question.guidanceSources).toMatchObject([{ id: CDL, bodyHtml: "<p>new</p>" }]);
    expect(question.answerJson).toBe(localAnswer);
    expect(modelOf(dataSource).selectedGuidanceOrgIds).toEqual([CDL]);
  });

  it("still refreshes after a partial failure, then rejects with the failure", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const { dataSource, mutate, realMutate } = await setupReady();
    mutate.mockImplementation(((options: Parameters<ApolloClient["mutate"]>[0]) =>
      options.mutation === AddPlanGuidanceDocument
        ? Promise.reject(new Error("Unable to add organization"))
        : realMutate(options)) as ApolloClient["mutate"]);

    await expect(dataSource.setSelectedGuidanceOrgs([CDL])).rejects.toThrow("Unable to add organization");

    expect(modelOf(dataSource).selectedGuidanceOrgIds).toEqual([]);
    expect(questionOf(dataSource, "base-question-100").guidanceSources).toEqual([]);
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to update plan guidance sources",
      new Error("Unable to add organization")
    );
  });

  it("searches orgs with the trimmed lowercase term and the template id", async () => {
    const { dataSource, query } = await setupReady();
    query.mockClear();

    await expect(dataSource.searchGuidanceOrgs("  CDL ")).resolves.toEqual([
      { id: CDL, label: "California Digital Library", shortName: "CDL", orgURI: CDL },
    ]);
    expect(query).toHaveBeenCalledWith({
      query: ManagedAffiliationsWithGuidanceDocument,
      variables: {
        name: "cdl",
        versionedTemplateId: 55,
        paginationOptions: { type: "CURSOR", limit: 20 },
      },
    });
    await expect(dataSource.searchGuidanceOrgs("   ")).resolves.toEqual([]);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("keeps best practice guidance out of the plan's selectable orgs", async () => {
    const { dataSource } = await setupReady({
      plan: makePlan({
        guidanceSources: [
          makeRawGuidanceSource({
            id: "bestPractice",
            orgURI: "bestPractice",
            type: GuidanceSourceType.BestPractice,
            items: [{ guidanceText: "<p>bp</p>" }],
          }),
        ],
      }),
    });

    expect(questionOf(dataSource, "base-question-100").guidanceSources).toMatchObject([{ id: "bestPractice" }]);
    expect(modelOf(dataSource).selectedGuidanceOrgIds).toEqual([]);
  });
});
