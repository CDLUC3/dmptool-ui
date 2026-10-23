import { CombinedGraphQLErrors } from "@apollo/client";
import { computeProgress, type PlanAuthoringModel, type PlanQuestionDefinition } from "@/components/PlanAuthoring/model";
import { createLoadedPreviewDataSource } from "../createLoadedPreviewDataSource";
import { PreviewNotFoundError } from "../previewError";
import { PREVIEW_CAPABILITIES } from "../previewModel";

function question(id: number, choices?: string[]): PlanQuestionDefinition {
  return {
    identity: { kind: "base", versionedQuestionId: id },
    sectionIdentity: { kind: "base", versionedSectionId: 1 },
    title: `Q${id}`,
    required: false,
    questionType: choices ? "radioButtons" : "text",
    parsedJson: choices
      ? { type: "radioButtons", options: choices.map((value) => ({ label: value, value })) }
      : { type: "text" },
    answerJson: null,
    hasAnswer: false,
    guidanceSources: [],
    comments: [],
  };
}

function model(questions: PlanQuestionDefinition[]): PlanAuthoringModel {
  const sections = [{ identity: { kind: "base" as const, versionedSectionId: 1 }, title: "Data", questions }];
  return {
    title: "NSF DMP",
    templateName: "NSF DMP",
    affiliationName: "",
    templateVersion: "v1",
    funderName: "",
    membersLabel: "",
    progress: computeProgress(sections),
    capabilities: PREVIEW_CAPABILITIES,
    sections,
    availableGuidanceOrgs: [],
    selectedGuidanceOrgIds: [],
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function loaded(load = jest.fn().mockResolvedValue({ model: model([question(10), question(11)]) })) {
  const dataSource = createLoadedPreviewDataSource(load);
  dataSource.subscribe(() => {});
  await flush();
  return dataSource;
}

describe("createLoadedPreviewDataSource", () => {
  it("doesn't load until something subscribes, and loads once", () => {
    const load = jest.fn().mockResolvedValue({ model: model([]) });
    const dataSource = createLoadedPreviewDataSource(load);

    expect(load).not.toHaveBeenCalled();
    expect(dataSource.getState()).toEqual({ status: "loading" });
    dataSource.subscribe(() => {});
    dataSource.subscribe(() => {});
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("reports failures by kind", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const forbidden = new CombinedGraphQLErrors({ errors: [{ message: "No", extensions: { code: "FORBIDDEN" } }] });

    const notFound = await loaded(jest.fn().mockRejectedValue(new PreviewNotFoundError()));
    const denied = await loaded(jest.fn().mockRejectedValue(forbidden));
    const failed = await loaded(jest.fn().mockRejectedValue(new Error("Network down")));

    expect(notFound.getState()).toEqual({ status: "error", message: "notFound" });
    expect(denied.getState()).toEqual({ status: "error", message: "forbidden" });
    expect(failed.getState()).toEqual({ status: "error", message: "failed" });
  });

  it("reloads after a failure", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const load = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network down"))
      .mockResolvedValue({ model: model([question(10)]) });
    const dataSource = await loaded(load);

    dataSource.reload();
    expect(dataSource.getState()).toEqual({ status: "loading" });
    await flush();

    expect(dataSource.getState().status).toBe("ready");
  });

  it("keeps answers in memory and updates progress", async () => {
    const dataSource = await loaded();
    const listener = jest.fn();
    dataSource.subscribe(listener);

    const result = await dataSource.saveAnswer("base-question-10", { type: "text", answer: "My answer" });

    expect(result).toEqual({ kind: "saved" });
    expect(listener).toHaveBeenCalled();
    const state = dataSource.getState();
    if (state.status !== "ready") throw new Error("expected ready state");
    expect(state.model.sections[0].questions[0]).toMatchObject({
      answerJson: { type: "text", answer: "My answer" },
      hasAnswer: true,
    });
    expect(state.model.progress).toEqual({ answeredQuestions: 1, totalQuestions: 2, percentComplete: 50 });
  });

  it("fails to save an unknown question", async () => {
    const dataSource = await loaded();

    await expect(dataSource.saveAnswer("base-question-999", { answer: "x" })).resolves.toEqual({
      kind: "failed",
      message: "Question not found.",
    });
  });

  it("doesn't support comments or choosing guidance", async () => {
    const dataSource = await loaded();

    await expect(dataSource.addComment("base-question-10", "Hi")).rejects.toThrow();
    await expect(dataSource.searchGuidanceOrgs("nsf")).resolves.toEqual([]);
    await expect(dataSource.setSelectedGuidanceOrgs(["x"])).resolves.toEqual([]);
  });

  it("hides questions by display logic only while it's turned on", async () => {
    const load = jest.fn().mockResolvedValue({
      model: model([question(10, ["yes", "no"]), question(11)]),
      displayLogic: new Map([
        [
          11,
          {
            action: "SHOW_QUESTION",
            matchType: "ALL",
            groups: [{ triggerQuestionId: 10, conditions: [{ conditionType: "EQUAL", conditionMatch: "yes" }] }],
          },
        ],
      ]),
    });
    const dataSource = await loaded(load);
    const isHidden = () => {
      const state = dataSource.getState();
      return state.status === "ready" ? Boolean(state.model.sections[0].questions[1].isHidden) : undefined;
    };
    await dataSource.saveAnswer("base-question-10", { type: "radioButtons", answer: "no" });

    expect(dataSource.hasDisplayLogic()).toBe(true);
    expect(isHidden()).toBe(false);

    dataSource.setDisplayLogicApplied(true);
    expect(isHidden()).toBe(true);

    await dataSource.saveAnswer("base-question-10", { type: "radioButtons", answer: "yes" });
    expect(isHidden()).toBe(false);

    await dataSource.saveAnswer("base-question-10", { type: "radioButtons", answer: "no" });
    dataSource.setDisplayLogicApplied(false);
    expect(isHidden()).toBe(false);
  });
});
