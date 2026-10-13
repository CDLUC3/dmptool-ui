import type { PlanAuthoringDataSource } from "@/components/PlanAuthoring";
import {
  createScenarioDataSource,
  mockPlanWithResearchOutputs,
} from "@/components/PlanAuthoring/mocks";

export const STYLEGUIDE_PLAN_HREF = "/styleguide/components/plan-authoring";
export const STYLEGUIDE_RESEARCH_OUTPUT_PATH = `${STYLEGUIDE_PLAN_HREF}/research-output`;

let shared: PlanAuthoringDataSource | null = null;

/** One instance for the plan and research output pages, so a saved row is there on return. */
export function getStyleguidePlanAuthoringDataSource(): PlanAuthoringDataSource {
  shared ??= createScenarioDataSource("saveFails", {
    delayMs: 450,
    plan: mockPlanWithResearchOutputs,
  });
  return shared;
}
