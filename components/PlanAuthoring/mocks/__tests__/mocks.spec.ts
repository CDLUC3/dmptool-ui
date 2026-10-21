import { waitFor } from "@testing-library/react";
import { createScenarioDataSource } from "..";

async function loadModel() {
  const dataSource = createScenarioDataSource();
  await waitFor(() => expect(dataSource.getState().status).toBe("ready"));
  const state = dataSource.getState();
  if (state.status !== "ready") {
    throw new Error("The mock plan did not load.");
  }
  return state.model;
}

describe("mockPlan through the real GraphQL data source", () => {
  it("has one valid question of every supported type", async () => {
    const questions = (await loadModel()).sections.flatMap((section) => section.questions);

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

  it("keeps a selected org with no guidance selected, without showing it on questions", async () => {
    const model = await loadModel();
    const berkeley = "https://ror.org/01an7q238";

    expect(model.selectedGuidanceOrgIds).toEqual(
      expect.arrayContaining([berkeley, "https://ror.org/00f54p054"])
    );
    expect(
      model.sections
        .flatMap((section) => section.questions)
        .flatMap((question) => question.guidanceSources)
        .filter((source) => source.shortName === "UCB")
    ).toEqual([]);
  });
});
