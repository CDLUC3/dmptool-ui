import type { PlanAuthoringDataSource } from "../dataSource";
import { createPlanAuthoringDataSource } from "../planAuthoringDataSource";
import {
  createFakePlanAuthoringClient,
  type FakePlanAuthoringOptions,
} from "./fakePlanAuthoringClient";
import { mockPlan } from "./mockPlan";

/** The real GraphQL data source, talking to the fake plan authoring API. */
export function createScenarioDataSource(
  api: FakePlanAuthoringOptions = {}
): PlanAuthoringDataSource {
  return createPlanAuthoringDataSource({
    client: createFakePlanAuthoringClient(api),
    planId: mockPlan.id ?? 1,
    locale: "en-US",
  });
}
