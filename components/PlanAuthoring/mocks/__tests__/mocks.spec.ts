import type { PlanAuthoringDataSource } from "../../dataSource";
import { questionKey } from "../../model";
import {
  createMockDataSource,
  createScenarioDataSource,
  makeModel,
  MOCK_COMMENTS_ERROR,
  MOCK_GUIDANCE_ERROR,
  MOCK_INVALID_JSON_QUESTION_KEY,
  MOCK_LOAD_ERROR,
  MOCK_PLAN_DOCUMENT,
  MOCK_SAVE_ERROR,
  scenarios,
} from "..";

const RADIO_KEY = "base-question-101";
const STEWARD_KEY = "base-question-201";
const HANDOVER_KEY = "base-question-202";
const NSF = "https://ror.org/021nxhr62";
const CDL = "https://ror.org/03yrm5c26";
const STANFORD = "https://ror.org/00f54p054";
const UCB = "https://ror.org/01an7q238";

function modelOf(dataSource: PlanAuthoringDataSource) {
  const state = dataSource.getState();
  if (state.status !== "ready") {
    throw new Error(`Expected ready state, got ${state.status}`);
  }
  return state.model;
}

function questionOf(dataSource: PlanAuthoringDataSource, key: string) {
  return modelOf(dataSource)
    .sections.flatMap((section) => section.questions)
    .find((question) => questionKey(question.identity) === key);
}

// Each fake operation resolves on a timer, so let a few rounds run.
async function flush() {
  for (let round = 0; round < 5; round += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

async function readyScenario(...args: Parameters<typeof createScenarioDataSource>) {
  const dataSource = createScenarioDataSource(...args);
  await flush();
  return dataSource;
}

describe("mockPlan through the real GraphQL data source", () => {
  it("has one valid question of every supported type", async () => {
    const questions = modelOf(await readyScenario("editable")).sections.flatMap(
      (section) => section.questions
    );

    expect(questions.map((question) => question.questionType).sort()).toEqual([
      "boolean",
      "checkBoxes",
      "currency",
      "date",
      "dateRange",
      "email",
      "multiselectBox",
      "number",
      "numberRange",
      "radioButtons",
      "selectBox",
      "text",
      "textArea",
      "textArea",
      "url",
    ]);
    expect(questions.filter((question) => question.jsonError)).toEqual([]);
  });

  it("covers comments, guidance, samples, members and ranges", async () => {
    const dataSource = await readyScenario("editable");
    const model = modelOf(dataSource);
    const radio = questionOf(dataSource, RADIO_KEY);

    expect(radio?.comments.map((comment) => [comment.id, comment.createdLabel])).toEqual([
      ["answer-1", "2 days ago"],
      ["feedback-2", "yesterday"],
      ["answer-3", "4 hours ago"],
    ]);
    expect(radio?.guidanceSources.map(({ id, type, locked }) => [id, type, locked])).toEqual([
      ["bestPractice", "BEST_PRACTICE", false],
      [NSF, "TEMPLATE_OWNER", true],
      [CDL, "USER_AFFILIATION", false],
      [STANFORD, "USER_SELECTED", false],
    ]);
    expect(questionOf(dataSource, STEWARD_KEY)).toMatchObject({
      customizationSampleText: expect.stringContaining("At CDL"),
      customizationSampleOrgLabel: "California Digital Library",
    });
    expect(questionOf(dataSource, HANDOVER_KEY)).toMatchObject({
      useSampleTextAsDefault: true,
      hasAnswer: false,
    });
    expect(
      model.sections
        .flatMap((section) => section.questions)
        .find((question) => question.questionType === "dateRange")?.answerJson
    ).toMatchObject({ answer: { startDate: "2026-05-15", endDate: "2026-07-05" } });
    expect(model).toMatchObject({
      membersLabel: "Jennifer Frost (PI), Amelia Snow (Other)",
      affiliationName: "University of California CDL",
      currentUserName: "Style Guide User",
      selectedGuidanceOrgIds: [NSF, CDL, STANFORD],
      progress: { answeredQuestions: 6, totalQuestions: 15, percentComplete: 40 },
      capabilities: {
        canEditAnswers: true,
        canComment: true,
        canModerateComments: true,
        canCustomizeGuidance: true,
      },
    });
  });
});

describe("fake plan authoring API", () => {
  it("persists saves, so a reload shows them", async () => {
    const dataSource = await readyScenario("editable");

    await expect(dataSource.saveAnswer(HANDOVER_KEY, { type: "textArea", answer: "<p>x</p>" })).resolves.toEqual({
      kind: "saved",
    });
    dataSource.reload();
    await flush();

    expect(questionOf(dataSource, HANDOVER_KEY)).toMatchObject({
      answerJson: { type: "textArea", answer: "<p>x</p>" },
      hasAnswer: true,
    });
  });

  it("fails the first save only with failSaveOnce", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const dataSource = await readyScenario("saveFails");

    await expect(dataSource.saveAnswer(RADIO_KEY, "a")).resolves.toEqual({
      kind: "failed",
      message: expect.stringContaining(MOCK_SAVE_ERROR),
    });
    await expect(dataSource.saveAnswer(RADIO_KEY, "a")).resolves.toEqual({ kind: "saved" });
    consoleError.mockRestore();
  });

  it("adds, edits and deletes comments", async () => {
    const dataSource = await readyScenario("editable");

    const added = await dataSource.addComment(RADIO_KEY, "New note");
    expect(added).toMatchObject({ authorId: 101, authorName: "Style Guide User", text: "New note", canEdit: true });
    await expect(dataSource.updateComment(RADIO_KEY, added.id, "Edited")).resolves.toMatchObject({
      text: "Edited",
      isEdited: true,
    });
    dataSource.reload();
    await flush();
    expect(
      questionOf(dataSource, RADIO_KEY)?.comments.find((comment) => comment.text === "Edited")
    ).toMatchObject({ isEdited: true });
    const reloadedId = questionOf(dataSource, RADIO_KEY)?.comments.find(
      (comment) => comment.text === "Edited"
    )?.id;
    await dataSource.deleteComment(RADIO_KEY, reloadedId ?? added.id);
    dataSource.reload();
    await flush();

    expect(questionOf(dataSource, RADIO_KEY)?.comments.map((comment) => comment.id)).toEqual([
      "answer-1",
      "feedback-2",
      "answer-3",
    ]);
  });

  it("rejects comment mutations with commentsFail", async () => {
    const dataSource = await readyScenario("editable", { commentsFail: true });

    await expect(dataSource.addComment(RADIO_KEY, "x")).rejects.toThrow(MOCK_COMMENTS_ERROR);
    await expect(dataSource.updateComment(RADIO_KEY, "answer-1", "x")).rejects.toThrow(MOCK_COMMENTS_ERROR);
  });

  it("searches orgs and adds or removes their guidance", async () => {
    const dataSource = await readyScenario("editable");

    await expect(dataSource.searchGuidanceOrgs("ucb")).resolves.toEqual([
      { id: UCB, label: "UC Berkeley", shortName: "UCB", orgURI: UCB },
    ]);
    await expect(dataSource.setSelectedGuidanceOrgs([NSF, CDL, UCB])).resolves.toEqual([NSF, CDL, UCB]);

    expect(questionOf(dataSource, RADIO_KEY)?.guidanceSources.map((source) => source.id)).toEqual([
      "bestPractice",
      NSF,
      CDL,
      UCB,
    ]);
  });

  it("rejects guidance calls with guidanceFail", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const dataSource = await readyScenario("editable", { guidanceFail: true });

    await expect(dataSource.searchGuidanceOrgs("x")).rejects.toThrow(MOCK_GUIDANCE_ERROR);
    await expect(dataSource.setSelectedGuidanceOrgs([])).rejects.toThrow(MOCK_GUIDANCE_ERROR);
    consoleError.mockRestore();
  });
});

describe("scenarios", () => {
  it("readOnly takes edit access away", async () => {
    expect(modelOf(await readyScenario("readOnly")).capabilities).toMatchObject({
      canEditAnswers: false,
      canCustomizeGuidance: false,
    });
  });

  it("invalidJson breaks exactly one question", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const questions = modelOf(await readyScenario("invalidJson")).sections.flatMap((section) => section.questions);

    expect(
      questions.filter((question) => question.jsonError).map((question) => questionKey(question.identity))
    ).toEqual([MOCK_INVALID_JSON_QUESTION_KEY]);
    consoleError.mockRestore();
  });

  it("emptyPlan has no sections", async () => {
    expect(modelOf(await readyScenario("emptyPlan")).sections).toEqual([]);
  });

  it("loadError loads and reloads into the error state", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const dataSource = await readyScenario("loadError");
    const errorState = { status: "error", message: expect.stringContaining(MOCK_LOAD_ERROR) };
    expect(dataSource.getState()).toEqual(errorState);

    dataSource.reload();
    expect(dataSource.getState()).toEqual({ status: "loading" });
    await flush();
    expect(dataSource.getState()).toEqual(errorState);
    consoleError.mockRestore();
  });

  it("documentVariant carries the document props", () => {
    expect(scenarios.documentVariant().props).toEqual({ variant: "document", planDocument: MOCK_PLAN_DOCUMENT });
  });
});

describe("createMockDataSource", () => {
  const KEY = "base-question-11";

  it("saves into the model, recomputes progress and notifies", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1758800000000);
    const dataSource = createMockDataSource();
    const listener = jest.fn();
    dataSource.subscribe(listener);

    await dataSource.saveAnswer("custom-question-21", { type: "text", answer: "x" });

    expect(questionOf(dataSource, "custom-question-21")).toMatchObject({ hasAnswer: true, lastSavedAt: "1758800000000" });
    expect(modelOf(dataSource).progress.answeredQuestions).toBe(2);
    expect(listener).toHaveBeenCalledTimes(1);
    jest.restoreAllMocks();
  });

  it("returns a forced saveResult or the one-off failure without touching the model", async () => {
    await expect(
      createMockDataSource({ saveResult: { kind: "invalid", messages: ["Bad"] } }).saveAnswer(KEY, "x")
    ).resolves.toEqual({ kind: "invalid", messages: ["Bad"] });
    await expect(createMockDataSource({ failSaveOnce: true }).saveAnswer(KEY, "x")).resolves.toEqual({
      kind: "failed",
      message: MOCK_SAVE_ERROR,
    });
  });

  it("rejects comment and guidance calls when asked to", async () => {
    await expect(createMockDataSource({ commentsFail: true }).loadComments(KEY)).rejects.toThrow(MOCK_COMMENTS_ERROR);
    await expect(createMockDataSource({ guidanceFail: true }).loadGuidance(KEY)).rejects.toThrow(MOCK_GUIDANCE_ERROR);
  });

  it("starts from initialState, reloads back to its model and accepts setState", async () => {
    const dataSource = createMockDataSource({ initialState: { status: "loading" } });
    await expect(dataSource.saveAnswer(KEY, "x")).resolves.toEqual({ kind: "failed", message: "Question not found." });

    dataSource.setState({ status: "ready", model: makeModel({ title: "Pinned" }) });
    expect(modelOf(dataSource).title).toBe("Pinned");
    dataSource.reload();
    await Promise.resolve();
    expect(modelOf(dataSource).title).toBe("Ocean Currents DMP");
  });
});
