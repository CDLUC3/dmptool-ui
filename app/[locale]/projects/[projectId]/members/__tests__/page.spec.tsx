import { act, fireEvent, render, screen } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import ProjectsProjectMembers from '../page';
import { axe, toHaveNoViolations } from 'jest-axe';
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn()
}));

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));


const mockProjectMembersData = [
  {
    id: 1,
    givenName: "Jacques",
    surName: "Cousteau",
    orcid: "0000-JACQ-0000-0000",
    memberRoles: [
      {
        id: 2,
        label: "Principal Investigator (PI)",
        description: "An individual conducting a research and investigation process, specifically performing the experiments, or data/evidence collection."
      },
      {
        id: 3,
        label: "Project Administrator",
        description: "An individual with management and coordination responsibility for the research activity planning and execution."
      }
    ],
    affiliation: {
      displayName: "University of California, Davis (ucdavis.edu)"
    },
  },
  {
    id: 2,
    givenName: "Captain",
    surName: "Nemo",
    orcid: "0000-NEMO-0000-0000",
    memberRoles: [
      {
        id: 2,
        label: "Principal Investigator (PI)",
        description: "An individual conducting a research and investigation process, specifically performing the experiments, or data/evidence collection."
      }
    ],
    affiliation: {
      displayName: "University of California, Davis (ucdavis.edu)"
    },
  }
];

// Cast with jest.mocked utility
const mockUseQuery = jest.mocked(useQuery);

const setupMocks = () => {
  mockUseQuery.mockReturnValue({
    data: {
      project: {
        members: mockProjectMembersData,
        readOnly: false,
      },
    },
    loading: false,
    error: undefined,
    refetch: jest.fn()
    /* eslint-disable @typescript-eslint/no-explicit-any */
  } as any);
};

describe('ProjectsProjectMembers', () => {
  const mockUseParams = useParams as jest.Mock;
  const mockRouter = { push: jest.fn() };
  (useRouter as jest.Mock).mockReturnValue(mockRouter);

  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
    mockUseParams.mockReturnValue({ projectId: '1' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  it('should render loading state', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      loading: true,
      error: undefined,
      refetch: jest.fn()
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } as any);

    render(<ProjectsProjectMembers />);

    expect(screen.getByText('messaging.loading...')).toBeInTheDocument();
  });

  it('should render error state', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      loading: false,
      error: true,
      refetch: jest.fn()
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } as any);

    render(<ProjectsProjectMembers />);

    expect(screen.getByText('messages.errors.errorGettingMembers')).toBeInTheDocument();
  });

  it('renders project members', () => {
    mockUseQuery.mockReturnValue({
      data: { project: { members: mockProjectMembersData, readOnly: false } },
      loading: false,
      error: undefined,
      refetch: jest.fn()
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } as any);

    render(<ProjectsProjectMembers />);

    // Expect certain breadcrumbs 
    expect(screen.getByText('breadcrumbs.home')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbs.projects')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbs.projectOverview')).toBeInTheDocument();

    expect(screen.getByText('Jacques Cousteau')).toBeInTheDocument();
    expect(screen.getByText('Captain Nemo')).toBeInTheDocument();
    const affiliation = screen.getAllByText('University of California, Davis (ucdavis.edu)');
    expect(affiliation).toHaveLength(2);
    expect(screen.getByText('0000-JACQ-0000-0000')).toBeInTheDocument();
    expect(screen.getByText('0000-NEMO-0000-0000')).toBeInTheDocument();
    expect(screen.getByText('Principal Investigator (PI), Project Administrator')).toBeInTheDocument();
    expect(screen.getByText('Principal Investigator (PI)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buttons.addMembers/i })).toBeInTheDocument();
    const editButton = screen.getByRole('button', { name: "Edit Jacques Cousteau's details" });
    expect(editButton).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'headings.h2AllowCollaborators' })).toBeInTheDocument();
    expect(screen.getByText('para.para1AllowCollaborators')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /buttons.shareWithPeople/i })).toBeInTheDocument();
  });

  it('should handle add member button click', () => {
    mockUseQuery.mockReturnValue({
      data: { project: { members: mockProjectMembersData, readOnly: false } },
      loading: false,
      error: undefined,
      refetch: jest.fn()
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } as any);

    render(<ProjectsProjectMembers />);

    fireEvent.click(screen.getByText('buttons.addMembers'));

    expect(mockRouter.push).toHaveBeenCalledWith('/en-US/projects/1/members/search');
  });

  it('should handle edit member button click', () => {
    mockUseQuery.mockReturnValue({
      data: { project: { members: mockProjectMembersData, readOnly: false } },
      loading: false,
      error: undefined,
      refetch: jest.fn()
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } as any);

    render(<ProjectsProjectMembers />);

    const editButtons = screen.queryAllByText('buttons.edit');
    fireEvent.click(editButtons[0]);

    expect(mockRouter.push).toHaveBeenCalledWith('/en-US/projects/1/members/1/edit');
  });

  it('should pass axe accessibility test', async () => {

    const { container } = render(
      <ProjectsProjectMembers />
    );
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });


  describe('when isReadOnly is true', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: { project: { members: mockProjectMembersData, readOnly: true } },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);
    });

    it('should not render the "Add members" button', () => {
      render(<ProjectsProjectMembers />);
      expect(screen.queryByRole('button', { name: /buttons.addMembers/i })).not.toBeInTheDocument();
    });

    it('should not render "Edit" buttons on member rows', () => {
      render(<ProjectsProjectMembers />);
      expect(screen.getByText('Jacques Cousteau')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });

    it('should still render all member names and details', () => {
      render(<ProjectsProjectMembers />);
      expect(screen.getByText('Jacques Cousteau')).toBeInTheDocument();
      expect(screen.getByText('Captain Nemo')).toBeInTheDocument();
      const affiliations = screen.getAllByText('University of California, Davis (ucdavis.edu)');
      expect(affiliations).toHaveLength(2);
      expect(screen.getByText('0000-JACQ-0000-0000')).toBeInTheDocument();
      expect(screen.getByText('0000-NEMO-0000-0000')).toBeInTheDocument();
    });

    it('should not render the collaborators section', () => {
      render(<ProjectsProjectMembers />);
      expect(
        screen.queryByRole('heading', { level: 2, name: 'headings.h2AllowCollaborators' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /buttons.shareWithPeople/i })
      ).not.toBeInTheDocument();
    });
  });
});
