import type {
  PlanAuthoringModel,
  PlanAuthoringVariant,
  PlanCapabilities,
  PlanComment,
  PlanDocument,
  PlanGuidanceOrgOption,
  PlanGuidanceSource,
  PlanQuestionDefinition,
  PlanQuestionIdentity,
  PlanQuestionSaveState,
  PlanSectionDefinition,
  PlanSectionIdentity,
} from "./model";
import type {
  PlanAuthoringDataSource,
  PlanAuthoringState,
  SaveAnswerResult,
} from "./dataSource";

export type {
  PlanAuthoringModel,
  PlanAuthoringVariant,
  PlanCapabilities,
  PlanComment,
  PlanDocument,
  PlanGuidanceOrgOption,
  PlanGuidanceSource,
  PlanQuestionDefinition,
  PlanQuestionIdentity,
  PlanQuestionSaveState,
  PlanSectionDefinition,
  PlanSectionIdentity,
  PlanAuthoringDataSource,
  PlanAuthoringState,
  SaveAnswerResult,
};

export { default as PlanAuthoring } from "./PlanAuthoringScreen";
export {
  deriveCommentCapabilities,
  type CommentPermissionFacts,
  type NewCommentTarget,
} from "./commentCapabilities";
export {
  createPlanAuthoringDataSource,
  type PlanAuthoringDataSourceParams,
} from "./planAuthoringDataSource";
export { usePlanAuthoringDataSource } from "./usePlanAuthoringDataSource";
export {
  EMPTY_PLAN_AUTHORING_VIEWER,
  toPlanAuthoringModel,
  toPlanAuthoringViewer,
  toStoredAnswerJson,
  type PlanAuthoringPlan,
  type PlanAuthoringViewer,
} from "./toPlanAuthoringModel";
