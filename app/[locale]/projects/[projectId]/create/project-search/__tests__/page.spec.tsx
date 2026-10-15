import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { mockScrollIntoView, mockScrollTo } from '@/__mocks__/common';
import {
  AffiliationByIdDocument,
  ProjectImportDocument,
} from '@/generated/graphql';
import logECS from '@/utils/clientLogger';
import ProjectsCreateProjectProjectSearch from '../page';

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
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

const stableAffiliationReturn = {
  data: {
    affiliationById: {
      __typename: 'Affiliation',
      id: 114,
      uri: 'https://ror.org/021nxhr62',
      displayName: 'National Science Foundation (nsf.gov)',
      name: 'National Science Foundation',
    },
  },
  loading: false,
  error: undefined,
};

const searchFor = (projectName = 'REU') => {
  fireEvent.change(screen.getByRole('textbox', { name: 'form.projectName' }), { target: { value: projectName } });
  fireEvent.click(screen.getByRole('button', { name: 'buttons.search' }));
};

const setupMocks = () => {
  (useParams as jest.Mock).mockReturnValue({ projectId: '1' });
  (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  (useSearchParams as jest.Mock).mockReturnValue(
    new URLSearchParams('intent=plan&affId=114&projectFundingId=18')
  );

  mockUseQuery.mockImplementation((document) => {
    if (document === AffiliationByIdDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return stableAffiliationReturn as any;
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return { data: null, loading: false, error: undefined } as any;
  });

  mockUseMutation.mockImplementation(() => [
    jest.fn().mockResolvedValue({ data: { projectImport: { errors: null } } }),
    { loading: false, error: undefined },
    /* eslint-disable @typescript-eslint/no-explicit-any */
  ] as any);

  mockUseLazyQuery.mockImplementation(() => [
    jest.fn(),
    { data: undefined, loading: false, error: undefined, called: false },
    /* eslint-disable @typescript-eslint/no-explicit-any */
  ] as any);
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
    const stableSearchReturn = {
      data: {
        searchExternalProjects: [mockProject],
      },
    };

    const mockSearchFn = jest.fn().mockResolvedValue(stableSearchReturn);
    mockUseLazyQuery.mockImplementation(() => [
      mockSearchFn,
      { data: undefined, loading: false, error: undefined, called: false },
      /* eslint-disable @typescript-eslint/no-explicit-any */
    ] as any);

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    await waitFor(() => {
      expect(screen.getByText(/headings.projectsFound/i)).toBeInTheDocument();
      expect(screen.getByText(/REU Site: Engineers for Exploration/i)).toBeInTheDocument();
    });
  });

  it('should display the funder project number and grant id in results', async () => {
    const mockSearchFn = jest.fn().mockResolvedValue({
      data: { searchExternalProjects: [mockProject] },
    });
    mockUseLazyQuery.mockImplementation(() => [
      mockSearchFn,
      { data: undefined, loading: false, error: undefined, called: false },
      /* eslint-disable @typescript-eslint/no-explicit-any */
    ] as any);

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    await waitFor(() => {
      expect(screen.getByText('2548467')).toBeInTheDocument();
    });
  });

  it('should display principal investigators in results', async () => {
    const mockSearchFn = jest.fn().mockResolvedValue({
      data: { searchExternalProjects: [mockProject] },
    });
    mockUseLazyQuery.mockImplementation(() => [
      mockSearchFn,
      { data: undefined, loading: false, error: undefined, called: false },
      /* eslint-disable @typescript-eslint/no-explicit-any */
    ] as any);

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    await waitFor(() => {
      expect(screen.getByText('Curt Schurgers')).toBeInTheDocument();
    });
  });

  it('should show no results section when search returns empty', async () => {
    const mockSearchFn = jest.fn().mockResolvedValue({
      data: { searchExternalProjects: [] },
    });
    mockUseLazyQuery.mockImplementation(() => [
      mockSearchFn,
      { data: undefined, loading: false, error: undefined, called: false },
      /* eslint-disable @typescript-eslint/no-explicit-any */
    ] as any);

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    await waitFor(() => {
      expect(screen.getByText(/headings.noProjectFound/i)).toBeInTheDocument();
    });
  });

  it('should show the "add project manually" section after a search', async () => {
    const mockSearchFn = jest.fn().mockResolvedValue({
      data: { searchExternalProjects: [mockProject] },
    });
    mockUseLazyQuery.mockImplementation(() => [
      mockSearchFn,
      { data: undefined, loading: false, error: undefined, called: false },
      /* eslint-disable @typescript-eslint/no-explicit-any */
    ] as any);

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buttons.addProjectManually/i })).toBeInTheDocument();
    });
  });

  it('should navigate to add funding page when "Add Project Manually" is clicked', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    const mockSearchFn = jest.fn().mockResolvedValue({
      data: { searchExternalProjects: [] },
    });
    mockUseLazyQuery.mockImplementation(() => [
      mockSearchFn,
      { data: undefined, loading: false, error: undefined, called: false },
      /* eslint-disable @typescript-eslint/no-explicit-any */
    ] as any);

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buttons.addProjectManually/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /buttons.addProjectManually/i }));
    expect(mockPush).toHaveBeenCalledWith('/en-US/projects/1/create/funding-details?intent=plan&projectFundingId=18');
  });

  it('should offer adding details manually before any search', () => {
    render(<ProjectsCreateProjectProjectSearch />);
    expect(screen.getByRole('button', { name: /buttons.addProjectManually/i })).toBeInTheDocument();
  });

  it('should go to project details after importing the selected project', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockUseLazyQuery.mockImplementation(() => [
      jest.fn().mockResolvedValue({ data: { searchExternalProjects: [mockProject] } }),
      { data: undefined, loading: false, error: undefined, called: false },
    ] as any);

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();
    fireEvent.click(await screen.findByRole('button', { name: /Select REU Site/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en-US/projects/1/project?intent=plan');
    });
  });

  it('should call projectImportMutation with correct variables when a project is selected', async () => {
    const mockImportFn = jest.fn().mockResolvedValue({
      data: { projectImport: { errors: null } },
    });
    mockUseMutation.mockImplementation((document) => {
      if (document === ProjectImportDocument) {
        return [mockImportFn, { loading: false, error: undefined }] as any;
      }
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    const mockSearchFn = jest.fn().mockResolvedValue({
      data: { searchExternalProjects: [mockProject] },
    });
    mockUseLazyQuery.mockImplementation(() => [
      mockSearchFn,
      { data: undefined, loading: false, error: undefined, called: false },
      /* eslint-disable @typescript-eslint/no-explicit-any */
    ] as any);

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Select REU Site/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Select REU Site/i }));

    await waitFor(() => {
      expect(mockImportFn).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              project: expect.objectContaining({
                title: 'REU Site: Engineers for Exploration',
              }),
            }),
          }),
        })
      );
    });
  });

  it('should display error message when projectImportMutation returns errors', async () => {
    // Re-apply useQuery mock so affiliationData is available during handleSelectProject
    mockUseQuery.mockImplementation((document) => {
      if (document === AffiliationByIdDocument) {
        return stableAffiliationReturn as any;
      }
      return { data: null, loading: false, error: undefined } as any;
    });

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
    mockUseMutation.mockImplementation(() => [
      mockImportFn,
      { loading: false, error: undefined },
      /* eslint-disable @typescript-eslint/no-explicit-any */
    ] as any);

    const mockSearchFn = jest.fn().mockResolvedValue({
      data: { searchExternalProjects: [mockProject] },
    });
    mockUseLazyQuery.mockImplementation(() => [
      mockSearchFn,
      { data: undefined, loading: false, error: undefined, called: false },
      /* eslint-disable @typescript-eslint/no-explicit-any */
    ] as any);

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
    mockUseLazyQuery.mockImplementation(() => [
      mockSearchFn,
      { data: undefined, loading: false, error: undefined, called: false },
      /* eslint-disable @typescript-eslint/no-explicit-any */
    ] as any);

    render(<ProjectsCreateProjectProjectSearch />);

    searchFor('');

    expect(mockSearchFn).not.toHaveBeenCalled();
    expect(screen.queryByText(/headings.projectsFound/i)).not.toBeInTheDocument();
  });

  const lazySearch = (searchFn: jest.Mock) => {
    mockUseLazyQuery.mockImplementation(() => [
      searchFn,
      { data: undefined, loading: false, error: undefined, called: false },
    ] as any);
  };

  it('should not search and should log when the funder id is missing from the URL', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('intent=plan'));
    const mockSearchFn = jest.fn();
    lazySearch(mockSearchFn);

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith('error', 'ProjectsCreateProjectProjectSearch', expect.objectContaining({
        error: 'Missing affiliationId in search parameters',
      }));
    });
    expect(mockSearchFn).not.toHaveBeenCalled();
  });

  it('should show no results when the funder has no URI', async () => {
    mockUseQuery.mockImplementation(() => ({
      data: { affiliationById: { id: 114, uri: null } }, loading: false, error: undefined,
    }) as any);
    const mockSearchFn = jest.fn();
    lazySearch(mockSearchFn);

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    expect(await screen.findByText('headings.noProjectFound')).toBeInTheDocument();
    expect(mockSearchFn).not.toHaveBeenCalled();
    expect(logECS).toHaveBeenCalledWith('error', 'ProjectsCreateProjectProjectSearch', expect.objectContaining({
      error: 'Missing affiliation URI',
    }));
  });

  it('should show no results when the search request fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    lazySearch(jest.fn().mockRejectedValue(new Error('Funder API down')));

    render(<ProjectsCreateProjectProjectSearch />);
    searchFor();

    expect(await screen.findByText('headings.noProjectFound')).toBeInTheDocument();
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
    mockUseMutation.mockImplementation(() => [
      jest.fn().mockRejectedValue(new Error('Network down')),
      { loading: false, error: undefined },
    ] as any);
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