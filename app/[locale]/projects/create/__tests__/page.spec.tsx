import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useRouter } from '@/i18n/routing';
import { useQuery } from '@apollo/client/react';

import ProjectsStartPlan from '../page';

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
}));

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));

type QueryResult = ReturnType<typeof useQuery>;

const mockUseQuery = jest.mocked(useQuery);
const mockPush = jest.fn();

const projectsData = {
  myProjects: {
    items: [
      { id: 11, title: 'Coastal Ocean Processes', fundings: [{ name: 'NSF' }], plans: [{ id: 1 }] },
      { id: 12, title: 'Soil Microbes', fundings: [], plans: [] },
    ],
  },
};

const clickNext = () => fireEvent.click(screen.getByRole('button', { name: 'buttons.next' }));

describe('ProjectsStartPlan', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    HTMLElement.prototype.scrollIntoView = jest.fn();
    mockPush.mockReset();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockUseQuery.mockReturnValue({ data: projectsData, loading: false, error: undefined } as unknown as QueryResult);
  });

  it('asks whether the plan belongs to an existing project and requires an answer', async () => {
    render(<ProjectsStartPlan />);

    expect(screen.getByText('startPlan.gateLabel')).toBeInTheDocument();
    expect(screen.queryByText('startPlan.projectsLabel')).not.toBeInTheDocument();

    clickNext();
    expect(await screen.findByText('startPlan.errors.chooseGate')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('starts a new project when the user has no project yet', async () => {
    render(<ProjectsStartPlan />);
    fireEvent.click(screen.getByLabelText('startPlan.noNew'));
    clickNext();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects/create/project?intent=plan');
    });
  });

  it('lists existing projects and goes to plan start for the chosen one', async () => {
    render(<ProjectsStartPlan />);
    fireEvent.click(screen.getByLabelText('startPlan.yesExisting'));

    expect(screen.getByLabelText('Coastal Ocean Processes')).toBeInTheDocument();
    expect(screen.getByLabelText('Soil Microbes')).toBeInTheDocument();
    expect(screen.getByTestId('create-flow-stage-addFunder')).toHaveTextContent('rail.states.skipped');

    clickNext();
    expect(await screen.findByText('startPlan.errors.chooseProject')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Coastal Ocean Processes'));
    clickNext();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects/11/dmp/start?intent=plan&from=existing');
    });
  });

  it('suggests a new project when the user has none', () => {
    mockUseQuery.mockReturnValue({ data: { myProjects: { items: [] } }, loading: false, error: undefined } as unknown as QueryResult);
    render(<ProjectsStartPlan />);
    fireEvent.click(screen.getByLabelText('startPlan.yesExisting'));

    expect(screen.getByText('startPlan.noProjects')).toBeInTheDocument();
  });

  it('shows a loading state while projects load', () => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: true, error: undefined } as unknown as QueryResult);
    render(<ProjectsStartPlan />);
    fireEvent.click(screen.getByLabelText('startPlan.yesExisting'));

    expect(screen.queryByText('startPlan.projectsLabel')).not.toBeInTheDocument();
    expect(screen.queryByText('startPlan.noProjects')).not.toBeInTheDocument();
  });

  it('shows an error instead of the empty message when projects fail to load', () => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: false, error: new Error('boom') } as unknown as QueryResult);
    render(<ProjectsStartPlan />);
    fireEvent.click(screen.getByLabelText('startPlan.yesExisting'));

    expect(screen.getByText('startPlan.errors.loadProjects')).toBeInTheDocument();
    expect(screen.queryByText('startPlan.noProjects')).not.toBeInTheDocument();
  });

  it('only loads projects once the user says they have one', () => {
    render(<ProjectsStartPlan />);
    expect(mockUseQuery).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ skip: true }));

    fireEvent.click(screen.getByLabelText('startPlan.yesExisting'));
    expect(mockUseQuery).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ skip: false }));
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(<ProjectsStartPlan />);
    fireEvent.click(screen.getByLabelText('startPlan.yesExisting'));
    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
