import React from 'react';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';

import { ProjectFundingStatus } from '@/generated/graphql';
import CreateProjectFlowLayout, {
  DEFAULT_FLOW,
  FLOW_SCREENS,
  FlowActions,
  flowPath,
  fundingFlowPath,
  fundingChoiceFromStatus,
  screenAfterFundingStatus,
  screenAfterProjectDetails,
  useCreateProjectFlow,
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

const mockBack = jest.fn();

const stageText = (stage: string) => screen.getByTestId(`create-flow-stage-${stage}`).textContent;

describe('CreateProjectFlow', () => {
  beforeEach(() => {
    mockBack.mockReset();
    (useRouter as jest.Mock).mockReturnValue({ back: mockBack });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  describe('useCreateProjectFlow', () => {
    it('is not in the flow without an intent', () => {
      const { result } = renderHook(() => useCreateProjectFlow());
      expect(result.current.inFlow).toBe(false);
      expect(result.current.flow).toEqual(DEFAULT_FLOW);
    });

    it('ignores unknown intents', () => {
      (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=other'));
      const { result } = renderHook(() => useCreateProjectFlow());
      expect(result.current.inFlow).toBe(false);
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

    it('searches the funder only when applied or funded and the funder has an API', () => {
      expect(screenAfterFundingStatus('funded', true)).toBe('projectSearch');
      expect(screenAfterFundingStatus('applied', true)).toBe('projectSearch');
      expect(screenAfterFundingStatus('planned', true)).toBe('projectDetails');
      expect(screenAfterFundingStatus('funded', false)).toBe('projectDetails');
    });

    it('ends project-only setup after details and continues to the plan otherwise', () => {
      expect(screenAfterProjectDetails({ intent: 'project', fromExisting: false })).toBe('complete');
      expect(screenAfterProjectDetails(DEFAULT_FLOW)).toBe('planStart');
    });

    it('never offers Back where it would repeat a create or leave an end screen', () => {
      expect(FLOW_SCREENS.startPlan.allowBack).toBe(false);
      expect(FLOW_SCREENS.funder.allowBack).toBe(false);
      expect(FLOW_SCREENS.complete.allowBack).toBe(false);
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
  });
});
