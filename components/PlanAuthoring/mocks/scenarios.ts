import type { PlanAuthoringDataSource } from "../dataSource";
import type { PlanAuthoringVariant, PlanDocument } from "../model";
import { createPlanAuthoringDataSource } from "../planAuthoringDataSource";
import {
  createFakePlanAuthoringClient,
  type FakePlanAuthoringOptions,
} from "./fakePlanAuthoringClient";
import { MOCK_PLAN_DOCUMENT, mockPlan } from "./mockPlan";

export interface MockScenario {
  api?: FakePlanAuthoringOptions;
  /** PlanAuthoring props the scenario needs besides the data source. */
  props?: { variant: PlanAuthoringVariant; planDocument?: PlanDocument };
}

export const MOCK_INVALID_JSON_QUESTION_KEY = "base-question-102";

export const scenarios = {
  editable: (): MockScenario => ({}),

  readOnly: (): MockScenario => ({
    api: {
      plan: {
        ...mockPlan,
        readOnly: true,
        project: { collaborators: [] },
      },
    },
  }),

  invalidJson: (): MockScenario => ({
    api: {
      plan: {
        ...mockPlan,
        sections: mockPlan.sections?.map((section) => ({
          ...section,
          questions: section.questions?.map((question) =>
            question.versionedQuestionId === 102
              ? { ...question, json: "{not json" }
              : question
          ),
        })),
      },
    },
  }),

  emptyPlan: (): MockScenario => ({ api: { plan: { ...mockPlan, sections: [] } } }),

  loadError: (): MockScenario => ({ api: { loadFails: true } }),

  saveFails: (): MockScenario => ({ api: { failSaveOnce: true } }),

  documentVariant: (): MockScenario => ({
    props: { variant: "document", planDocument: MOCK_PLAN_DOCUMENT },
  }),
} satisfies Record<string, () => MockScenario>;

export type MockScenarioName = keyof typeof scenarios;

/** The real GraphQL data source, talking to the fake plan authoring API. */
export function createScenarioDataSource(
  name: MockScenarioName,
  api: FakePlanAuthoringOptions = {}
): PlanAuthoringDataSource {
  return createPlanAuthoringDataSource({
    client: createFakePlanAuthoringClient({ ...scenarios[name]().api, ...api }),
    planId: mockPlan.id ?? 1,
    locale: "en-US",
  });
}
