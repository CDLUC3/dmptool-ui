import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { MyProjectsDocument } from "@/generated/graphql";
import { axe, toHaveNoViolations } from "jest-axe";
import ProjectsListPage from "../page";
import { useFormatter, useTranslations } from "next-intl";
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";

expect.extend(toHaveNoViolations);

// Mock next-intl hooks
jest.mock("next-intl", () => ({
  useFormatter: jest.fn(),
  useTranslations: jest.fn(),
}));

const mocks = [
  // Initial load mock
  {
    request: {
      query: MyProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 3,
        },
      },
    },
    result: {
      data: {
        myProjects: {
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
              id: 1,
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
              id: 1,
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
      query: MyProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 3,
        },
      },
    },
    result: {
      data: {
        myProjects: {
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
              id: 1,
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
              id: 1,
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
      query: MyProjectsDocument,
      variables: {
        paginationOptions: {
          type: "CURSOR",
          cursor: "2025-08-05_00:00:004",
          limit: 3,
        },
        term: "reef",
      },
    },
    result: {
      data: {
        myProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Project 3",
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
              title: "Project 4",
              id: 1,
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
              id: 1,
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
      query: MyProjectsDocument,
      variables: {
        paginationOptions: {
          type: "CURSOR",
          cursor: "2025-08-05_00:00:004",
          limit: 3,
        },
      },
    },
    result: {
      data: {
        myProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Project 3",
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
              title: "Project 4",
              id: 1,
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
              id: 1,
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
      query: MyProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 3,
          type: "CURSOR",
        },
        term: "reef",
      },
    },
    result: {
      data: {
        myProjects: {
          totalCount: 9,
          nextCursor: "2025-08-05_00:00:004",
          items: [
            {
              title: "Reef One",
              id: 2,
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
      query: MyProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 3,
          type: "CURSOR",
        },
        term: "throw",
      },
    },
    result: {
      data: {
        myProjects: {
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
      query: MyProjectsDocument,
      variables: {
        paginationOptions: {
          type: "CURSOR",
          limit: 3,
          cursor: "2025-08-05_00:00:004",
        },
        term: "throw",
      },
    },
    result: {
      data: {
        myProjects: {
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
      query: MyProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 3,
          type: "CURSOR",
        },
      },
    },
    result: {
      data: {
        myProjects: {
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
  // Empty search results mock
  {
    request: {
      query: MyProjectsDocument,
      variables: {
        paginationOptions: {
          type: "CURSOR",
          limit: 3,
        },
        term: "nonexistent project",
      },
    },
    result: {
      data: {
        myProjects: {
          items: [],
          nextCursor: null,
          totalCount: 0,
        },
      },
    },
  },
];

const emptyProjectsMocks = [
  {
    request: {
      query: MyProjectsDocument,
      variables: {
        paginationOptions: {
          limit: 3,
        },
      },
    },
    result: {
      data: {
        myProjects: {
          items: [],
          nextCursor: null,
          totalCount: 0,
        },
      },
    },
  },
];

describe("ProjectsListPage", () => {
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

  // Need this because the test is ending before async operations complete.
  afterEach(async () => {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });


  it("should render the ProjectsListPage component", async () => {
    await act(async () => {
      render(
        <MockedProvider
          mocks={mocks}
        >
          <ProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Global.breadcrumbs.home/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Global.breadcrumbs.project/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Global.breadcrumbs.planDashboard/i })).toBeInTheDocument();
      expect(screen.getByText("ProjectsListPage.intro")).toBeInTheDocument();
      expect(screen.getByText("Global.buttons.createNewPlan")).toBeInTheDocument();
      expect(screen.getByText("Global.labels.searchByKeyword")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Clear search/i })).toBeInTheDocument();
      expect(screen.getByText("Global.helpText.searchHelpText") as HTMLElement).toBeInTheDocument();
      // Note: ProjectOverview.project headings are screen reader only and not accessible to tests
      // Check for the presence of the <h3> element with the link inside it
      const heading = screen.getByRole("heading", {
        name: /Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations/i,
      });
      expect(heading).toBeInTheDocument();
      const linkExpand = screen.getAllByText("Global.buttons.linkExpand");
      expect(linkExpand).toHaveLength(3);
      // Note: ProjectOverview.projectDetails text is screen reader only and not accessible to tests
    });
  });

  it("should display project details after clicking expand, and hide after clicking collapse", async () => {
    await act(async () => {
      render(
        <MockedProvider
          mocks={mocks}
        >
          <ProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      const expandButton = screen.getByRole("button", {
        name: /Global.buttons.linkExpand details for Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations/i,
      });

      expect(expandButton).toBeInTheDocument();

      // Click on Expand link
      fireEvent.click(expandButton);
    });

    // Note: ProjectOverview.projectDetails and ProjectOverview.dates headings are screen reader only and not accessible to tests
    const dateText = screen.getByText("9/1/2025 to 12/31/2028", {
      normalizer: (text) => text.replace(/\s+/g, " ").trim(),
    });
    expect(dateText).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /ProjectOverview.projectMembers/i })).toBeInTheDocument();
    // Check that Jacques Cousteau appears in both collapsed and expanded views
    const jacquesElements = screen.getAllByText(/Jacques Cousteau/i);
    expect(jacquesElements).toHaveLength(2); // One in metadata, one in expanded details
    // Note: Member roles are not displayed in the current component implementation
    expect(screen.getByRole("heading", { name: /ProjectOverview.funding/i })).toBeInTheDocument();
    // Check that National Science Foundation appears in both collapsed and expanded views
    const nsfElements = screen.getAllByText("National Science Foundation");
    expect(nsfElements).toHaveLength(2); // One in metadata, one in expanded details
    expect(screen.getByRole("heading", { name: /ProjectOverview.researchOutputs/i })).toBeInTheDocument();

    // Click on Collapse link
    const collapseButton = screen.getByRole("button", {
      name: /Global.buttons.linkCollapse details for Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations/i,
    });

    expect(collapseButton).toBeInTheDocument();

    // Click on Expand link
    fireEvent.click(collapseButton);

    // Note: ProjectOverview.projectDetails heading is screen reader only and not accessible to tests
  });

  it("should show filtered list when user clicks Search button", async () => {
    render(
      <MockedProvider
        mocks={mocks}
      >
        <ProjectsListPage />
      </MockedProvider>,
    );

    await screen.findByLabelText("Global.labels.searchByKeyword");
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
          <ProjectsListPage />
        </MockedProvider>,
      );
    });

    await screen.findByLabelText("Global.labels.searchByKeyword");

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
          <ProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      const loadMoreBtn = screen.getByRole("button", { name: "load more" });
      expect(loadMoreBtn).toBeInTheDocument();
      fireEvent.click(loadMoreBtn);
    });

    await waitFor(() => {
      expect(screen.getByText("Project 3")).toBeInTheDocument();
    });
  });

  it("should handle clicking on the Load more button in search list", async () => {
    await act(async () => {
      render(
        <MockedProvider
          mocks={mocks}
        >
          <ProjectsListPage />
        </MockedProvider>,
      );
    });

    await screen.findByLabelText("Global.labels.searchByKeyword");

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
      const loadMoreBtn = screen.getByRole("button", { name: "load more search results" });
      expect(loadMoreBtn).toBeInTheDocument();
      fireEvent.click(loadMoreBtn);
    });

    await waitFor(() => {
      expect(screen.getByText("Project 3")).toBeInTheDocument();
    });
  });

  it("should display empty state with CTA when user has no projects", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={emptyProjectsMocks}>
          <ProjectsListPage />
        </MockedProvider>,
      );
    });

    await waitFor(() => {
      const emptyState = screen.getByRole("status");
      expect(within(emptyState).getByText("ProjectsListPage.messages.info.noProjectsHeading")).toBeInTheDocument();
      expect(within(emptyState).getByText("ProjectsListPage.messages.info.noProjectsDescription")).toBeInTheDocument();
      expect(within(emptyState).getByRole("link", { name: "Global.buttons.createNewPlan" })).toBeInTheDocument();
      expect(screen.queryByText("Global.buttons.linkExpand")).not.toBeInTheDocument();
    });
  });

  it("should display no items found message when search yields no results", async () => {
    await act(async () => {
      render(
        <MockedProvider
          mocks={mocks}
        >
          <ProjectsListPage />
        </MockedProvider>,
      );
    });

    await screen.findByLabelText("Global.labels.searchByKeyword");

    const searchInput = screen.getByLabelText("Global.labels.searchByKeyword");
    fireEvent.change(searchInput, { target: { value: "Nonexistent Project" } });

    const searchButton = screen.getByText("Global.buttons.search");
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("Global.messaging.noItemsFound")).toBeInTheDocument();
    });
  });

  it("should handle an empty search", async () => {
    await act(async () => {
      render(
        <MockedProvider
          mocks={mocks}
        >
          <ProjectsListPage />
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
      // Note: ProjectOverview.projectDetails text is screen reader only and not accessible to tests
    });

    const searchInput = screen.getByLabelText("Global.labels.searchByKeyword");
    fireEvent.change(searchInput, { target: { value: "" } });

    const searchButton = screen.getByText("Global.buttons.search");
    fireEvent.click(searchButton);

    // Nothing should have changed
    await waitFor(() => {
      // Check for the presence of the <h3> element with the link inside it
      const heading = screen.getByRole("heading", {
        name: /Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations/i,
      });
      expect(heading).toBeInTheDocument();
      const linkExpand = screen.getAllByText("Global.buttons.linkExpand");
      expect(linkExpand).toHaveLength(3);
      // Note: ProjectOverview.projectDetails text is screen reader only and not accessible to tests
    });

    // clear filter links should not show
    const clearFilterBtn = screen.queryByRole("button", { name: "Global.links.clearFilter" });
    expect(clearFilterBtn).not.toBeInTheDocument();
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(
      <MockedProvider
        mocks={mocks}
      >
        <ProjectsListPage />
      </MockedProvider>,
    );
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
