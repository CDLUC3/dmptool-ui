import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { AllProjectsDocument } from "@/generated/graphql";
import { axe, toHaveNoViolations } from "jest-axe";
import OrganizationProjectsListPage from "../page";
import { useFormatter, useTranslations } from "next-intl";
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";

expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/admin/projects'),
}));

// Mock next-intl hooks
jest.mock("next-intl", () => ({
  useFormatter: jest.fn(),
  useTranslations: jest.fn(),
}));

const mocks = [
  // Initial load mock
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
        },
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations",
              id: 1,
              startDate: "2025-09-01",
              endDate: "2028-12-31",
              fundings: [
                {
                  name: "National Science Foundation",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Jacques Cousteau",
                  role: "Data Manager, Formal analysis",
                  orcid: "https://orcid.org/0000-JACQ-0000-0000",
                },
              ],
              errors: null,
            },
            {
              title: "Project 2",
              id: 2,
              startDate: "2025-01-01",
              endDate: "2027-12-31",
              fundings: [
                {
                  name: "National Science Foundation (nsf.gov)",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Betty White",
                  role: "Principal",
                  orcid: "https://orcid.org/0000-BETTY-0000-0000",
                },
              ],
              errors: null,
            },
            {
              title: "Project 2",
              id: 3,
              startDate: "2025-09-01",
              endDate: "2028-12-31",
              fundings: [
                {
                  name: "NASA",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Captain Jack",
                  role: "Data manager",
                  orcid: "https://orcid.org/0000-CAPTAIN-0000-0000",
                },
              ],
              errors: null,
            },
          ],
        },
      },
    },
  },
  // Second call
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
        },
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations",
              id: 4,
              startDate: "2025-09-01",
              endDate: "2028-12-31",
              fundings: [
                {
                  name: "National Science Foundation",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Jacques Cousteau",
                  role: "Data Manager, Formal analysis",
                  orcid: "https://orcid.org/0000-JACQ-0000-0000",
                },
              ],
              errors: null,
            },
            {
              title: "Project 2",
              id: 5,
              startDate: "2025-01-01",
              endDate: "2027-12-31",
              fundings: [
                {
                  name: "National Science Foundation (nsf.gov)",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Betty White",
                  role: "Principal",
                  orcid: "https://orcid.org/0000-BETTY-0000-0000",
                },
              ],
              errors: null,
            },
            {
              title: "Project 2",
              id: 6,
              startDate: "2025-09-01",
              endDate: "2028-12-31",
              fundings: [
                {
                  name: "NASA",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Captain Jack",
                  role: "Data manager",
                  orcid: "https://orcid.org/0000-CAPTAIN-0000-0000",
                },
              ],
              errors: null,
            },
          ],
        },
      },
    },
  },
  // Search results with cursor
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          type: "CURSOR",
          cursor: "2025-08-05_00:00:004",
          limit: 10,
        },
        term: "reef",
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Project 3",
              id: 7,
              startDate: "2025-09-01",
              endDate: "2028-12-31",
              fundings: [
                {
                  name: "National Science Foundation",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Jacques Cousteau",
                  role: "Data Manager, Formal analysis",
                  orcid: "https://orcid.org/0000-JACQ-0000-0000",
                },
              ],
              errors: null,
            },
            {
              title: "Project 4",
              id: 8,
              startDate: "2025-01-01",
              endDate: "2027-12-31",
              fundings: [
                {
                  name: "National Science Foundation (nsf.gov)",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Betty White",
                  role: "Principal",
                  orcid: "https://orcid.org/0000-BETTY-0000-0000",
                },
              ],
              errors: null,
            },
            {
              title: "Project 5",
              id: 9,
              startDate: "2025-09-01",
              endDate: "2028-12-31",
              fundings: [
                {
                  name: "NASA",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Captain Jack",
                  role: "Data manager",
                  orcid: "https://orcid.org/0000-CAPTAIN-0000-0000",
                },
              ],
              errors: null,
            },
          ],
        },
      },
    },
  },
  // Load more results
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          type: "CURSOR",
          cursor: "2025-08-05_00:00:004",
          limit: 10,
        },
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Project 3",
              id: 10,
              startDate: "2025-09-01",
              endDate: "2028-12-31",
              fundings: [
                {
                  name: "National Science Foundation",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Jacques Cousteau",
                  role: "Data Manager, Formal analysis",
                  orcid: "https://orcid.org/0000-JACQ-0000-0000",
                },
              ],
              errors: null,
            },
            {
              title: "Project 4",
              id: 11,
              startDate: "2025-01-01",
              endDate: "2027-12-31",
              fundings: [
                {
                  name: "National Science Foundation (nsf.gov)",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Betty White",
                  role: "Principal",
                  orcid: "https://orcid.org/0000-BETTY-0000-0000",
                },
              ],
              errors: null,
            },
            {
              title: "Project 5",
              id: 12,
              startDate: "2025-09-01",
              endDate: "2028-12-31",
              fundings: [
                {
                  name: "NASA",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Captain Jack",
                  role: "Data manager",
                  orcid: "https://orcid.org/0000-CAPTAIN-0000-0000",
                },
              ],
              errors: null,
            },
          ],
        },
      },
    },
  },
  // Search results
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
          type: "CURSOR",
        },
        term: "reef",
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Reef One",
              id: 13,
              startDate: "2025-01-01",
              endDate: "2027-12-31",
              fundings: [
                {
                  name: "NIH",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Betty White",
                  role: "Principal",
                  orcid: "https://orcid.org/0000-BETTY-0000-0000",
                },
              ],
              errors: null,
            },
          ],
        },
      },
    },
  },
  // Search results
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
          type: "CURSOR",
        },
        term: "throw",
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations",
              id: 14,
              startDate: "2025-09-01",
              endDate: "2028-12-31",
              fundings: [
                {
                  name: "National Science Foundation",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Jacques Cousteau",
                  role: "Data Manager, Formal analysis",
                  orcid: "https://orcid.org/0000-JACQ-0000-0000",
                },
              ],
              errors: {
                general: "There was an error getting the projects",
              },
            },
          ],
        },
      },
    },
  },
  // Search returns an error
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          type: "CURSOR",
          limit: 10,
          cursor: "2025-08-05_00:00:004",
        },
        term: "throw",
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations",
              id: 15,
              startDate: "2025-09-01",
              endDate: "2028-12-31",
              fundings: [
                {
                  name: "National Science Foundation",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Jacques Cousteau",
                  role: "Data Manager, Formal analysis",
                  orcid: "https://orcid.org/0000-JACQ-0000-0000",
                },
              ],
              errors: {
                general: "There was an error getting the projects",
              },
            },
          ],
        },
      },
    },
  },
  // With paginationOptions type
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
          type: "CURSOR",
        },
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations",
              id: 16,
              startDate: "2025-09-01",
              endDate: "2028-12-31",
              fundings: [
                {
                  name: "National Science Foundation",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Jacques Cousteau",
                  role: "Data Manager, Formal analysis",
                  orcid: "https://orcid.org/0000-JACQ-0000-0000",
                },
              ],
              errors: null,
            },
          ],
        },
      },
    },
  },
  // Empty search results mock
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          type: "CURSOR",
          limit: 10,
        },
        term: "nonexistent project",
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          items: [],
          nextCursor: null,
          totalCount: 0,
        },
      },
    },
  },
  // Clear-filter refetch (term: "")
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
        },
        term: "",
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations",
              id: 1,
              startDate: "2025-09-01",
              endDate: "2028-12-31",
              fundings: [
                {
                  name: "National Science Foundation",
                  grantId: null,
                },
              ],
              members: [
                {
                  name: "Jacques Cousteau",
                  role: "Data Manager, Formal analysis",
                  orcid: "https://orcid.org/0000-JACQ-0000-0000",
                },
              ],
              errors: null,
            },
          ],
        },
      },
    },
  },
];

const emptyProjectsMocks = [
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
        },
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          items: [],
          nextCursor: null,
          totalCount: 0,
        },
      },
    },
  },
];

const emptyProjectsNullTotalCountMocks = [
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
        },
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          items: [],
          nextCursor: null,
          totalCount: null,
        },
      },
    },
  },
];

const delayedEmptyProjectsMocks = [
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
        },
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          items: [],
          nextCursor: null,
          totalCount: 0,
        },
      },
    },
    delay: 500,
  },
];

const initialLoadErrorMocks = [
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
        },
        filterOptions: {},
      },
    },
    error: new Error("Network error"),
  },
];

const hungInitialLoadMocks = [
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
        },
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          items: [],
          nextCursor: null,
          totalCount: 0,
        },
      },
    },
    delay: 60000,
  },
];

const searchErrorMocks = [
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
        },
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations",
              id: 1,
              errors: null,
            },
          ],
        },
      },
    },
  },
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          type: "CURSOR",
          limit: 10,
        },
        term: "reef",
        filterOptions: {},
      },
    },
    error: new Error("Network error"),
  },
];

const resetSearchErrorMocks = [
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
        },
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Initial Project",
              id: 1,
              startDate: "2025-01-01",
              endDate: "2027-12-31",
              fundings: [{ name: "NIH", grantId: null }],
              members: [
                {
                  name: "Betty White",
                  role: "Principal",
                  orcid: "https://orcid.org/0000-BETTY-0000-0000",
                },
              ],
              errors: null,
            },
          ],
        },
      },
    },
  },
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
          type: "CURSOR",
        },
        term: "reef",
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Reef One",
              id: 13,
              startDate: "2025-01-01",
              endDate: "2027-12-31",
              fundings: [{ name: "NIH", grantId: null }],
              members: [
                {
                  name: "Betty White",
                  role: "Principal",
                  orcid: "https://orcid.org/0000-BETTY-0000-0000",
                },
              ],
              errors: null,
            },
          ],
        },
      },
    },
  },
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
        },
        term: "",
        filterOptions: {},
      },
    },
    error: new Error("Network error"),
  },
];

const searchLoadMoreNetworkErrorMocks = [
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
        },
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Initial Project",
              id: 1,
              startDate: "2025-01-01",
              endDate: "2027-12-31",
              fundings: [{ name: "NIH", grantId: null }],
              members: [
                {
                  name: "Betty White",
                  role: "Principal",
                  orcid: "https://orcid.org/0000-BETTY-0000-0000",
                },
              ],
              errors: null,
            },
          ],
        },
      },
    },
  },
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
          type: "CURSOR",
        },
        term: "reef",
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Reef One",
              id: 13,
              startDate: "2025-01-01",
              endDate: "2027-12-31",
              fundings: [{ name: "NIH", grantId: null }],
              members: [
                {
                  name: "Betty White",
                  role: "Principal",
                  orcid: "https://orcid.org/0000-BETTY-0000-0000",
                },
              ],
              errors: null,
            },
          ],
        },
      },
    },
  },
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          type: "CURSOR",
          cursor: "2025-08-05_00:00:004",
          limit: 10,
        },
        term: "reef",
        filterOptions: {},
      },
    },
    error: new Error("Network error"),
  },
];

const loadMoreNetworkErrorMocks = [
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
        },
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations",
              id: 1,
              startDate: "2025-09-01",
              endDate: "2028-12-31",
              fundings: [{ name: "National Science Foundation", grantId: null }],
              members: [
                {
                  name: "Jacques Cousteau",
                  role: "Data Manager, Formal analysis",
                  orcid: "https://orcid.org/0000-JACQ-0000-0000",
                },
              ],
              errors: null,
            },
          ],
        },
      },
    },
  },
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          type: "CURSOR",
          cursor: "2025-08-05_00:00:004",
          limit: 10,
        },
        filterOptions: {},
      },
    },
    error: new Error("Network error"),
  },
];

const titleOnlyItemErrorMocks = [
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
        },
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 1,
          nextCursor: null,
          items: [
            {
              title: "Title Only Error Project",
              id: 99,
              startDate: "2025-01-01",
              endDate: "2027-12-31",
              fundings: [{ name: "NIH", grantId: null }],
              members: [
                {
                  name: "Betty White",
                  role: "Principal",
                  orcid: "https://orcid.org/0000-BETTY-0000-0000",
                },
              ],
              errors: { title: "x" },
            },
          ],
        },
      },
    },
  },
];

const datesAndPlansMocks = [
  {
    request: {
      query: AllProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 10,
        },
        filterOptions: {},
      },
    },
    result: {
      data: {
        allProjects: {
          totalCount: 2,
          nextCursor: null,
          items: [
            {
              title: "Dated Project",
              id: 50,
              myAccessLevel: "OWN",
              startDate: "2025-01-01",
              endDate: "2027-12-31",
              modified: "1785236348000",
              fundings: [{ name: "National Science Foundation", grantId: null }],
              members: [
                {
                  name: "Jacques Cousteau",
                  role: "Data Manager, Formal analysis",
                  orcid: "https://orcid.org/0000-JACQ-0000-0000",
                },
              ],
              plans: [
                { id: null, title: "Skipped" },
                {
                  id: 21,
                  title: "Visible Plan",
                  dmpId: "dmp-21",
                  status: "DRAFT",
                  modified: "1785236348000",
                },
              ],
              errors: null,
            },
            {
              title: "Overflow Modified Project",
              id: 51,
              startDate: "2025-01-01",
              endDate: "2027-12-31",
              // Overflowing digits so Number() is Infinity and parseApiDate takes the NaN arm
              modified: "9".repeat(30),
              fundings: [{ name: "NIH", grantId: null }],
              members: [
                {
                  name: "Betty White",
                  role: "Principal",
                  orcid: "https://orcid.org/0000-BETTY-0000-0000",
                },
              ],
              errors: null,
            },
          ],
        },
      },
    },
  },
];

const filteredProjectsMock = (filterOptions: Record<string, string>, items: unknown[]) => ({
  request: {
    query: AllProjectsDocument,
    variables: {
      paginationOptions: {
        type: "CURSOR",
        limit: 10,
      },
      filterOptions,
    },
  },
  result: {
    data: {
      allProjects: {
        totalCount: items.length,
        nextCursor: null,
        items,
      },
    },
  },
});

const statusFilterMocks = [
  mocks[0],
  filteredProjectsMock({ status: "DRAFT" }, [
    {
      ...mocks[0].result.data.allProjects.items[0],
      plans: [
        { id: 31, title: "Draft Plan", dmpId: "dmp-31", status: "DRAFT", modified: "1785236348000" },
        { id: 32, title: "Complete Plan", dmpId: "dmp-32", status: "COMPLETE", modified: "1785236348000" },
      ],
    },
  ]),
];

// Refetch sent by "Clear filters": no search term and no filter options
const clearFiltersMock = {
  request: {
    query: AllProjectsDocument,
    variables: {
      paginationOptions: {
        limit: 10,
      },
      term: "",
      filterOptions: {},
    },
  },
  result: mocks[0].result,
};

const clearFiltersMocks = [...statusFilterMocks, clearFiltersMock];

const roleFilterNoResultsMocks = [
  mocks[0],
  filteredProjectsMock({ accessLevel: "COMMENT" }, []),
];

describe("OrganizationProjectsListPage", () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();

    (useFormatter as jest.Mock).mockReturnValue({
      dateTime: jest.fn((date) => date.toLocaleDateString()),
    });

    (useTranslations as jest.Mock).mockImplementation((namespace) => {
      return (key: string) => `${namespace}.${key}`;
    });
  });

  afterEach(async () => {
    // Give more time for pending queries to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });


  it("should render the OrganizationProjectsListPage component", async () => {
    await act(async () => {
      render(
        <MockedProvider
          mocks={mocks}
        >
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Global.breadcrumbs.home/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Global.breadcrumbs.admin/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /OrganizationProjects.title/i })).toBeInTheDocument();
      expect(screen.getByText("OrganizationProjects.intro")).toBeInTheDocument();
      expect(screen.getByText("Global.labels.searchByKeyword")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Clear search/i })).toBeInTheDocument();
      expect(screen.getByText("Global.helpText.searchHelpText") as HTMLElement).toBeInTheDocument();
      // Check for the presence of the <h2> element with the link inside it
      const heading = screen.getByRole("heading", {
        name: /Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations/i,
      });
      expect(heading).toBeInTheDocument();
      const linkExpand = screen.getAllByText("Global.buttons.linkExpand");
      expect(linkExpand).toHaveLength(3);
      const projectDetails = screen.getAllByText("ProjectOverview.projectDetails");
      expect(projectDetails).toHaveLength(3);
    });
  });

  it("should display project details after clicking expand, and hide after clicking collapse", async () => {
    await act(async () => {
      render(
        <MockedProvider
          mocks={mocks}
        >
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      const expandButton = screen.getAllByRole("button", {
        name: /Global.messaging.detailsToggleAria/i,
      })[0];

      expect(expandButton).toBeInTheDocument();

      // Click on Expand link
      fireEvent.click(expandButton);
    });

    // Check that the expanded plans panel is visible
    expect(screen.getByRole("heading", { name: "ProjectOverview.plansInProject" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ProjectOverview.createNewDmpInProject" })).toBeInTheDocument();
    expect(screen.getAllByText("ProjectOverview.noPlansYet").length).toBeGreaterThan(0);

    // Click on Collapse link
    const collapseButton = screen.getAllByRole("button", {
      name: /Global.messaging.detailsToggleAria/i,
    })[0];

    expect(collapseButton).toBeInTheDocument();

    // Click on Collapse link
    fireEvent.click(collapseButton);

    // The plans heading should no longer be visible
    expect(screen.queryByRole("heading", { name: "ProjectOverview.plansInProject" })).not.toBeInTheDocument();
  });

  it("should show filtered list when user clicks Search button", async () => {
    await act(async () => {
      render(
        <MockedProvider
          mocks={mocks}
        >
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    const searchInput = screen.getByLabelText("Global.labels.searchByKeyword");
    fireEvent.change(searchInput, { target: { value: "reef" } });

    const searchButton = screen.getByText("Global.buttons.search");
    await act(async () => {
      fireEvent.click(searchButton);
    });
    await waitFor(() => {
      expect(screen.getByText("Reef One")).toBeInTheDocument();
    });
  });

  it("should reset results back to original when user clicks the clear filter button", async () => {
    await act(async () => {
      render(
        <MockedProvider
          mocks={mocks}
        >
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    const searchInput = screen.getByLabelText("Global.labels.searchByKeyword");
    fireEvent.change(searchInput, { target: { value: "reef" } });

    const searchButton = screen.getByText("Global.buttons.search");
    await act(async () => {
      fireEvent.click(searchButton);
    });
    await waitFor(() => {
      expect(screen.getByText("Reef One")).toBeInTheDocument();
    });

    const clearFilterBtn = screen.getAllByRole("button", { name: "Global.links.clearFilter" });
    expect(clearFilterBtn).toHaveLength(2);

    await act(async () => {
      fireEvent.click(clearFilterBtn[0]);
    });

    expect(screen.queryByText("Reef One")).not.toBeInTheDocument();
  });

  it("should handle clicking on the Load more button", async () => {
    await act(async () => {
      render(
        <MockedProvider
          mocks={mocks}
        >
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("load-more-btn")).toBeInTheDocument();
    });

    mockScrollIntoView.mockClear();
    fireEvent.click(screen.getByTestId("load-more-btn"));

    await waitFor(() => {
      expect(screen.getByText("Project 3")).toBeInTheDocument();
    });

    await act(() => new Promise((r) => setTimeout(r, 200)));
    expect(mockScrollIntoView).toHaveBeenCalled();
  });

  it("should handle clicking on the Load more button in search list", async () => {
    await act(async () => {
      render(
        <MockedProvider
          mocks={mocks}
        >
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    const searchInput = screen.getByLabelText("Global.labels.searchByKeyword");
    fireEvent.change(searchInput, { target: { value: "reef" } });

    const searchButton = screen.getByText("Global.buttons.search");
    await act(async () => {
      fireEvent.click(searchButton);
    });
    await waitFor(() => {
      expect(screen.getByText("Reef One")).toBeInTheDocument();
    });

    await waitFor(() => {
      const loadMoreBtn = screen.getByTestId("search-load-more-btn");
      expect(loadMoreBtn).toBeInTheDocument();
      fireEvent.click(loadMoreBtn);
    });

    await waitFor(() => {
      expect(screen.getByText("Project 3")).toBeInTheDocument();
    });
  });

  it("should display empty state with CTA when organization has no projects", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={emptyProjectsMocks}>
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      const emptyState = screen.getByRole("status");
      expect(within(emptyState).getByText("OrganizationProjects.messages.info.noProjectsHeading")).toBeInTheDocument();
      expect(within(emptyState).getByText("OrganizationProjects.messages.info.noProjectsDescription")).toBeInTheDocument();
      expect(within(emptyState).getByRole("link", { name: "Global.buttons.createNewPlan" })).toBeInTheDocument();
      expect(screen.queryByText("Global.buttons.linkExpand")).not.toBeInTheDocument();
    });
  });

  it("should display empty state when totalCount is null and there are no projects", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={emptyProjectsNullTotalCountMocks}>
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText("OrganizationProjects.messages.info.noProjectsHeading")).toBeInTheDocument();
    });
  });

  it("should not display empty state while projects are loading", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={delayedEmptyProjectsMocks}>
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    expect(screen.getByTestId("skeleton-list-loading")).toBeInTheDocument();
    expect(
      screen.getByTestId("skeleton-list-loading").querySelectorAll('[class*="skeletonItem"]'),
    ).toHaveLength(5);
    expect(screen.getByRole("heading", { name: /OrganizationProjects.title/i })).toBeInTheDocument();
    expect(screen.queryByText("OrganizationProjects.messages.info.noProjectsHeading")).not.toBeInTheDocument();
  });

  it("should dismiss the skeleton and show an error when the initial load fails", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={initialLoadErrorMocks}>
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("error-messages")).toHaveTextContent(
        "OrganizationProjects.messages.errors.errorRetrievingProjects",
      );
    });
    expect(screen.queryByTestId("skeleton-list-loading")).not.toBeInTheDocument();
  });

  it("should dismiss the skeleton and show an error if the initial load never returns", async () => {
    jest.useFakeTimers({ advanceTimers: true });

    await act(async () => {
      render(
        <MockedProvider mocks={hungInitialLoadMocks}>
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    expect(screen.getByTestId("skeleton-list-loading")).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("error-messages")).toHaveTextContent(
        "OrganizationProjects.messages.errors.errorRetrievingProjects",
      );
    });
    expect(screen.queryByTestId("skeleton-list-loading")).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it("should dismiss the skeleton and show an error when search fails", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={searchErrorMocks}>
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.queryByTestId("skeleton-list-loading")).not.toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText("Global.labels.searchByKeyword");
    fireEvent.change(searchInput, { target: { value: "reef" } });

    const searchButton = screen.getByText("Global.buttons.search");
    await act(async () => {
      fireEvent.click(searchButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId("error-messages")).toHaveTextContent(
        "OrganizationProjects.messages.errors.errorRetrievingProjects",
      );
    });
    expect(screen.queryByTestId("skeleton-list-loading")).not.toBeInTheDocument();
  });

  it("should show an error when clear filter refetch fails", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={resetSearchErrorMocks}>
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.queryByTestId("skeleton-list-loading")).not.toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText("Global.labels.searchByKeyword");
    fireEvent.change(searchInput, { target: { value: "reef" } });

    const searchButton = screen.getByText("Global.buttons.search");
    await act(async () => {
      fireEvent.click(searchButton);
    });
    await waitFor(() => {
      expect(screen.getByText("Reef One")).toBeInTheDocument();
    });

    const clearFilterBtn = screen.getAllByRole("button", { name: "Global.links.clearFilter" });
    await act(async () => {
      fireEvent.click(clearFilterBtn[0]);
    });

    await waitFor(() => {
      expect(screen.getByTestId("error-messages")).toHaveTextContent(
        "OrganizationProjects.messages.errors.errorRetrievingProjects",
      );
    });
  });

  it("should display no items found message when search yields no results", async () => {
    await act(async () => {
      render(
        <MockedProvider
          mocks={mocks}
        >
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    const searchInput = screen.getByLabelText("Global.labels.searchByKeyword");
    fireEvent.change(searchInput, { target: { value: "Nonexistent Project" } });

    const searchButton = screen.getByText("Global.buttons.search");
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("Global.messaging.noItemsFound")).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.queryByText("OrganizationProjects.messages.info.noProjectsHeading")).not.toBeInTheDocument();
    });
  });

  it("should handle an empty search", async () => {
    await act(async () => {
      render(
        <MockedProvider
          mocks={mocks}
        >
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      // Check for the presence of the <h3> element with the link inside it
      const heading = screen.getByRole("heading", {
        name: /Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations/i,
      });
      expect(heading).toBeInTheDocument();
      const linkExpand = screen.getAllByText("Global.buttons.linkExpand");
      expect(linkExpand).toHaveLength(3);
      const projectDetails = screen.getAllByText("ProjectOverview.projectDetails");
      expect(projectDetails).toHaveLength(3);
    });

    const searchInput = screen.getByLabelText("Global.labels.searchByKeyword");
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "" } });
    });

    const searchButton = screen.getByText("Global.buttons.search");
    await act(async () => {
      fireEvent.click(searchButton);
    });

    // Nothing should have changed
    await waitFor(() => {
      // Check for the presence of the <h3> element with the link inside it
      const heading = screen.getByRole("heading", {
        name: /Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations/i,
      });
      expect(heading).toBeInTheDocument();
      const linkExpand = screen.getAllByText("Global.buttons.linkExpand");
      expect(linkExpand).toHaveLength(3);
      const projectDetails = screen.getAllByText("ProjectOverview.projectDetails");
      expect(projectDetails).toHaveLength(3);
    });

    // clear filter links should not show
    const clearFilterBtn = screen.queryByRole("button", { name: "Global.links.clearFilter" });
    expect(clearFilterBtn).not.toBeInTheDocument();
  });

  it("should show failedToLoadMore when search load more hits a network error", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={searchLoadMoreNetworkErrorMocks}>
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    const searchInput = screen.getByLabelText("Global.labels.searchByKeyword");
    fireEvent.change(searchInput, { target: { value: "reef" } });

    const searchButton = screen.getByText("Global.buttons.search");
    await act(async () => {
      fireEvent.click(searchButton);
    });
    await waitFor(() => {
      expect(screen.getByText("Reef One")).toBeInTheDocument();
    });

    await waitFor(() => {
      const loadMoreBtn = screen.getByTestId("search-load-more-btn");
      expect(loadMoreBtn).toBeInTheDocument();
      fireEvent.click(loadMoreBtn);
    });

    await waitFor(() => {
      expect(screen.getByText("OrganizationProjects.messages.errors.failedToLoadMore")).toBeInTheDocument();
    });
  });

  it("should show failedToLoadMore when default load more hits a network error", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={loadMoreNetworkErrorMocks}>
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      const loadMoreBtn = screen.getByTestId("load-more-btn");
      expect(loadMoreBtn).toBeInTheDocument();
      fireEvent.click(loadMoreBtn);
    });

    await waitFor(() => {
      expect(screen.getByText("OrganizationProjects.messages.errors.failedToLoadMore")).toBeInTheDocument();
    });
  });

  it("should show item GraphQL general errors and scroll the banner into view", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={mocks}>
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Global.labels.searchByKeyword")).toBeInTheDocument();
    });

    mockScrollIntoView.mockClear();

    const searchInput = screen.getByLabelText("Global.labels.searchByKeyword");
    fireEvent.change(searchInput, { target: { value: "throw" } });

    const searchButton = screen.getByText("Global.buttons.search");
    await act(async () => {
      fireEvent.click(searchButton);
    });

    await waitFor(() => {
      expect(screen.getByText("There was an error getting the projects")).toBeInTheDocument();
    });
    expect(mockScrollIntoView).toHaveBeenCalled();
  });

  it("should fall back to errorRetrievingProjects when an item only has a title error", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={titleOnlyItemErrorMocks}>
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText("OrganizationProjects.messages.errors.errorRetrievingProjects")).toBeInTheDocument();
    });
  });

  it("should skip plans without ids and show Visible Plan after expand", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={datesAndPlansMocks}>
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Dated Project/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Overflow Modified Project/i })).toBeInTheDocument();
    });

    const expandButton = screen.getAllByRole("button", {
      name: /Global.messaging.detailsToggleAria/i,
    })[0];
    fireEvent.click(expandButton);

    expect(screen.getByText("Visible Plan")).toBeInTheDocument();
    expect(screen.queryByText("Skipped")).not.toBeInTheDocument();
    // Plans have no role of their own, so the project's myAccessLevel is shown translated
    expect(
      screen.getAllByText("ProjectsProjectCollaboration.accessLevels.own").length,
    ).toBeGreaterThan(0);
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(
      <MockedProvider
        mocks={mocks}
      >
        <OrganizationProjectsListPage />
      </MockedProvider>,
    );

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
  it("should refetch with the selected status filter", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={statusFilterMocks}>
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText("Global.buttons.linkExpand").length).toBeGreaterThan(1);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /ProjectListFilters.statusLabel/i }));
    });
    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByRole("option", { name: "ProjectListFilters.allStatuses" })).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(within(listbox).getByRole("option", { name: "ProjectOverview.planStatus.DRAFT" }));
    });

    await waitFor(() => {
      expect(screen.getAllByText("Global.buttons.linkExpand")).toHaveLength(1);
      expect(screen.getByRole("heading", {
        name: /Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations/i,
      })).toBeInTheDocument();
    });

    // Only plans matching the selected status are shown in the project card
    fireEvent.click(screen.getByRole("button", { name: /Global.messaging.detailsToggleAria/i }));
    expect(screen.getByText("Draft Plan")).toBeInTheDocument();
    expect(screen.queryByText("Complete Plan")).not.toBeInTheDocument();
  });

  it("should clear the status and role filters and show all projects when Clear filters is clicked", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={clearFiltersMocks}>
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText("Global.buttons.linkExpand").length).toBeGreaterThan(1);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /ProjectListFilters.statusLabel/i }));
    });
    await act(async () => {
      fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: "ProjectOverview.planStatus.DRAFT" }));
    });
    await waitFor(() => {
      expect(screen.getAllByText("Global.buttons.linkExpand")).toHaveLength(1);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "ProjectListFilters.clearFilters" }));
    });

    await waitFor(() => {
      expect(screen.getAllByText("Global.buttons.linkExpand").length).toBeGreaterThan(1);
    });
    expect(screen.getByRole("button", { name: /ProjectListFilters.statusLabel/i }))
      .toHaveTextContent("ProjectListFilters.allStatuses");
  });

  it("should show no items found instead of the empty state when a role filter has no matches", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={roleFilterNoResultsMocks}>
          <OrganizationProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText("Global.buttons.linkExpand").length).toBeGreaterThan(1);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /ProjectListFilters.roleLabel/i }));
    });
    await act(async () => {
      fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", {
        name: "ProjectsProjectCollaboration.accessLevels.comment",
      }));
    });

    await waitFor(() => {
      expect(screen.getByText("Global.messaging.noItemsFound")).toBeInTheDocument();
    });
    expect(screen.queryByText(/messages.info.noProjectsHeading/)).not.toBeInTheDocument();
  });
});
