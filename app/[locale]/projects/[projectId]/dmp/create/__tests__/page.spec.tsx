import React from 'react';
import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing/react';
import PlanCreate from '../page';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import logECS from '@/utils/clientLogger';
import {
  ProjectFundingsDocument,
  PublishedTemplatesDocument,
  PublishedTemplatesMetaDataDocument,
  AddPlanDocument,
  AddPlanFundingDocument,
  MeDocument
} from '@/generated/graphql';
import { axe, toHaveNoViolations } from 'jest-axe';
import { mockScrollIntoView, mockScrollTo } from '@/__mocks__/common';

expect.extend(toHaveNoViolations);


jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('next-intl', () => ({
  useFormatter: jest.fn(() => ({
    dateTime: jest.fn(() => '01-01-2023'),
  })),
  useTranslations: jest.fn(() => jest.fn((key) => key)), // Mock `useTranslations`,
}));

jest.mock('@/hooks/useFormatDate', () => ({
  useFormatDate: jest.fn(() => (dateString: string) => {
    if (!dateString) return '';
    return '01-01-2023';
  }),
}));


let mockRouter;

const mockToast = {
  add: jest.fn(),
};


// Initial ProjectFundings query
const projectFundingsMocks = [
  {
    request: {
      query: ProjectFundingsDocument,
      variables: {
        projectId: 1
      },
    },
    result: {
      data: {
        projectFundings: Array.from({ length: 3 }, (_, i) => {
          const count = i + 1;
          return {
            __typename: "ProjectFunding",
            id: count,
            affiliation: {
              __typename: "Affiliation",
              displayName: `Affiliation ${count} Name`,
              uri: `http://affiliation-${count}.gov`,
            },
            status: "PLANNED",
            grantId: null,
            funderOpportunityNumber: `OP-NUM-${count}`,
            funderProjectNumber: null,
          }
        }),
      },
      loading: false
    },
  },

  {
    request: {
      query: ProjectFundingsDocument,
      variables: {
        // Project 2 have no projectFundings
        projectId: 2
      },
    },
    result: {
      data: {
        projectFundings: [],
      },
    },
  },
  {
    request: {
      query: ProjectFundingsDocument,
      variables: {
        // Project 3 also has no projectFundings, but will have best practice templates
        projectId: 3
      },
    },
    result: {
      data: {
        projectFundings: [],
      },
    },
  },
];


// User Me query
const meMocks = [
  {
    request: {
      query: MeDocument,
      variables: {},
    },
    result: {
      data: {
        me: {
          __typename: "User",
          id: 1,
          languageId: "en-US",
          givenName: "user",
          surName: "Admin",
          role: "SUPERADMIN",
          emails: [
            {
              email: "user@example.com",
              id: 16,
              isConfirmed: true,
              isPrimary: true,
              __typename: "UserEmail"
            }
          ],
          errors: {
            __typename: "UserErrors",
            general: null,
            email: null,
            password: null,
            role: null,
          },
          affiliation: {
            __typename: "Affiliation",
            id: 16,
            name: "User Affiliation",
            searchName: "User Affiliation | user-affiliation.gov",
            uri: "http://user-affiliation.gov",
          },
        },
      },
    },
  },
];

// PublishedTemplatesMetaData query
// Mock for projects with funders (projects 1 & 2)
const publishedMetaDataMockWithFunders = {
  request: {
    query: PublishedTemplatesMetaDataDocument,
    variables: {
      paginationOptions: {
        offset: 0,
        limit: 5,
        type: "OFFSET",
        sortDir: "DESC",
        selectOwnerURIs: [],
        bestPractice: false
      },
      term: ""
    },
  },
  result: {
    data: {
      publishedTemplatesMetaData: {
        __typename: "PublishedTemplateMetaDataResults",
        availableAffiliations: [
          "http://affiliation-1.gov",
          "http://affiliation-2.gov"
        ],
        hasBestPracticeTemplates: false,
      },
    },
  },
};

// Mock for project 3: no funders but has best practice templates
const publishedMetaDataMockWithBestPractice = {
  request: {
    query: PublishedTemplatesMetaDataDocument,
    variables: {
      paginationOptions: {
        offset: 0,
        limit: 5,
        type: "OFFSET",
        sortDir: "DESC",
        selectOwnerURIs: [],
        bestPractice: false
      },
      term: ""
    },
  },
  result: {
    data: {
      publishedTemplatesMetaData: {
        __typename: "PublishedTemplateMetaDataResults",
        availableAffiliations: [],
        hasBestPracticeTemplates: true,
      },
    },
  },
};


const publishedTemplatesMocks = [
  // Published Templates, no selectOwners

  {
    request: {
      query: PublishedTemplatesDocument,
      variables: {
        paginationOptions: {
          offset: 0,
          limit: 5,
          type: "OFFSET",
          sortDir: "DESC",
          selectOwnerURIs: [],
          bestPractice: false
        },
        term: ""
      },
    },
    result: {
      data: {
        publishedTemplates: {
          __typename: "PublishedTemplateSearchResults",
          limit: 5,
          nextCursor: null,
          totalCount: 8,
          availableSortFields: ['vt.bestPractice'],
          currentOffset: 1,
          hasNextPage: true,
          hasPreviousPage: false,
          items: Array.from({ length: 5 }, (_, i) => {
            const count = i + 1;
            return {
              __typename: "VersionedTemplateSearchResult",
              id: count,
              bestPractice: (count == 5) ? true : false,
              description: `Template ${count} Description`,
              name: `Template ${count} Name`,
              visibility: "PUBLIC",
              ownerDisplayName: `Template Owner ${count}`,
              ownerURI: `http://template${count}.gov`,
              modified: "2021-10-25 18:42:37",
              modifiedByName: "John Doe",
              modifiedById: 14,
              ownerId: 100 + count,
              version: "v5",
              templateId: 10 + count,
              ownerSearchName: `Owner ${count} Search`,
              versionedTemplateCustomizationId: null
            }
          }),
        },
      },
    },
  },
  {
    request: {
      query: PublishedTemplatesDocument,
      variables: {
        paginationOptions: {
          offset: 0,
          limit: 5,
          type: "OFFSET",
          sortDir: "DESC",
          selectOwnerURIs: [],
          bestPractice: false
        },
        term: ""
      },
    },
    result: {
      data: {
        publishedTemplates: {
          __typename: "PublishedTemplateSearchResults",
          limit: 5,
          nextCursor: null,
          totalCount: 8,
          availableSortFields: ['vt.bestPractice'],
          currentOffset: 1,
          hasNextPage: true,
          hasPreviousPage: false,
          items: Array.from({ length: 5 }, (_, i) => {
            const count = i + 1;
            return {
              __typename: "VersionedTemplateSearchResult",
              id: count,
              bestPractice: (count == 5) ? true : false,
              description: `Template ${count} Description`,
              name: `Template ${count} Name`,
              visibility: "PUBLIC",
              ownerDisplayName: `Template Owner ${count}`,
              ownerURI: `http://template${count}.gov`,
              modified: "2021-10-25 18:42:37",
              modifiedByName: "John Doe",
              modifiedById: 14,
              ownerId: 100 + count,
              version: "v5",
              templateId: 10 + count,
              ownerSearchName: `Owner ${count} Search`,
              versionedTemplateCustomizationId: null
            }
          }),
        },
      },
    },
  },

  // Published with owners
  {
    request: {
      query: PublishedTemplatesDocument,
      variables: {
        paginationOptions: {
          offset: 0,
          limit: 5,
          type: "OFFSET",
          sortDir: "DESC",
          selectOwnerURIs: [
            "http://affiliation-1.gov",
            "http://affiliation-2.gov"
          ],
          bestPractice: false
        },
        term: ""
      },
    },
    result: {
      data: {
        publishedTemplates: {
          __typename: "PublishedTemplateSearchResults",
          limit: 5,
          nextCursor: null,
          totalCount: 8,
          availableSortFields: ['vt.bestPractice'],
          currentOffset: 1,
          hasNextPage: true,
          hasPreviousPage: false,
          items: Array.from({ length: 5 }, (_, i) => {
            const count = i + 1;
            return {
              __typename: "VersionedTemplateSearchResult",
              id: count,
              bestPractice: (count == 5) ? true : false,
              description: `Template ${count} Description`,
              name: `Template ${count} Name`,
              visibility: "PUBLIC",
              ownerDisplayName: `Template Owner ${count}`,
              ownerURI: `http://template${count}.gov`,
              modified: "2021-10-25 18:42:37",
              modifiedByName: "John Doe",
              modifiedById: 14,
              ownerId: 100 + count,
              version: "v5",
              templateId: 10 + count,
              ownerSearchName: `Owner ${count} Search`,
              versionedTemplateCustomizationId: null
            }
          }),
        },
      },
    },
  },

  // Published Templates filtered to a single funder
  {
    request: {
      query: PublishedTemplatesDocument,
      variables: {
        paginationOptions: {
          offset: 0,
          limit: 5,
          type: "OFFSET",
          sortDir: "DESC",
          selectOwnerURIs: [
            "http://affiliation-1.gov",
          ],
          bestPractice: false
        },
        term: ""
      },
    },
    result: {
      data: {
        publishedTemplates: {
          __typename: "PublishedTemplateSearchResults",
          limit: 5,
          nextCursor: null,
          totalCount: 8,
          availableSortFields: ['vt.bestPractice'],
          currentOffset: 1,
          hasNextPage: true,
          hasPreviousPage: false,
          items: [{
            __typename: "VersionedTemplateSearchResult",
            id: 1,
            bestPractice: false,
            description: "Template Description",
            name: "Filtered Template Name",
            visibility: "PUBLIC",
            ownerDisplayName: "Template Owner",
            ownerURI: `http://template1.gov`,
            modified: "2021-10-25 18:42:37",
            modifiedByName: "John Doe",
            modifiedById: 14,
            ownerId: 101,
            version: "v5",
            templateId: 11,
            ownerSearchName: "Owner Search Name",
            versionedTemplateCustomizationId: null
          }],
        },
      },
    },
  },

  // Published Templates With Owners Page 2
  {
    request: {
      query: PublishedTemplatesDocument,
      variables: {
        paginationOptions: {
          offset: 5,
          limit: 5,
          type: "OFFSET",
          sortDir: "DESC",
          selectOwnerURIs: [
            "http://affiliation-1.gov",
            "http://affiliation-2.gov"
          ],
          bestPractice: false
        },
        term: ""
      },
    },
    result: {
      data: {
        publishedTemplates: {
          __typename: "PublishedTemplateSearchResults",
          limit: 5,
          nextCursor: null,
          totalCount: 8,
          availableSortFields: ['vt.bestPractice'],
          currentOffset: 1,
          hasNextPage: true,
          hasPreviousPage: false,
          items: Array.from({ length: 3 }, (_, i) => {
            const count = i + 6;
            return {
              __typename: "VersionedTemplateSearchResult",
              id: count,
              bestPractice: (count == 5) ? true : false,
              description: `Template ${count} Description`,
              name: `Template ${count} Name`,
              visibility: "PUBLIC",
              ownerDisplayName: `Template Owner ${count}`,
              ownerURI: `http://template${count}.gov`,
              modified: "2021-10-25 18:42:37",
              modifiedByName: "John Doe",
              modifiedById: 14,
              ownerId: 100 + count,
              version: "v5",
              templateId: 10 + count,
              ownerSearchName: `Owner ${count} Search`,
              versionedTemplateCustomizationId: null
            }
          }),
        },
      },
      loading: false
    },
  },

  // No results : Term = "no-results"
  {
    request: {
      query: PublishedTemplatesDocument,
      variables: {
        paginationOptions: {
          offset: 0,
          limit: 5,
          type: "OFFSET",
          sortDir: "DESC",
          selectOwnerURIs: [],
          bestPractice: false,
        },
        term: "no-results",
      },
    },
    result: {
      data: {
        publishedTemplates: {
          __typename: "PublishedTemplateSearchResults",
          limit: 5,
          nextCursor: null,
          totalCount: 0,
          availableSortFields: ['vt.bestPractice'],
          currentOffset: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          items: [],
        },
      },
      loading: false
    },
  },

  // Search term = NSF
  {
    request: {
      query: PublishedTemplatesDocument,
      variables: {
        paginationOptions: {
          offset: 0,
          limit: 5,
          type: "OFFSET",
          sortDir: "DESC",
          selectOwnerURIs: [],
          bestPractice: false
        },
        term: "NSF"
      },
    },
    result: {
      data: {
        publishedTemplates: {
          __typename: "PublishedTemplateSearchResults",
          limit: 5,
          nextCursor: null,
          totalCount: 1,
          availableSortFields: ['vt.bestPractice'],
          currentOffset: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          items: [
            {
              __typename: "VersionedTemplateSearchResult",
              bestPractice: false,
              description: "NSF SEARCH",
              id: "1",
              name: "NSF Search",
              visibility: "PUBLIC",
              ownerDisplayName: "National Science Foundation (nsf.gov)",
              ownerURI: "http://nsf.gov",
              modified: "2021-10-25 18:42:37",
              modifiedByName: "John Doe",
              modifiedById: 14,
              ownerId: 122,
              version: "v5",
              templateId: 4,
              ownerSearchName: "National Science Foundation | nsf.gov | NSF",
              versionedTemplateCustomizationId: null
            },
          ]
        },
      },
      loading: false
    },
  },
  // Best practice templates only (for project 3)
  {
    request: {
      query: PublishedTemplatesDocument,
      variables: {
        paginationOptions: {
          offset: 0,
          limit: 5,
          type: "OFFSET",
          sortDir: "DESC",
          selectOwnerURIs: [],
          bestPractice: true
        },
        term: ""
      },
    },
    result: {
      data: {
        publishedTemplates: {
          __typename: "PublishedTemplateSearchResults",
          limit: 5,
          nextCursor: null,
          totalCount: 2,
          availableSortFields: ['vt.bestPractice'],
          currentOffset: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          items: [
            {
              __typename: "VersionedTemplateSearchResult",
              id: 100,
              bestPractice: true,
              description: "Best Practice Template Description",
              name: "Best Practice Template",
              visibility: "PUBLIC",
              ownerDisplayName: "Best Practice Owner",
              ownerURI: "http://bestpractice.gov",
              modified: "2021-10-25 18:42:37",
              modifiedByName: "Jane Smith",
              modifiedById: 15,
              ownerId: 200,
              version: "v1",
              templateId: 50,
              ownerSearchName: "Best Practice Owner Search",
              versionedTemplateCustomizationId: null
            },
          ]
        },
      },
      loading: false
    },
  },
  {
    request: {
      query: PublishedTemplatesDocument,
      variables: {
        paginationOptions: {
          offset: 0,
          limit: 5,
          type: "OFFSET",
          sortDir: "DESC",
          selectOwnerURIs: ["http://affiliation-1.gov", "http://affiliation-2.gov"],
          bestPractice: false
        },
        term: ""
      },
    },
    result: {
      data: {
        publishedTemplates: {
          __typename: "PublishedTemplateSearchResults",
          limit: 5,
          nextCursor: null,
          totalCount: 1,
          availableSortFields: ['vt.bestPractice'],
          currentOffset: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          items: Array.from({ length: 3 }, (_, i) => {
            const count = i + 6;
            return {
              __typename: "VersionedTemplateSearchResult",
              id: count,
              bestPractice: (count == 5) ? true : false,
              description: `Template ${count} Description`,
              name: `Template ${count} Name`,
              visibility: "PUBLIC",
              ownerDisplayName: `Template Owner ${count}`,
              ownerURI: `http://template${count}.gov`,
              modified: "2021-10-25 18:42:37",
              modifiedByName: "John Doe",
              modifiedById: 14,
              ownerId: 100 + count,
              version: "v5",
              templateId: 10 + count,
              ownerSearchName: `Owner ${count} Search`,
              versionedTemplateCustomizationId: null
            }
          }),
        },
      },
      loading: false
    },
  },
  {
    request: {
      query: PublishedTemplatesDocument,
      variables: {
        paginationOptions: {
          offset: 0,
          limit: 5,
          type: "OFFSET",
          sortDir: "DESC",
          selectOwnerURIs: ["http://affiliation-1.gov", "http://affiliation-2.gov"],
          bestPractice: false
        },
        term: "NSF"
      },
    },
    result: {
      data: {
        publishedTemplates: {
          __typename: "PublishedTemplateSearchResults",
          limit: 5,
          nextCursor: null,
          totalCount: 1,
          availableSortFields: ['vt.bestPractice'],
          currentOffset: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          items: [
            {
              __typename: "VersionedTemplateSearchResult",
              bestPractice: false,
              description: "NSF SEARCH",
              id: "1",
              name: "NSF Search",
              visibility: "PUBLIC",
              ownerDisplayName: "National Science Foundation (nsf.gov)",
              ownerURI: "http://nsf.gov",
              modified: "2021-10-25 18:42:37",
              modifiedByName: "John Doe",
              modifiedById: 14,
              ownerId: 122,
              version: "v5",
              templateId: 4,
              ownerSearchName: "National Science Foundation | nsf.gov | NSF",
              versionedTemplateCustomizationId: null
            },
          ]
        },
      },
      loading: false
    },
  },
  {
    request: {
      query: PublishedTemplatesDocument,
      variables: {
        paginationOptions: {
          offset: 0,
          limit: 5,
          type: "OFFSET",
          sortDir: "DESC",
          selectOwnerURIs: [
            "http://affiliation-1.gov",
            "http://affiliation-2.gov"
          ],
          bestPractice: false
        },
        term: ""
      },
    },
    result: {
      data: {
        publishedTemplates: {
          __typename: "PublishedTemplateSearchResults",
          limit: 5,
          nextCursor: null,
          totalCount: 8,
          availableSortFields: ['vt.bestPractice'],
          currentOffset: 1,
          hasNextPage: true,
          hasPreviousPage: false,
          items: Array.from({ length: 5 }, (_, i) => {
            const count = i + 1;
            return {
              __typename: "VersionedTemplateSearchResult",
              id: count,
              bestPractice: (count == 5) ? true : false,
              description: `Template ${count} Description`,
              name: `Template ${count} Name`,
              visibility: "PUBLIC",
              ownerDisplayName: `Template Owner ${count}`,
              ownerURI: `http://template${count}.gov`,
              modified: "2021-10-25 18:42:37",
              modifiedByName: "John Doe",
              modifiedById: 14,
              ownerId: 100 + count,
              version: "v5",
              templateId: 10 + count,
              ownerSearchName: `Owner ${count} Search`,
              versionedTemplateCustomizationId: null
            }
          }),
        },
      },
    },
  },

];

const errorMocks = [
  {
    request: {
      query: PublishedTemplatesMetaDataDocument,
      variables: {
        paginationOptions: {
          offset: 0,
          limit: 5,
          type: "OFFSET",
          sortDir: "DESC",
          selectOwnerURIs: [],
          bestPractice: false
        },
        term: ""
      },
    },
    error: new Error("There was an error"),
  },

  {
    request: {
      query: PublishedTemplatesDocument,
      variables: {
        paginationOptions: {
          offset: 0,
          limit: 5,
          type: "OFFSET",
          sortDir: "DESC",
          selectOwnerURIs: [],
          bestPractice: false
        },
        term: ""
      },
    },
    error: new Error("There was an error"),
  },

  {
    request: {
      query: PublishedTemplatesDocument,
      variables: {
        paginationOptions: {
          offset: 0,
          limit: 5,
          type: "OFFSET",
          sortDir: "DESC",
          selectOwnerURIs: [],
          bestPractice: false
        },
        term: ""
      },
    },
    error: new Error("There was an error"),
  },
];


const addPlanMocks = [
  // AddPlan mutation
  {
    request: {
      query: AddPlanDocument,
      variables: {
        projectId: 1,
        versionedTemplateId: 1
      },
    },
    result: {
      data: {
        addPlan: {
          __typename: "AddPlan",
          id: 7,
          errors: {
            general: null,
            versionedTemplateId: null,
            projectId: null,
          }
        },
      },
    },
  },

  // AddPlan with general errors
  {
    request: {
      query: AddPlanDocument,
      variables: {
        projectId: 2,
        versionedTemplateId: 1
      },
    },
    result: {
      data: {
        addPlan: {
          __typename: "AddPlan",
          id: 7,
          errors: {
            general: "General error",
            versionedTemplateId: null,
            projectId: null,
          },
        },
      },
    },
  },


  {
    request: {
      query: AddPlanFundingDocument,
      variables: {
        planId: 7,
        projectFundingIds: [1, 2, 3],
      }
    },
    result: {
      data: {
        addPlanFunding: {
          __typename: "AddPlanFunding",
          errors: {
            __typename: "PlanFundingErrors",
            general: null,
          },
        },
      },
    },
  },
];

const addPlanErrMocks = [
  // addPlan general error
  {
    request: {
      query: AddPlanDocument,
      variables: {
        // Project 1 just returns a general error
        projectId: 1,
        versionedTemplateId: 1
      },
    },
    error: new Error("There was an error"),
  },

  // Project ID 2 should get past the first step, but fail when adding funders
  {
    request: {
      query: AddPlanDocument,
      variables: {
        // Project ID 2 will return a general error
        projectId: 2,
        versionedTemplateId: 1,
      },
    },
    result: {
      data: {
        addPlan: {
          __typename: "AddPlan",
          id: 7,
          errors: {
            general: null,
            versionedTemplateId: null,
            projectId: null,
          },
        }
      },
    },
  },

  {
    request: {
      query: AddPlanFundingDocument,
      variables: {
        planId: 7,
        projectFundingIds: [],
      }
    },
    error: new Error("There was an error"),
  },
];

const baseMocks = [
  ...meMocks,
  ...projectFundingsMocks,
  publishedMetaDataMockWithFunders,
  ...publishedTemplatesMocks,
  ...addPlanMocks,
  ...addPlanErrMocks,
];

/**
 * - For projectId=1: Affiliations 1 & 2 match, so checkboxes appear PRE-CHECKED and templates are filtered
 * - For projectId=2: No fundings, so no checkboxes appear and all templates are shown
 * 
 * Tests must wait for this initialization sequence:
 * 1. Initial queries (ProjectFundings, Me, PublishedTemplatesMetaData) complete
 * 2. fundersData is computed and initialFilterConfig is determined
 * 3. The initialization useEffect runs and triggers the lazy PublishedTemplates query
 * 4. Templates render with appropriate filters applied
 */

describe('PlanCreate Component using base mock', () => {
  const mockUseParams = useParams as jest.Mock;
  let apolloCache: InMemoryCache;

  beforeEach(() => {
    // Create fresh cache for each test
    apolloCache = new InMemoryCache();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
    mockUseParams.mockReturnValue({ projectId: '1' });

    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    (useToast as jest.Mock).mockReturnValue(mockToast);
  });

  afterEach(() => {
    jest.clearAllMocks();
    apolloCache.reset();
    cleanup();
  })


  it('should render PlanCreate component with funder checkbox', async () => {
    mockUseParams.mockReturnValue({ projectId: '1' });

    render(
      <MockedProvider mocks={baseMocks} cache={apolloCache}>
        <PlanCreate />
      </MockedProvider>
    );

    // Wait for ALL three queries to resolve before checking checkboxes
    // The checkboxes only appear after fundersData is computed from all three queries
    await waitFor(() => {
      expect(screen.getAllByText('buttons.select').length).toBeGreaterThan(0);
    }, { timeout: 10000 });

    // Now check for checkboxes — templates rendered means initialFilterConfig ran
    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: 'Affiliation 1 Name' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Affiliation 2 Name' })).toBeInTheDocument();
    }, { timeout: 10000 });

    expect(screen.getByRole('checkbox', { name: 'Affiliation 1 Name' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Affiliation 2 Name' })).toBeChecked();

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }, 15000);

  // it('should handle funder filter changes', async () => {
  //   render(
  //     <MockedProvider mocks={getBaseMocks()} cache={apolloCache}>
  //       <PlanCreate />
  //     </MockedProvider>
  //   );

  //   // Wait for the funder filter section to be rendered
  //   await waitFor(
  //     () => {
  //       const filterGroup = screen.getByTestId('checkbox-group');
  //       expect(filterGroup).toBeInTheDocument();
  //     },
  //     { timeout: 10000 }
  //   );

  //   // Get checkboxes by value (funders)
  //   const allCheckboxes = screen.getAllByRole('checkbox');
  //   const checkbox1 = allCheckboxes.find(cb => (cb as HTMLInputElement).value === 'http://affiliation-1.gov') as HTMLInputElement;
  //   const checkbox2 = allCheckboxes.find(cb => (cb as HTMLInputElement).value === 'http://affiliation-2.gov') as HTMLInputElement;

  //   expect(checkbox1).toBeDefined();
  //   expect(checkbox2).toBeDefined();
  //   expect(checkbox1.checked).toBe(true);
  //   expect(checkbox2.checked).toBe(true);

  //   // Uncheck the second affiliation item
  //   fireEvent.click(checkbox2);

  //   await waitFor(() => {
  //     // Only Affiliation 1 should remain checked
  //     const allCheckboxes = screen.getAllByRole('checkbox');
  //     const checkbox1 = allCheckboxes.find(cb => (cb as HTMLInputElement).value === 'http://affiliation-1.gov') as HTMLInputElement;
  //     const checkbox2 = allCheckboxes.find(cb => (cb as HTMLInputElement).value === 'http://affiliation-2.gov') as HTMLInputElement;
  //     expect(checkbox1.checked).toBe(true);
  //     expect(checkbox2.checked).toBe(false);

  //     // Only the filtered template should be shown
  //     expect(screen.getAllByText('buttons.select')).toHaveLength(1);
  //     expect(screen.getByRole('heading', { level: 2, name: 'Filtered Template Name' })).toBeInTheDocument();
  //   });

  //   await act(async () => {
  //     await new Promise(resolve => setTimeout(resolve, 0));
  //   });
  // }, 15000);

  it('should handle no items found in search', async () => {
    render(
      <MockedProvider mocks={baseMocks} cache={apolloCache}>
        <PlanCreate />
      </MockedProvider>
    );

    await waitFor(() => {
      const searchInput = screen.getByLabelText('Template search');
      fireEvent.change(searchInput, { target: { value: 'no-results' } });

      const searchButton = screen.getByText('buttons.search');
      fireEvent.click(searchButton);
    });

    // There should be two matches to the search for 'test'
    await waitFor(() => {
      expect(screen.getByText('messaging.noItemsFound')).toBeInTheDocument();
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }, 10000);

  it('should return matching templates on search item', async () => {
    render(
      <MockedProvider mocks={baseMocks} cache={apolloCache}>
        <PlanCreate />
      </MockedProvider>
    );

    await waitFor(() => {
      const searchInput = screen.getByLabelText('Template search');
      // Enter matching search term
      fireEvent.change(searchInput, { target: { value: 'NSF' } });

      // Click search button
      const searchButton = screen.getByText('buttons.search');
      fireEvent.click(searchButton);
    }, { timeout: 3000 });

    await waitFor(() => {
      // Should bring up this matching template
      expect(screen.getByRole('heading', { level: 2, name: /NSF Search/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    //Empty out the search text
    const searchInput = screen.getByLabelText('Template search');
    fireEvent.change(searchInput, { target: { value: '' } });

    await waitFor(() => {
      // Should expect to see a template from initial load
      screen.getByRole('heading', { level: 2, name: "Template 1 Name" });
    }, { timeout: 3000 });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }, 10000);

  it('should reset templates if user clicks on \'clear filter\' link', async () => {
    render(
      <MockedProvider mocks={baseMocks} cache={apolloCache}>
        <PlanCreate />
      </MockedProvider>
    );

    await waitFor(() => {
      const searchInput = screen.getByLabelText('Template search');
      // Enter matching search term
      fireEvent.change(searchInput, { target: { value: 'NSF' } });

      // Click search button
      const searchButton = screen.getByText('buttons.search');
      fireEvent.click(searchButton);
    }, { timeout: 3000 });

    await waitFor(() => {
      // Should bring up this matching template
      expect(screen.getByRole('heading', { level: 2, name: /NSF Search/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    //Click clear filter button
    const clearFilterBtn = screen.getByTestId('clear-filter');
    fireEvent.click(clearFilterBtn);

    await waitFor(() => {
      // Should expect to see a template from initial load
      screen.getByRole('heading', { level: 2, name: "Template 1 Name" });
    }, { timeout: 3000 });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }, 10000);

  it('should not show any checkboxes if no project funders and no best practice', async () => {
    // Project 2 doesn't have any funders
    mockUseParams.mockReturnValue({ projectId: '2' });
    render(
      <MockedProvider mocks={baseMocks} cache={apolloCache}>
        <PlanCreate />
      </MockedProvider>
    );

    // Wait for component to fully initialize
    await waitFor(() => {
      expect(screen.getAllByText('buttons.select').length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // After initialization, there should be no checkboxes
    const funderCheckboxes = screen.queryAllByRole('checkbox');
    expect(funderCheckboxes).toHaveLength(0);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }, 10000);

  it('should show best practice checkbox when no funders but best practice templates exist', async () => {
    // Project 3 has no funders but has best practice templates
    mockUseParams.mockReturnValue({ projectId: '3' });

    // Use custom mocks for this test - use publishedMetaDataMockWithBestPractice instead
    const customMocks = [
      ...meMocks,
      ...projectFundingsMocks,
      publishedMetaDataMockWithBestPractice,
      ...publishedTemplatesMocks,
      ...addPlanMocks,
      ...addPlanErrMocks,
    ];

    act(() => {
      render(
        <MockedProvider mocks={customMocks} cache={apolloCache}>
          <PlanCreate />
        </MockedProvider>
      );
    });

    // Wait for component to initialize and templates to load
    await waitFor(() => {
      expect(screen.getAllByText('buttons.select').length).toBeGreaterThan(0);
    }, { timeout: 10000 });

    // Should show the best practice checkbox
    await waitFor(() => {
      const bestPracticeCheckbox = screen.getByRole('checkbox', { name: 'best practices' });
      expect(bestPracticeCheckbox).toBeInTheDocument();
      // Best practice checkbox should be pre-checked based on initialFilterConfig
      expect(bestPracticeCheckbox).toBeChecked();
    }, { timeout: 10000 });

    // Should display best practice template
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Best Practice Template' })).toBeInTheDocument();
    }, { timeout: 3000 });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }, 10000);

  it('should display error state', async () => {
    // Project 2 doesn't have any funders
    mockUseParams.mockReturnValue({ projectId: '2' });

    const mocks = [
      ...meMocks,
      ...projectFundingsMocks,
      ...errorMocks,
    ];

    render(
      <MockedProvider mocks={mocks} cache={apolloCache}>
        <PlanCreate />
      </MockedProvider>
    );

    // There should be an error from the initial load
    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'Plan Create queries',
        expect.objectContaining({
          error: expect.anything(),
          url: { path: '/en-US/projects/2/dmp/create' },
        })
      )
      expect(mockToast.add).toHaveBeenCalledWith('messaging.somethingWentWrong', { type: 'error' });
      expect(mockRouter.push).toHaveBeenCalledWith('/en-US/projects/2');
    }, { timeout: 3000 });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }, 10000);

  it('should handle general error from addPlan mutation', async () => {
    // Project 2 will return errors
    mockUseParams.mockReturnValue({ projectId: '2' });

    render(
      <MockedProvider mocks={baseMocks} cache={apolloCache}>
        <PlanCreate />
      </MockedProvider>
    );

    // Find the first template and select it
    await waitFor(() => {
      expect(screen.getAllByText('buttons.select')).toHaveLength(5);
    }, { timeout: 3000 });

    const btn = screen.getAllByText('buttons.select')[0];
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText("General error")).toBeInTheDocument();
      expect(mockToast.add).toHaveBeenCalledWith('messaging.somethingWentWrong', { type: 'error' });
    }, { timeout: 3000 });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }, 10000);

  it('should handle server errors on addPlan mutation', async () => {
    // ProjectId 1 needs only the first metadata mock (with affiliations)
    const mocks = [
      ...meMocks,
      ...projectFundingsMocks,
      publishedMetaDataMockWithFunders,
      ...publishedTemplatesMocks,
      ...addPlanErrMocks,
    ];

    render(
      <MockedProvider mocks={mocks} cache={apolloCache}>
        <PlanCreate />
      </MockedProvider>
    );

    await screen.findByText('breadcrumbs.home');
    // Find the first template and select it
    await waitFor(() => {
      const buttons = screen.queryAllByText('buttons.select');
      expect(buttons.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    await waitFor(() => {
      const buttons = screen.getAllByText('buttons.select');
      const btn = buttons[0];
      fireEvent.click(btn);
    })

    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'addPlanMutation',
        expect.objectContaining({
          error: expect.anything(),
          url: { path: '/en-US/projects/1/dmp/create' },
        })
      )
      expect(mockToast.add).toHaveBeenCalledWith('messaging.somethingWentWrong', { type: 'error' });
    }, { timeout: 3000 });
  }, 10000);

  it('should handle server errors on addPlanFunding mutation', async () => {
    // Project 2 return a server for the second step
    mockUseParams.mockReturnValue({ projectId: '2' });

    const mocks = [
      ...meMocks,
      ...projectFundingsMocks,
      publishedMetaDataMockWithFunders,
      ...publishedTemplatesMocks,
      ...addPlanErrMocks,
    ];

    render(
      <MockedProvider mocks={mocks} cache={apolloCache}>
        <PlanCreate />
      </MockedProvider>
    );

    // Find the first template and select it
    await waitFor(() => {
      expect(screen.getAllByText('buttons.select')).toHaveLength(5);
    }, { timeout: 3000 });

    const btn = screen.getAllByText('buttons.select')[0];
    fireEvent.click(btn);

    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'addPlanMutation',
        expect.objectContaining({
          error: expect.anything(),
          url: { path: '/en-US/projects/2/dmp/create' },
        })
      )
      expect(mockToast.add).toHaveBeenCalledWith('messaging.somethingWentWrong', { type: 'error' });
    }, { timeout: 3000 });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }, 10000);

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <MockedProvider mocks={baseMocks} cache={apolloCache}>
        <PlanCreate />
      </MockedProvider>
    );

    // Wait for component to fully render
    await waitFor(() => {
      expect(screen.getAllByTestId('template-metadata')).toHaveLength(5);
    }, { timeout: 3000 });

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  }, 10000);
});
