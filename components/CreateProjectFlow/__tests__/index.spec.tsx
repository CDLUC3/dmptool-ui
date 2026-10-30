import React from 'react';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';

import { ProjectFundingStatus } from '@/generated/graphql';
import CreateProjectFlowLayout, {
  DEFAULT_FLOW,
  FLOW_SCREENS,
  FlowActions,
  FlowAwareLayout,
  FlowBreadcrumbs,
  FlowState,
  flowPath,
  fundingFlowPath,
  fundingChoiceFromStatus,
  nextPath,
  nextScreen,
  useCreateProjectFlow,
  useFlowState,
} from '..';

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
}));

expect.extend(toHaveNoViolations);

const mockBack = jest.fn();

const stageText = (stage: string) => screen.getByTestId(`create-flow-stage-${stage}`).textContent;

describe('CreateProjectFlow', () => {
  beforeEach(() => {
    mockBack.mockReset();
    (useRouter as jest.Mock).mockReturnValue({ back: mockBack });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  describe('useCreateProjectFlow', () => {
    it('has no flow without an intent', () => {
      const { result } = renderHook(() => useCreateProjectFlow());
      expect(result.current).toEqual({ inFlow: false, flow: null });
    });

    it('ignores unknown intents', () => {
      (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=other&from=existing'));
      const { result } = renderHook(() => useCreateProjectFlow());
      expect(result.current).toEqual({ inFlow: false, flow: null });
    });

    it('reads the project intent and the existing-project flag', () => {
      (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=project&from=existing'));
      const { result } = renderHook(() => useCreateProjectFlow());
      expect(result.current).toEqual({
        inFlow: true,
        flow: { intent: 'project', fromExisting: true },
      });
    });
  });

  describe('useFlowState', () => {
    it('falls back to the plan flow without an intent', () => {
      const { result } = renderHook(() => useFlowState());
      expect(result.current).toEqual(DEFAULT_FLOW);
    });

    it('returns the flow from the URL when there is one', () => {
      (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=project'));
      const { result } = renderHook(() => useFlowState());
      expect(result.current).toEqual({ intent: 'project', fromExisting: false });
    });
  });

  describe('flowPath', () => {
    it('builds every flow-only screen under a create route', () => {
      expect(flowPath('startPlan', DEFAULT_FLOW)).toBe('/projects/create?intent=plan');
      expect(flowPath('createProject', DEFAULT_FLOW)).toBe('/projects/create/project?intent=plan');
      expect(flowPath('funder', DEFAULT_FLOW, 4)).toBe('/projects/4/create/funder?intent=plan');
      expect(flowPath('complete', DEFAULT_FLOW, 4)).toBe('/projects/4/create/complete?intent=plan');
    });

    it('puts the funding id in the path for the funding screens', () => {
      expect(fundingFlowPath('fundingStatus', DEFAULT_FLOW, 4, 9))
        .toBe('/projects/4/create/fundings/9/status?intent=plan');
      expect(fundingFlowPath('projectSearch', DEFAULT_FLOW, 4, 9))
        .toBe('/projects/4/create/fundings/9/project-search?intent=plan');
      expect(fundingFlowPath('fundingDetails', DEFAULT_FLOW, 4, 9))
        .toBe('/projects/4/create/fundings/9/details?intent=plan');
      expect(fundingFlowPath('fundingStatus', DEFAULT_FLOW, 4, 9, { newFunding: true }))
        .toBe('/projects/4/create/fundings/9/status?intent=plan&newFunding=true');
    });

    it('carries the existing-project flag and extra query values', () => {
      expect(flowPath('planStart', { intent: 'plan', fromExisting: true }, '7', { planId: 3, skip: undefined }))
        .toBe('/projects/7/dmp/start?intent=plan&from=existing&planId=3');
    });
  });

  describe('branch helpers', () => {
    it('only treats GRANTED as funded', () => {
      expect(fundingChoiceFromStatus(ProjectFundingStatus.Granted)).toBe('funded');
      expect(fundingChoiceFromStatus(ProjectFundingStatus.Planned)).toBe('planned');
      expect(fundingChoiceFromStatus(ProjectFundingStatus.Denied)).toBe('planned');
      expect(fundingChoiceFromStatus(null)).toBe('planned');
    });

    it('never offers Back where it would repeat a create or leave an end screen', () => {
      expect(FLOW_SCREENS.startPlan.allowBack).toBe(false);
      expect(FLOW_SCREENS.funder.allowBack).toBe(false);
      expect(FLOW_SCREENS.complete.allowBack).toBe(false);
    });
  });

  describe('nextScreen', () => {
    const projectFlow: FlowState = { intent: 'project', fromExisting: false };

    it('starts a new project or goes straight to the plan for an existing one', () => {
      expect(nextScreen({ from: 'startPlan', project: 'new' }, DEFAULT_FLOW)).toBe('createProject');
      expect(nextScreen({ from: 'startPlan', project: 'existing' }, DEFAULT_FLOW)).toBe('planStart');
      expect(nextScreen({ from: 'createProject' }, DEFAULT_FLOW)).toBe('funder');
    });

    it('moves on from the funder screen depending on what was chosen', () => {
      expect(nextScreen({ from: 'funder', funder: 'selected', projectFundingId: 9 }, DEFAULT_FLOW)).toBe('fundingStatus');
      expect(nextScreen({ from: 'funder', funder: 'none' }, DEFAULT_FLOW)).toBe('projectDetails');
      expect(nextScreen({ from: 'funder', funder: 'manual' }, DEFAULT_FLOW)).toBe('fundingAdd');
    });

    it('searches the funder only when applied or funded and the funder has an API', () => {
      const status = (choice: 'planned' | 'applied' | 'funded', funderHasApi: boolean) =>
        nextScreen({ from: 'fundingStatus', choice, funderHasApi, projectFundingId: 9 }, DEFAULT_FLOW);
      expect(status('funded', true)).toBe('projectSearch');
      expect(status('applied', true)).toBe('projectSearch');
      expect(status('planned', true)).toBe('projectDetails');
      expect(status('funded', false)).toBe('projectDetails');
    });

    it('goes to project details after the funding is filled in', () => {
      expect(nextScreen({ from: 'projectSearch', project: 'imported' }, DEFAULT_FLOW)).toBe('projectDetails');
      expect(nextScreen({ from: 'projectSearch', project: 'manual', projectFundingId: 9 }, DEFAULT_FLOW)).toBe('fundingDetails');
      expect(nextScreen({ from: 'fundingDetails' }, DEFAULT_FLOW)).toBe('projectDetails');
      expect(nextScreen({ from: 'fundingAdd' }, DEFAULT_FLOW)).toBe('projectDetails');
    });

    it('ends project-only setup after details and continues to the plan otherwise', () => {
      expect(nextScreen({ from: 'projectDetails' }, projectFlow)).toBe('complete');
      expect(nextScreen({ from: 'projectDetails' }, DEFAULT_FLOW)).toBe('planStart');
    });

    it('creates or uploads the plan, then completes', () => {
      expect(nextScreen({ from: 'planStart', plan: 'create' }, DEFAULT_FLOW)).toBe('planCreate');
      expect(nextScreen({ from: 'planStart', plan: 'upload' }, DEFAULT_FLOW)).toBe('planUpload');
      expect(nextScreen({ from: 'planCreate' }, DEFAULT_FLOW)).toBe('complete');
      expect(nextScreen({ from: 'planUpload' }, DEFAULT_FLOW)).toBe('complete');
    });
  });

  describe('nextPath', () => {
    it('builds the path of the next screen with the flow query', () => {
      expect(nextPath({ from: 'startPlan', project: 'new' }, DEFAULT_FLOW)).toBe('/projects/create/project?intent=plan');
      expect(nextPath({ from: 'funder', funder: 'manual' }, DEFAULT_FLOW, 4))
        .toBe('/projects/4/fundings/add?intent=plan');
      expect(nextPath({ from: 'planCreate' }, { intent: 'plan', fromExisting: true }, 4, { planId: 7 }))
        .toBe('/projects/4/create/complete?intent=plan&from=existing&planId=7');
    });

    it('puts the funding id from the step into the path of a funding screen', () => {
      expect(nextPath({ from: 'funder', funder: 'selected', projectFundingId: 9 }, DEFAULT_FLOW, 4, { newFunding: true }))
        .toBe('/projects/4/create/fundings/9/status?intent=plan&newFunding=true');
      expect(nextPath({ from: 'fundingStatus', choice: 'funded', funderHasApi: true, projectFundingId: 9 }, DEFAULT_FLOW, 4))
        .toBe('/projects/4/create/fundings/9/project-search?intent=plan');
      expect(nextPath({ from: 'projectSearch', project: 'manual', projectFundingId: 9 }, DEFAULT_FLOW, 4))
        .toBe('/projects/4/create/fundings/9/details?intent=plan');
    });

    it('throws when a funding screen has no project id', () => {
      expect(() => nextPath({ from: 'funder', funder: 'selected', projectFundingId: 9 }, DEFAULT_FLOW))
        .toThrow('The fundingStatus screen needs a projectId and projectFundingId');
    });
  });

  describe('FlowBreadcrumbs', () => {
    it('links home and projects, then shows the current screen', () => {
      render(<FlowBreadcrumbs current="Add a funder" />);
      expect(screen.getByRole('link', { name: 'breadcrumbs.home' })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: 'breadcrumbs.projects' })).toHaveAttribute('href', '/projects');
      expect(screen.getByText('Add a funder')).toBeInTheDocument();
    });
  });

  describe('FlowAwareLayout', () => {
    it('shows the progress rail when an intent is in the URL', () => {
      (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=plan'));
      render(<FlowAwareLayout screen="fundingAdd"><p>content</p></FlowAwareLayout>);
      expect(screen.getByText('content')).toBeInTheDocument();
      expect(screen.getByTestId('create-flow-stage-addFunder')).toHaveAttribute('aria-current', 'step');
    });

    it('uses the default layout outside the flow', () => {
      render(<FlowAwareLayout screen="fundingAdd"><p>content</p></FlowAwareLayout>);
      expect(screen.getByText('content')).toBeInTheDocument();
      expect(screen.queryByTestId('create-flow-stage-addFunder')).not.toBeInTheDocument();
    });

    it('uses the page fallback outside the flow', () => {
      render(
        <FlowAwareLayout screen="planUpload" fallback={(children) => <div data-testid="fallback">{children}</div>}>
          <p>content</p>
        </FlowAwareLayout>
      );
      expect(screen.getByTestId('fallback')).toContainElement(screen.getByText('content'));
    });
  });

  describe('CreateProjectFlowLayout', () => {
    it('marks earlier stages done, the current one current and later ones upcoming', () => {
      render(<CreateProjectFlowLayout screen="projectDetails" flow={DEFAULT_FLOW}><p>content</p></CreateProjectFlowLayout>);

      expect(screen.getByText('content')).toBeInTheDocument();
      expect(stageText('createProject')).toContain('rail.states.done');
      expect(stageText('addFunder')).toContain('rail.states.done');
      expect(screen.getByTestId('create-flow-stage-projectDetails')).toHaveAttribute('aria-current', 'step');
      expect(stageText('setupComplete')).toContain('rail.states.upcoming');
    });

    it('labels the progress rail as a region rather than navigation', () => {
      render(<CreateProjectFlowLayout screen="funder" flow={DEFAULT_FLOW}><p>content</p></CreateProjectFlowLayout>);
      expect(screen.getByRole('region', { name: 'rail.title' })).toBeInTheDocument();
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('goes back in history when Back is pressed', () => {
      render(
        <CreateProjectFlowLayout screen="fundingStatus" flow={DEFAULT_FLOW}>
          <p>content</p>
          <FlowActions />
        </CreateProjectFlowLayout>
      );

      fireEvent.click(screen.getByTestId('create-flow-back'));
      expect(mockBack).toHaveBeenCalled();
    });

    it('puts Back on the left and the next action on the right of one row', () => {
      render(
        <CreateProjectFlowLayout screen="fundingStatus" flow={DEFAULT_FLOW}>
          <FlowActions>
            <button type="button">Next</button>
          </FlowActions>
        </CreateProjectFlowLayout>
      );

      const nav = screen.getByTestId('create-flow-back').parentElement;
      const next = screen.getByRole('button', { name: 'Next' });
      expect(nav).toContainElement(next);
      expect(nav?.firstElementChild).toBe(screen.getByTestId('create-flow-back'));
      expect(nav?.lastElementChild).toContainElement(next);
    });

    it('hides Back on screens that do not allow it', () => {
      render(
        <CreateProjectFlowLayout screen="funder" flow={DEFAULT_FLOW}>
          <FlowActions>
            <button type="button">Next</button>
          </FlowActions>
        </CreateProjectFlowLayout>
      );
      expect(screen.queryByTestId('create-flow-back')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    it('should pass axe accessibility test', async () => {
      const { container } = render(
        <>
          <FlowBreadcrumbs current="Funding status" />
          <CreateProjectFlowLayout screen="fundingStatus" flow={DEFAULT_FLOW}>
            <h1>Funding status</h1>
            <FlowActions>
              <button type="button">Next</button>
            </FlowActions>
          </CreateProjectFlowLayout>
        </>
      );
      await act(async () => {
        expect(await axe(container)).toHaveNoViolations();
      });
    });
  });
});
