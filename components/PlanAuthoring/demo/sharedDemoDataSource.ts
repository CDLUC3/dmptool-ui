import type { PlanAuthoringDataSource } from "../dataSource";
import { createPlanAuthoringDemoDataSource } from "./demoDataSource";

let shared: PlanAuthoringDataSource | null = null;

export function getSharedPlanAuthoringDemoDataSource(): PlanAuthoringDataSource {
  if (!shared) {
    shared = createPlanAuthoringDemoDataSource({
      failSaveOnce: true,
      delayMs: 450,
      persistKey: "plan-authoring-demo",
    });
  }
  return shared;
}
