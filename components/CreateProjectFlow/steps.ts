import { ProjectFundingStatus } from '@/generated/graphql';
import { routePath, RouteName } from '@/utils/routes';

export type FlowIntent = 'plan' | 'project';

export interface FlowState {
  intent: FlowIntent;
  fromExisting: boolean;
}

export const RAIL_STAGES = ['createProject', 'addFunder', 'projectDetails', 'setupComplete'] as const;
export type RailStage = typeof RAIL_STAGES[number];

export type FlowScreen =
  | 'startPlan'
  | 'createProject'
  | 'funder'
  | 'fundingStatus'
  | 'projectSearch'
  | 'fundingDetails'
  | 'projectDetails'
  | 'planStart'
  | 'planCreate'
  | 'planUpload'
  | 'complete';

interface ScreenConfig {
  stage: RailStage;
  route: RouteName;
  allowBack: boolean;
}

// Back is history-based. It is off where going back would re-run a create
// (the funder screen would land on /projects/create/project and add a second project) and on end screens.
export const FLOW_SCREENS: Record<FlowScreen, ScreenConfig> = {
  startPlan: { stage: 'createProject', route: 'projects.create.start', allowBack: false },
  createProject: { stage: 'createProject', route: 'projects.create', allowBack: true },
  funder: { stage: 'addFunder', route: 'projects.create.funder', allowBack: false },
  fundingStatus: { stage: 'addFunder', route: 'projects.create.fundingStatus', allowBack: true },
  projectSearch: { stage: 'addFunder', route: 'projects.create.projectSearch', allowBack: true },
  fundingDetails: { stage: 'addFunder', route: 'projects.create.fundingDetails', allowBack: true },
  projectDetails: { stage: 'projectDetails', route: 'projects.project.info', allowBack: true },
  planStart: { stage: 'setupComplete', route: 'projects.dmp.start', allowBack: true },
  planCreate: { stage: 'setupComplete', route: 'projects.dmp.create', allowBack: true },
  planUpload: { stage: 'setupComplete', route: 'projects.dmp.upload', allowBack: true },
  complete: { stage: 'setupComplete', route: 'projects.create.complete', allowBack: false },
};

export const DEFAULT_FLOW: FlowState = { intent: 'plan', fromExisting: false };

export function flowQuery(flow: FlowState): Record<string, string | undefined> {
  return {
    intent: flow.intent,
    from: flow.fromExisting ? 'existing' : undefined,
  };
}

// Screens that work on one funding and carry its id in the path
export type FundingFlowScreen = 'fundingStatus' | 'projectSearch' | 'fundingDetails';

type FlowQuery = Record<string, string | number | boolean | undefined>;

export function flowPath(
  screen: Exclude<FlowScreen, FundingFlowScreen>,
  flow: FlowState,
  projectId?: string | number,
  extraQuery: FlowQuery = {}
): string {
  const params: Record<string, string | number> = projectId === undefined ? {} : { projectId };
  return routePath(FLOW_SCREENS[screen].route, params, { ...flowQuery(flow), ...extraQuery });
}

export function fundingFlowPath(
  screen: FundingFlowScreen,
  flow: FlowState,
  projectId: string | number,
  projectFundingId: string | number,
  extraQuery: FlowQuery = {}
): string {
  return routePath(FLOW_SCREENS[screen].route, { projectId, projectFundingId }, { ...flowQuery(flow), ...extraQuery });
}

// "Applied" has no Apollo enum value yet, see .reference/create-project/apollo-gaps.md
export const FUNDING_CHOICES = ['planned', 'applied', 'funded'] as const;
export type FundingChoice = typeof FUNDING_CHOICES[number];

export const FUNDING_CHOICE_STATUS: Record<FundingChoice, ProjectFundingStatus> = {
  planned: ProjectFundingStatus.Planned,
  applied: ProjectFundingStatus.Planned,
  funded: ProjectFundingStatus.Granted,
};

export function fundingChoiceFromStatus(status?: ProjectFundingStatus | null): FundingChoice {
  return status === ProjectFundingStatus.Granted ? 'funded' : 'planned';
}

export function screenAfterFundingStatus(
  choice: FundingChoice,
  funderHasApi: boolean
): 'projectSearch' | 'projectDetails' {
  return choice !== 'planned' && funderHasApi ? 'projectSearch' : 'projectDetails';
}

export function screenAfterProjectDetails(flow: FlowState): 'complete' | 'planStart' {
  return flow.intent === 'project' ? 'complete' : 'planStart';
}
