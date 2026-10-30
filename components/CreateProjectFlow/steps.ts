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
  | 'fundingAdd'
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
  fundingAdd: { stage: 'addFunder', route: 'projects.fundings.add', allowBack: true },
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

export type FundingFlowScreen = 'fundingStatus' | 'projectSearch' | 'fundingDetails';

const FUNDING_FLOW_SCREENS: readonly FlowScreen[] = ['fundingStatus', 'projectSearch', 'fundingDetails'];

export function isFundingFlowScreen(screen: FlowScreen): screen is FundingFlowScreen {
  return FUNDING_FLOW_SCREENS.includes(screen);
}

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

// ProjectFundingStatus has no APPLIED value yet, so "applied" saves as PLANNED
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

// Each step that can lead to a funding screen carries the funding id that screen needs in its path.
export type FlowStep =
  | { from: 'startPlan'; project: 'existing' | 'new' }
  | { from: 'createProject' }
  | { from: 'funder'; funder: 'selected'; projectFundingId: string | number }
  | { from: 'funder'; funder: 'none' | 'manual' }
  | { from: 'fundingStatus'; choice: FundingChoice; funderHasApi: boolean; projectFundingId: string | number }
  | { from: 'projectSearch'; project: 'imported' }
  | { from: 'projectSearch'; project: 'manual'; projectFundingId: string | number }
  | { from: 'fundingDetails' | 'fundingAdd' | 'projectDetails' }
  | { from: 'planStart'; plan: 'create' | 'upload' }
  | { from: 'planCreate' | 'planUpload' };

export function nextScreen(step: FlowStep, flow: FlowState): FlowScreen {
  switch (step.from) {
    case 'startPlan':
      return step.project === 'existing' ? 'planStart' : 'createProject';
    case 'createProject':
      return 'funder';
    case 'funder':
      if (step.funder === 'selected') return 'fundingStatus';
      return step.funder === 'manual' ? 'fundingAdd' : 'projectDetails';
    case 'fundingStatus':
      return step.choice !== 'planned' && step.funderHasApi ? 'projectSearch' : 'projectDetails';
    case 'projectSearch':
      return step.project === 'manual' ? 'fundingDetails' : 'projectDetails';
    case 'fundingDetails':
    case 'fundingAdd':
      return 'projectDetails';
    case 'projectDetails':
      return flow.intent === 'project' ? 'complete' : 'planStart';
    case 'planStart':
      return step.plan === 'upload' ? 'planUpload' : 'planCreate';
    case 'planCreate':
    case 'planUpload':
      return 'complete';
  }
}

export function nextPath(
  step: FlowStep,
  flow: FlowState,
  projectId?: string | number,
  extraQuery: FlowQuery = {}
): string {
  const screen = nextScreen(step, flow);
  if (!isFundingFlowScreen(screen)) return flowPath(screen, flow, projectId, extraQuery);

  const projectFundingId = 'projectFundingId' in step ? step.projectFundingId : undefined;
  if (projectId === undefined || projectFundingId === undefined) {
    throw new Error(`The ${screen} screen needs a projectId and projectFundingId`);
  }
  return fundingFlowPath(screen, flow, projectId, projectFundingId, extraQuery);
}
