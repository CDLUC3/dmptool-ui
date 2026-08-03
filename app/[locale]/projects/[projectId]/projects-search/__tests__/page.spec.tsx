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

const setupMocks = () => {
  (useParams as jest.Mock).mockReturnValue({ projectId: '1' });
  (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  (useSearchParams as jest.Mock).mockReturnValue({
    get: (key: string) => (key === 'affId' ? '114' : null),
  });

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
    fireEvent.click(screen.getByRole('button', { name: /buttons.search/i }));

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
    fireEvent.click(screen.getByRole('button', { name: /buttons.search/i }));

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
    fireEvent.click(screen.getByRole('button', { name: /buttons.search/i }));

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
    fireEvent.click(screen.getByRole('button', { name: /buttons.search/i }));

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
    fireEvent.click(screen.getByRole('button', { name: /buttons.search/i }));

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
    fireEvent.click(screen.getByRole('button', { name: /buttons.search/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buttons.addProjectManually/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /buttons.addProjectManually/i }));
    expect(mockPush).toHaveBeenCalledWith('/en-US/projects/1/fundings/add');
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
    fireEvent.click(screen.getByRole('button', { name: /buttons.search/i }));

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
    fireEvent.click(screen.getByRole('button', { name: 'buttons.search' }));

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

    // Clear the default projectName value first
    fireEvent.change(screen.getByRole('textbox', { name: 'form.projectName' }), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /buttons.search/i }));

    expect(mockSearchFn).not.toHaveBeenCalled();
    expect(screen.queryByText(/headings.projectsFound/i)).not.toBeInTheDocument();
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(<ProjectsCreateProjectProjectSearch />);
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});