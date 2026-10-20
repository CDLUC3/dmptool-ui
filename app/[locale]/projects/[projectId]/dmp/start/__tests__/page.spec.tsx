import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ProjectsProjectPlanNew from '../page';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { mockScrollTo } from '@/__mocks__/common';

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
}));

let mockRouter;


describe('ProjectsProjectPlanNew', () => {
  const mockUseParams = useParams as jest.Mock;

  beforeEach(() => {
    mockScrollTo();
    mockUseParams.mockReturnValue({ projectId: '1' });

    // mock router
    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  it('should keep the flow query and show the rail when inside the create flow', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=plan&from=existing'));
    render(<ProjectsProjectPlanNew />);

    expect(screen.getByRole('heading', { level: 1, name: 'planStart.title' })).toBeInTheDocument();
    expect(screen.getByTestId('create-flow-stage-addFunder')).toHaveTextContent('rail.states.skipped');
    expect(screen.getByTestId('create-flow-stage-setupComplete')).toHaveAttribute('aria-current', 'step');

    expect(screen.getByTestId('plan-start-intro')).toHaveTextContent('planStart.description');
    expect(screen.getByText('planStart.options.createDescription')).toBeInTheDocument();
    expect(screen.getByText('planStart.options.uploadDescription')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('planStart.options.upload'));
    fireEvent.click(screen.getByRole('button', { name: 'buttons.next' }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/projects/1/dmp/upload?intent=plan&from=existing');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  })

  it('should render the page correctly', async () => {

    render(<ProjectsProjectPlanNew />);

    // Check breadcrumb items
    const breadcrumb = screen.getByLabelText('Breadcrumbs');
    expect(within(breadcrumb).getByText('breadcrumbs.home')).toBeInTheDocument();
    expect(within(breadcrumb).getByText('breadcrumbs.projects')).toBeInTheDocument();
    expect(within(breadcrumb).getByText('breadcrumbs.projectOverview')).toBeInTheDocument();
    expect(within(breadcrumb).getByText('breadcrumbs.startDMP')).toBeInTheDocument();

    expect(screen.queryByTestId('plan-start-intro')).not.toBeInTheDocument();

    // Check radio options
    expect(screen.getByLabelText('labels.startNewPlan')).toBeInTheDocument();
    expect(screen.getByLabelText('labels.uploadExistingPlan')).toBeInTheDocument();

    // Check Next button
    expect(screen.getByRole('button', { name: 'buttons.next' })).toBeInTheDocument();
  });


  it('should redirect to correct url when selecting create new DMP option', async () => {

    render(<ProjectsProjectPlanNew />);
    const radioStartNew = screen.getByLabelText('labels.startNewPlan');
    const nextButton = screen.getByRole('button', { name: 'buttons.next' });

    // Select "Start New Plan" and click Next
    fireEvent.click(radioStartNew);
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/projects/1/dmp/create');
    });
  });

  it('should redirect to correct url when selecting upload existing DMP option', async () => {

    render(<ProjectsProjectPlanNew />);
    const radioUploadExisting = screen.getByLabelText('labels.uploadExistingPlan');
    const nextButton = screen.getByRole('button', { name: 'buttons.next' });

    // Select "Upload Existing Plan" and click Next
    fireEvent.click(radioUploadExisting);
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/projects/1/dmp/upload');
    });
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(<ProjectsProjectPlanNew />);

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
