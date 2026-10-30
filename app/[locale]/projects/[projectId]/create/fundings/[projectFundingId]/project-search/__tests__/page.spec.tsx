import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { mockScrollIntoView, mockScrollTo } from '@/__mocks__/common';
import {
  ProjectDocument,
  ProjectFundingsApiDocument,
  ProjectImportDocument,
} from '@/generated/graphql';
import logECS from '@/utils/clientLogger';
import ProjectsCreateProjectProjectSearch from '../page';

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

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useLazyQuery: jest.fn(),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ add: jest.fn() }),
}));

jest.mock('@/utils/clientLogger', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);
const mockUseLazyQuery = jest.mocked(useLazyQuery);

const mockProject = {
  __typename: 'ExternalProject',
  title: 'REU Site: Engineers for Exploration',
  abstractText: 'Engineers for Exploration is an experiential program...',
  startDate: '2026-10-01',
  endDate: '2029-09-30',
  fundings: [
    {
      __typename: 'ExternalFunding',
      funderProjectNumber: '2548467',
      funderOpportunityNumber: null,
      grantId: 'https://www.nsf.gov/awardsearch/showAward?AWD_ID=2548467',
    },
  ],
  members: [
    {
      __typename: 'ExternalMember',
      affiliationId: null,
      email: 'cschurgers@ucsd.edu',
      givenName: 'Curt',
      orcid: null,
      surName: 'Schurgers',
      role: ['http://credit.niso.org/contributor-roles/investigation'],
    },
  ],
};

const nsfFunding = {
  __typename: 'ProjectFunding',
  id: 18,
  status: 'PLANNED',
  affiliation: {
    __typename: 'Affiliation',
    id: 114,
    uri: 'https://ror.org/021nxhr62',
    apiTarget: 'api/nsf',
    displayName: 'National Science Foundation (nsf.gov)',
  },
};

// Listed first so a "first funding" fallback would pick the wrong funder
const otherFunding = {
  ...nsfFunding,
  id: 17,
  affiliation: { ...nsfFunding.affiliation, id: 200, uri: 'https://ror.org/other', displayName: 'Other Funder' },
};

const fundingsReturn = (fundings: unknown[] = [otherFunding, nsfFunding], loading = false) => ({
  data: { project: { __typename: 'Project', fundings } },
  loading,
  error: undefined,
});

const currentProject = {
  __typename: 'Project',
  title: 'My current project',
  abstractText: 'Current abstract',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  isTestProject: true,
  researchDomain: { __typename: 'ResearchDomain', id: 7, parentResearchDomainId: 1 },
};

const projectReturn = { data: { project: currentProject }, loading: false, error: undefined };

type QueryResult = ReturnType<typeof useQuery>;
type MutationResult = ReturnType<typeof useMutation>;
type LazyQueryResult = ReturnType<typeof useLazyQuery>;

const mockQueries = ({ fundings = fundingsReturn(), project = projectReturn as unknown } = {}) => {
  mockUseQuery.mockImplementation((document) => {
    if (document === ProjectFundingsApiDocument) return fundings as unknown as QueryResult;
    if (document === ProjectDocument) return project as QueryResult;
    return { data: null, loading: false, error: undefined } as unknown as QueryResult;
  });
};

const mutation = (mutate: jest.Mock) =>
  [mutate, { loading: false, error: undefined }] as unknown as MutationResult;

const lazySearch = (searchFn: jest.Mock = jest.fn()) => {
  mockUseLazyQuery.mockImplementation(() => [
    searchFn,
    { data: undefined, loading: false, error: undefined, called: false },
  ] as unknown as LazyQueryResult);
};

const searchFor = (projectName = 'REU') => {
  fireEvent.change(screen.getByRole('textbox', { name: 'form.projectName' }), { target: { value: projectName } });
  fireEvent.click(screen.getByRole('button', { name: 'buttons.search' }));
};

const setupMocks = () => {
  (useParams as jest.Mock).mockReturnValue({ projectId: '1', projectFundingId: '18' });
  (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=plan'));

  mockQueries();
  mockUseMutation.mockImplementation(() =>
    mutation(jest.fn().mockResolvedValue({ data: { projectImport: { errors: null } } })));
  lazySearch();
};

describe('ProjectsCreateProjectProjectSearch', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should start with an empty project name', () => {
    render(<ProjectsCreateProjectProjectSearch />);
    expect(screen.getByRole('textbox', { name: 'form.projectName' })).toHaveValue('');
  });

  it('should end the breadcrumbs with the current screen', () => {
    render(<ProjectsCreateProjectProjectSearch />);
    const breadcrumbs = screen.getByRole('link', { name: 'breadcrumbs.projects' }).closest('ol');
    expect(breadcrumbs?.lastElementChild).toHaveTextContent(/^title$/);
  });

  it('should render the search form fields', () => {
    render(<ProjectsCreateProjectProjectSearch />);
    expect(screen.getByRole('textbox', { name: 'form.projectId' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'form.projectName' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'form.projectAwardYear' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'form.projectPrincipalInvestigator' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.search' })).toBeInTheDocument();
  });

  it('should not show results section before a search is performed', () => {
    render(<ProjectsCreateProjectProjectSearch />);
    expect(screen.queryByText(/headings.projectsFound/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/headings.noProjectFound/i)).not.toBeInTheDocument();
  });

  it('should show results after a successful search', async () => {
    lazySearch(jest.fn().mockResolvedValue({ data: { searchExternalProjects: [mockProject] } }));

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    await waitFor(() => {
      expect(screen.getByText(/headings.projectsFound/i)).toBeInTheDocument();
      expect(screen.getByText(/REU Site: Engineers for Exploration/i)).toBeInTheDocument();
    });
  });

  it('should display the funder project number and grant id in results', async () => {
    lazySearch(jest.fn().mockResolvedValue({ data: { searchExternalProjects: [mockProject] } }));

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    await waitFor(() => {
      expect(screen.getByText('2548467')).toBeInTheDocument();
    });
  });

  it('should display principal investigators in results', async () => {
    lazySearch(jest.fn().mockResolvedValue({ data: { searchExternalProjects: [mockProject] } }));

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    await waitFor(() => {
      expect(screen.getByText('Curt Schurgers')).toBeInTheDocument();
    });
  });

  it('should show no results section when search returns empty', async () => {
    lazySearch(jest.fn().mockResolvedValue({ data: { searchExternalProjects: [] } }));

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    await waitFor(() => {
      expect(screen.getByText(/headings.noProjectFound/i)).toBeInTheDocument();
    });
  });

  it('should show the "add project manually" section after a search', async () => {
    lazySearch(jest.fn().mockResolvedValue({ data: { searchExternalProjects: [mockProject] } }));

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buttons.addProjectManually/i })).toBeInTheDocument();
    });
  });

  it('should navigate to add funding page when "Add Project Manually" is clicked', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    lazySearch(jest.fn().mockResolvedValue({ data: { searchExternalProjects: [] } }));

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buttons.addProjectManually/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /buttons.addProjectManually/i }));
    expect(mockPush).toHaveBeenCalledWith('/projects/1/create/fundings/18/details?intent=plan');
  });

  it('should offer adding details manually before any search', () => {
    render(<ProjectsCreateProjectProjectSearch />);
    expect(screen.getByRole('button', { name: /buttons.addProjectManually/i })).toBeInTheDocument();
  });

  it('should go to project details after importing the selected project', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    lazySearch(jest.fn().mockResolvedValue({ data: { searchExternalProjects: [mockProject] } }));

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();
    fireEvent.click(await screen.findByRole('button', { name: /Select REU Site/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects/1/project?intent=plan');
    });
  });

  it('should call projectImportMutation with correct variables when a project is selected', async () => {
    const mockImportFn = jest.fn().mockResolvedValue({
      data: { projectImport: { errors: null } },
    });
    mockUseMutation.mockImplementation((document) => {
      if (document === ProjectImportDocument) {
        return mutation(mockImportFn);
      }
      return mutation(jest.fn());
    });

    lazySearch(jest.fn().mockResolvedValue({ data: { searchExternalProjects: [mockProject] } }));

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Select REU Site/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Select REU Site/i }));

    await waitFor(() => {
      expect(mockImportFn).toHaveBeenCalledWith({
        variables: {
          input: {
            project: {
              id: 1,
              title: 'REU Site: Engineers for Exploration',
              abstractText: 'Engineers for Exploration is an experiential program...',
              startDate: '2026-10-01',
              endDate: '2029-09-30',
              isTestProject: true,
              researchDomainId: 7,
            },
            funding: [{
              projectId: 1,
              affiliationId: 'https://ror.org/021nxhr62',
              funderProjectNumber: '2548467',
              grantId: 'https://www.nsf.gov/awardsearch/showAward?AWD_ID=2548467',
              funderOpportunityNumber: undefined,
            }],
            members: [{
              projectId: 1,
              affiliationId: undefined,
              givenName: 'Curt',
              surName: 'Schurgers',
              orcid: undefined,
              email: 'cschurgers@ucsd.edu',
            }],
          },
        },
      });
    });
  });

  it('should keep the current project values when the external project leaves them empty', async () => {
    const mockImportFn = jest.fn().mockResolvedValue({ data: { projectImport: { errors: null } } });
    mockUseMutation.mockImplementation(() => mutation(mockImportFn));
    lazySearch(jest.fn().mockResolvedValue({
      data: {
        searchExternalProjects: [{
          ...mockProject, title: null, abstractText: null, startDate: null, endDate: null,
        }],
      },
    }));

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();
    fireEvent.click(await screen.findByRole('button', { name: /buttons.select/i }));

    await waitFor(() => {
      expect(mockImportFn).toHaveBeenCalledWith(expect.objectContaining({
        variables: expect.objectContaining({
          input: expect.objectContaining({
            project: {
              id: 1,
              title: 'My current project',
              abstractText: 'Current abstract',
              startDate: '2025-01-01',
              endDate: '2025-12-31',
              isTestProject: true,
              researchDomainId: 7,
            },
          }),
        }),
      }));
    });
  });

  it('should not import when the current project could not be loaded', async () => {
    mockQueries({ project: { data: undefined, loading: false, error: new Error('boom') } });
    const mockImportFn = jest.fn();
    mockUseMutation.mockImplementation(() => mutation(mockImportFn));
    lazySearch(jest.fn().mockResolvedValue({ data: { searchExternalProjects: [mockProject] } }));

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();
    fireEvent.click(await screen.findByRole('button', { name: /Select REU Site/i }));

    expect(await screen.findByText('messages.errors.selectedFailed')).toBeInTheDocument();
    expect(mockImportFn).not.toHaveBeenCalled();
  });

  it('should display error message when projectImportMutation returns errors', async () => {
    const mockImportFn = jest.fn().mockResolvedValue({
      data: {
        projectImport: {
          errors: {
            __typename: 'ProjectErrors',
            general: 'Could not import project',
          },
        },
      },
    });
    mockUseMutation.mockImplementation(() => mutation(mockImportFn));

    lazySearch(jest.fn().mockResolvedValue({ data: { searchExternalProjects: [mockProject] } }));

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Select REU Site/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Select REU Site/i }));

    await waitFor(() => {
      expect(screen.getByText('Could not import project')).toBeInTheDocument();
    });
  });

  it('should not search when all fields are empty', async () => {
    const mockSearchFn = jest.fn();
    lazySearch(mockSearchFn);

    render(<ProjectsCreateProjectProjectSearch />);

    searchFor('');

    expect(mockSearchFn).not.toHaveBeenCalled();
    expect(screen.queryByText(/headings.projectsFound/i)).not.toBeInTheDocument();
  });

  const expectFundingNotFound = () => {
    expect(screen.getByText('fundingStatus.errors.noFunding')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'form.projectName' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'buttons.search' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /buttons.addProjectManually/i })).not.toBeInTheDocument();
  };

  const setPathFundingId = (projectFundingId: string | undefined) => {
    (useParams as jest.Mock).mockReturnValue({ projectId: '1', projectFundingId });
  };

  it('should not fall back to another funding when the funding id in the path does not match a project funding', () => {
    setPathFundingId('99');

    render(<ProjectsCreateProjectProjectSearch />);

    expectFundingNotFound();
  });

  it.each(['abc', undefined])(
    'should show the funding not-found state when the funding id in the path is invalid (%s)',
    (projectFundingId) => {
      setPathFundingId(projectFundingId);

      render(<ProjectsCreateProjectProjectSearch />);

      expectFundingNotFound();
    }
  );

  it('should go to the funder step when "Choose a funder" is pressed', async () => {
    setPathFundingId('99');
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(<ProjectsCreateProjectProjectSearch />);
    fireEvent.click(screen.getByRole('button', { name: 'buttons.chooseFunder' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects/1/create/funder?intent=plan');
    });
  });

  it('should show the funding not-found state when the funder has no URI', () => {
    mockQueries({
      fundings: fundingsReturn([{ ...nsfFunding, affiliation: { ...nsfFunding.affiliation, uri: '' } }]),
    });

    render(<ProjectsCreateProjectProjectSearch />);

    expectFundingNotFound();
  });

  it('should show a loading state, not the not-found state, while fundings load', () => {
    mockQueries({ fundings: fundingsReturn([], true) });

    render(<ProjectsCreateProjectProjectSearch />);

    expect(screen.queryByText('fundingStatus.errors.noFunding')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'form.projectName' })).not.toBeInTheDocument();
  });

  it('should query fundings and the current project from the network', () => {
    render(<ProjectsCreateProjectProjectSearch />);

    expect(mockUseQuery).toHaveBeenCalledWith(ProjectFundingsApiDocument, {
      variables: { projectId: 1 },
      fetchPolicy: 'network-only',
    });
    expect(mockUseQuery).toHaveBeenCalledWith(ProjectDocument, {
      variables: { projectId: 1 },
      fetchPolicy: 'network-only',
    });
  });

  it('should show an error, not an empty result, when the search request fails', async () => {
    lazySearch(jest.fn().mockRejectedValue(new Error('Funder API down')));

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    expect(await screen.findByText('projectSearch.searchFailed')).toBeInTheDocument();
    expect(screen.queryByText('headings.noProjectFound')).not.toBeInTheDocument();
    expect(logECS).toHaveBeenCalledWith('error', 'searchExternalProjects', expect.anything());
  });

  it('should send every search field, splitting principal investigators on semicolons', async () => {
    const mockSearchFn = jest.fn().mockResolvedValue({ data: { searchExternalProjects: [] } });
    lazySearch(mockSearchFn);

    render(<ProjectsCreateProjectProjectSearch />);
    fireEvent.change(screen.getByRole('textbox', { name: 'form.projectId' }), { target: { value: ' 2548467 ' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'form.projectName' }), { target: { value: 'REU' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'form.projectAwardYear' }), { target: { value: '2026' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'form.projectPrincipalInvestigator' }), { target: { value: 'Curt Schurgers; ; Ada Lovelace' } });
    searchFor();

    await waitFor(() => {
      expect(mockSearchFn).toHaveBeenCalledWith({
        variables: {
          input: {
            affiliationId: 'https://ror.org/021nxhr62',
            awardId: '2548467',
            awardName: 'REU',
            awardYear: '2026',
            piNames: ['Curt Schurgers', 'Ada Lovelace'],
          },
        },
      });
    });
  });

  it('should show an error and stay on the page when importing fails on the network', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockUseMutation.mockImplementation(() => mutation(jest.fn().mockRejectedValue(new Error('Network down'))));
    lazySearch(jest.fn().mockResolvedValue({ data: { searchExternalProjects: [mockProject] } }));

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();
    fireEvent.click(await screen.findByRole('button', { name: /Select REU Site/i }));

    expect(await screen.findByText('messages.errors.selectedFailed')).toBeInTheDocument();
    expect(logECS).toHaveBeenCalledWith('error', 'projectImportMutation', expect.anything());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(<ProjectsCreateProjectProjectSearch />);
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});