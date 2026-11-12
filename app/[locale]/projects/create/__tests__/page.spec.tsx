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

  it('searches projects by keyword and clears the chosen project', () => {
    render(<ProjectsStartPlan />);
    fireEvent.click(screen.getByLabelText('startPlan.yesExisting'));
    fireEvent.click(screen.getByLabelText('Coastal Ocean Processes'));

    fireEvent.change(screen.getByRole('searchbox', { name: 'labels.searchByKeyword' }), { target: { value: ' Soil ' } });
    fireEvent.click(screen.getByRole('button', { name: 'buttons.search' }));

    expect(mockUseQuery).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({
      variables: { term: 'soil', paginationOptions: { type: 'CURSOR', limit: 20 } },
    }));
    expect(screen.getByLabelText('Coastal Ocean Processes')).not.toBeChecked();
  });

  it('offers to clear a search that matches no projects', () => {
    mockUseQuery.mockImplementation((_query, options) => {
      const term = (options as { variables?: { term?: string } })?.variables?.term;
      const data = term === 'nothing' ? { myProjects: { items: [] } } : projectsData;
      return { data, loading: false, error: undefined } as unknown as QueryResult;
    });
    render(<ProjectsStartPlan />);
    fireEvent.click(screen.getByLabelText('startPlan.yesExisting'));

    fireEvent.change(screen.getByRole('searchbox', { name: 'labels.searchByKeyword' }), { target: { value: 'nothing' } });
    fireEvent.click(screen.getByRole('button', { name: 'buttons.search' }));

    expect(screen.getByText('messaging.noItemsFound')).toBeInTheDocument();
    expect(screen.queryByText('startPlan.noProjects')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'links.clearFilter' }));
    expect(mockUseQuery).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({
      variables: { term: '', paginationOptions: { type: 'CURSOR', limit: 20 } },
    }));
  });

  describe('load more', () => {
    const pagedData = {
      myProjects: { ...projectsData.myProjects, totalCount: 3, nextCursor: 'cursor-2' },
    };

    it('loads the next page from the cursor and appends it', async () => {
      const fetchMore = jest.fn().mockResolvedValue({});
      mockUseQuery.mockReturnValue({ data: pagedData, loading: false, error: undefined, fetchMore } as unknown as QueryResult);
      render(<ProjectsStartPlan />);
      fireEvent.click(screen.getByLabelText('startPlan.yesExisting'));

      expect(screen.getByText('messaging.numDisplaying')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('load-more-projects'));

      await waitFor(() => expect(fetchMore).toHaveBeenCalled());
      const { variables, updateQuery } = fetchMore.mock.calls[0][0];
      expect(variables).toEqual({ paginationOptions: { type: 'CURSOR', limit: 20, cursor: 'cursor-2' } });

      const merged = updateQuery(pagedData, {
        fetchMoreResult: { myProjects: { totalCount: 3, nextCursor: null, items: [{ id: 13, title: 'Glaciers' }] } },
      });
      expect(merged.myProjects.items.map((p: { id: number }) => p.id)).toEqual([11, 12, 13]);
      expect(merged.myProjects.nextCursor).toBeNull();
    });

    it('hides load more once every project is shown', () => {
      mockUseQuery.mockReturnValue({
        data: { myProjects: { ...projectsData.myProjects, totalCount: 2, nextCursor: null } },
        loading: false,
        error: undefined,
      } as unknown as QueryResult);
      render(<ProjectsStartPlan />);
      fireEvent.click(screen.getByLabelText('startPlan.yesExisting'));

      expect(screen.queryByTestId('load-more-projects')).not.toBeInTheDocument();
    });

    it('shows an error and keeps the list when loading more fails', async () => {
      const fetchMore = jest.fn().mockRejectedValue(new Error('Network down'));
      mockUseQuery.mockReturnValue({ data: pagedData, loading: false, error: undefined, fetchMore } as unknown as QueryResult);
      render(<ProjectsStartPlan />);
      fireEvent.click(screen.getByLabelText('startPlan.yesExisting'));
      fireEvent.click(screen.getByTestId('load-more-projects'));

      expect(await screen.findByText('startPlan.errors.loadProjects')).toBeInTheDocument();
      expect(screen.getByLabelText('Coastal Ocean Processes')).toBeInTheDocument();
    });
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(<ProjectsStartPlan />);
    fireEvent.click(screen.getByLabelText('startPlan.yesExisting'));
    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
