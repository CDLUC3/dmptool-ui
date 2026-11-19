import React from "react";
import {act, render, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {RelatedWorksList} from "../index";
import "@testing-library/jest-dom";
import {axe, toHaveNoViolations} from "jest-axe";
import {NextIntlClientProvider} from "next-intl";
import {useMutation, useQuery} from '@apollo/client/react';
import {
  ProjectDocument,
  RelatedWorksDocument,
  RelatedWorksIdentifierType,
  RelatedWorkSourceType,
  RelatedWorkStatus,
  UpdateRelatedWorkStatusDocument,
} from "@/generated/graphql";
import {
  MOCK_ACCEPTED_WORKS,
  MOCK_PENDING_WORKS,
  MOCK_REJECTED_WORKS
} from "@/app/[locale]/projects/[projectId]/dmp/[dmpid]/related-works/mockWorks";
import {useToast} from "@/context/ToastContext";
import {handleApolloError} from "@/utils/index";

expect.extend(toHaveNoViolations);

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/'),
}));

jest.mock("@/utils/index", () => ({
  handleApolloError: jest.fn(() => ({ wasRealError: true, message: "error" })),
}));

const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);
const mockUseToast = jest.mocked(useToast);
const mockHandleApolloError = jest.mocked(handleApolloError);

/* eslint-disable @typescript-eslint/no-explicit-any */
type RelatedWorksMock = Record<string, any>;

let mockRefetch: jest.Mock;
let mockUpdateStatus: jest.Mock;
let mockToastAdd: jest.Mock;

const setupMocks = (relatedWorks: RelatedWorksMock = {}) => {
  mockUseQuery.mockImplementation((document) => {
    if (document === RelatedWorksDocument) {
      return {
        data: {
          relatedWorks: {
            items: [],
            totalCount: 0,
            statusOnlyCount: 0,
            hasNextPage: false,
            hasPreviousPage: false,
            ...relatedWorks,
          },
        },
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      } as any;
    }
    if (document === ProjectDocument) {
      return {
        data: {
          project: {
            plans: [
              { id: 1, title: "Published plan", registered: "2025-01-01" },
              { id: 2, title: "Draft plan", registered: null },
            ],
          },
        },
        loading: false,
      } as any;
    }
    return { data: null, loading: false, error: undefined } as any;
  });
};

const relatedWorksVariables = () => {
  const calls = mockUseQuery.mock.calls.filter(([document]) => document === RelatedWorksDocument);
  return (calls[calls.length - 1][1] as any).variables;
};

const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NextIntlClientProvider
    locale="en"
    timeZone="UTC"
    messages={{}}
  >
    {children}
  </NextIntlClientProvider>
);

const renderList = (status: RelatedWorkStatus, props: Partial<React.ComponentProps<typeof RelatedWorksList>> = {}) =>
  render(
    <TestProviders>
      <RelatedWorksList
        identifierType={RelatedWorksIdentifierType.PlanId}
        identifier={1}
        status={status}
        {...props}
      />
    </TestProviders>,
  );

const openSelect = async (name: string) => {
  await userEvent.click(screen.getByRole("button", { name }));
  return within(screen.getByRole("listbox"))
    .getAllByRole("option")
    .map((option) => option.textContent);
};

describe("RelatedWorksList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetch = jest.fn().mockResolvedValue({});
    mockUpdateStatus = jest.fn().mockResolvedValue({ data: {} });
    mockToastAdd = jest.fn();
    mockUseMutation.mockReturnValue([mockUpdateStatus, { loading: false }] as any);
    mockUseToast.mockReturnValue({ add: mockToastAdd } as any);
    setupMocks();
  });

  it("should render two pending items", () => {
    setupMocks({ items: MOCK_PENDING_WORKS, totalCount: 2, statusOnlyCount: 2 });
    renderList(RelatedWorkStatus.Pending);

    expectDois("related-works-list", ["10.1016/fake.2025.293748", "10.1126/fake.2025.084512"]);
    expect(screen.getByText("intro.PENDING")).toBeInTheDocument();
  });

  it("should render two related items", () => {
    setupMocks({ items: MOCK_ACCEPTED_WORKS, totalCount: 2, statusOnlyCount: 2 });
    renderList(RelatedWorkStatus.Accepted);

    expectDois("related-works-list", ["10.5555/fake.2025.661100", "10.5555/fake.2025.443322"]);
    expect(screen.getByText("intro.ACCEPTED")).toBeInTheDocument();
  });

  it("should render one dismissed item with a results summary", () => {
    setupMocks({ items: MOCK_REJECTED_WORKS, totalCount: 1, statusOnlyCount: 1 });
    renderList(RelatedWorkStatus.Rejected);

    expectDois("related-works-list", ["10.3847/fake.2025.245187"]);
    expect(screen.getByText("intro.REJECTED")).toBeInTheDocument();
    expect(screen.getByText("summary.REJECTED")).toBeInTheDocument();
  });

  it("should not show the results summary outside the dismissed tab", () => {
    setupMocks({ items: MOCK_PENDING_WORKS, totalCount: 2, statusOnlyCount: 2 });
    renderList(RelatedWorkStatus.Pending);

    expect(screen.queryByText("summary.REJECTED")).not.toBeInTheDocument();
  });

  it("should request 10 results per page sorted by likelihood for pending works", () => {
    renderList(RelatedWorkStatus.Pending);

    expect(relatedWorksVariables()).toEqual({
      id: 1,
      idType: RelatedWorksIdentifierType.PlanId,
      filterOptions: { planId: null, status: RelatedWorkStatus.Pending },
      paginationOptions: { offset: 0, limit: 10, type: "OFFSET", sortField: "scoreNorm", sortDir: "DESC" },
    });
  });

  it("should display sort by options: pending", async () => {
    setupMocks({ items: MOCK_PENDING_WORKS, totalCount: 2, statusOnlyCount: 2 });
    renderList(RelatedWorkStatus.Pending);

    expect(await openSelect("filters.sortBy.LikelihoodHigh filters.sort")).toEqual([
      "filters.sortBy.LikelihoodHigh",
      "filters.sortBy.DateFoundNew",
    ]);
  });

  it("should not display sort by on accepted, but still sort by date confirmed", () => {
    setupMocks({ items: MOCK_ACCEPTED_WORKS, totalCount: 2, statusOnlyCount: 2 });
    renderList(RelatedWorkStatus.Accepted, { identifierType: RelatedWorksIdentifierType.ProjectId });

    expect(screen.getByText("filters.planId")).toBeInTheDocument();
    expect(screen.queryByText("filters.sort")).not.toBeInTheDocument();
    expect(relatedWorksVariables().paginationOptions).toMatchObject({ sortField: "modified", sortDir: "DESC" });
  });

  it("should display sort by options: rejected", async () => {
    setupMocks({ items: MOCK_PENDING_WORKS, totalCount: 2, statusOnlyCount: 2 });
    renderList(RelatedWorkStatus.Rejected);

    expect(await openSelect("filters.sortBy.DateDismissedNew filters.sort")).toEqual([
      "filters.sortBy.DateDismissedNew",
      "filters.sortBy.LikelihoodHigh",
    ]);
  });

  it("should change sort and return to the first page", async () => {
    setupMocks({ items: MOCK_PENDING_WORKS, totalCount: 30, statusOnlyCount: 30, hasNextPage: true, hasPreviousPage: true });
    renderList(RelatedWorkStatus.Pending, { defaultPage: 2 });
    expect(relatedWorksVariables().paginationOptions.offset).toBe(10);

    await openSelect("filters.sortBy.LikelihoodHigh filters.sort");
    await userEvent.click(screen.getByRole("option", { name: "filters.sortBy.DateFoundNew" }));

    expect(relatedWorksVariables().paginationOptions).toMatchObject({ offset: 0, sortField: "created", sortDir: "DESC" });
  });

  it("should only show the plan filter on the project page", async () => {
    setupMocks({ items: MOCK_PENDING_WORKS, totalCount: 2, statusOnlyCount: 2 });
    const { unmount } = renderList(RelatedWorkStatus.Pending);
    expect(screen.queryByText("filters.planId")).not.toBeInTheDocument();
    unmount();

    renderList(RelatedWorkStatus.Pending, { identifierType: RelatedWorksIdentifierType.ProjectId });
    expect(screen.getByText("filters.planId")).toBeInTheDocument();

    expect(await openSelect("planSelectPlaceholder filters.planId")).toEqual(["planSelectPlaceholder", "Published plan"]);
    await userEvent.click(screen.getByRole("option", { name: "Published plan" }));
    expect(relatedWorksVariables().filterOptions).toEqual({ planId: 1, status: RelatedWorkStatus.Pending });
  });

  it("should show which plan is being matched on the plan page, with a link to all plans", () => {
    renderList(RelatedWorkStatus.Pending, {
      planScope: { title: "My Plan", allPlansHref: "/en-US/projects/1/related-works" },
    });

    const scope = screen.getByRole("group", { name: "planScope.label" });
    expect(scope).toHaveTextContent("My Plan");
    expect(within(scope).getByRole("link", { name: "planScope.viewAllPlans" })).toHaveAttribute(
      "href",
      expect.stringContaining("/projects/1/related-works"),
    );
  });

  it("should not show the plan scope on the project page", () => {
    setupMocks({ items: MOCK_PENDING_WORKS, totalCount: 2, statusOnlyCount: 2 });
    renderList(RelatedWorkStatus.Pending, {
      identifierType: RelatedWorksIdentifierType.ProjectId,
      planScope: { title: "My Plan", allPlansHref: "/en-US/projects/1/related-works" },
    });

    expect(screen.queryByRole("group", { name: "planScope.label" })).not.toBeInTheDocument();
    expect(screen.getByText("filters.planId")).toBeInTheDocument();
  });

  it("should show a loading skeleton and no filters while the first results load", () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === RelatedWorksDocument) {
        return { data: undefined, previousData: undefined, loading: true, refetch: mockRefetch } as any;
      }
      return { data: null, loading: false } as any;
    });
    renderList(RelatedWorkStatus.Pending);

    expect(screen.getByTestId("skeleton-list-loading")).toHaveAttribute("role", "status");
    expect(screen.queryByText("filters.sort")).not.toBeInTheDocument();
    expect(screen.queryByTestId("related-works-empty-state")).not.toBeInTheDocument();
  });

  it("should keep showing results while a new page or sort loads", () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === RelatedWorksDocument) {
        return {
          data: undefined,
          previousData: { relatedWorks: { items: MOCK_PENDING_WORKS, totalCount: 2, statusOnlyCount: 2 } },
          loading: true,
          refetch: mockRefetch,
        } as any;
      }
      return { data: null, loading: false } as any;
    });
    renderList(RelatedWorkStatus.Pending);

    expect(screen.queryByTestId("skeleton-list-loading")).not.toBeInTheDocument();
    expect(screen.getByTestId("related-works-list")).toHaveAttribute("aria-busy", "true");
  });

  it("should show the confirmed empty state with actions to review matches and add an output", async () => {
    const onReviewMatches = jest.fn();
    renderList(RelatedWorkStatus.Accepted, { onReviewMatches, addHref: "/en-US/projects/1/dmp/1/related-works/add" });

    const emptyState = screen.getByRole("region", { name: "emptyStates.ACCEPTED.title" });
    expect(emptyState).toHaveTextContent("emptyStates.ACCEPTED.description");
    expect(emptyState.parentElement).toHaveAttribute("aria-live", "polite");
    expect(within(emptyState).getByRole("link", { name: "emptyStates.actions.addResearchOutput" })).toHaveAttribute(
      "href",
      expect.stringContaining("/related-works/add"),
    );

    await userEvent.click(within(emptyState).getByRole("button", { name: "emptyStates.actions.reviewMatches" }));
    expect(onReviewMatches).toHaveBeenCalled();

    expect(screen.queryByText("filters.sort")).not.toBeInTheDocument();
    expect(screen.queryByTestId("related-works-list")).not.toBeInTheDocument();
  });

  it("should show the confirm matches empty state with only the add action", () => {
    renderList(RelatedWorkStatus.Pending, { onReviewMatches: jest.fn(), addHref: "/add" });

    const emptyState = screen.getByRole("region", { name: "emptyStates.PENDING.title" });
    expect(within(emptyState).getByRole("link", { name: "emptyStates.actions.addResearchOutput" })).toBeInTheDocument();
    expect(within(emptyState).queryByRole("button", { name: "emptyStates.actions.reviewMatches" })).not.toBeInTheDocument();
  });

  it("should show the dismissed empty state with only the review action", () => {
    renderList(RelatedWorkStatus.Rejected, { onReviewMatches: jest.fn(), addHref: "/add" });

    const emptyState = screen.getByRole("region", { name: "emptyStates.REJECTED.title" });
    expect(within(emptyState).getByRole("button", { name: "emptyStates.actions.reviewMatches" })).toBeInTheDocument();
    expect(within(emptyState).queryByRole("link")).not.toBeInTheDocument();
  });

  it("should show an empty state without actions when none are provided", () => {
    renderList(RelatedWorkStatus.Accepted);

    const emptyState = screen.getByRole("region", { name: "emptyStates.ACCEPTED.title" });
    expect(within(emptyState).queryByRole("button")).not.toBeInTheDocument();
    expect(within(emptyState).queryByRole("link")).not.toBeInTheDocument();
  });

  it("should show the filtered empty state and reset the plan filter", async () => {
    setupMocks({ totalCount: 0, statusOnlyCount: 10 });
    renderList(RelatedWorkStatus.Rejected, { identifierType: RelatedWorksIdentifierType.ProjectId });

    const emptyState = screen.getByRole("region", { name: "messages.REJECTED.noFilteredResults" });
    expect(emptyState).toHaveTextContent("emptyStates.filtered.description");
    expect(within(emptyState).queryByRole("button")).not.toBeInTheDocument();

    await openSelect("planSelectPlaceholder filters.planId");
    await userEvent.click(screen.getByRole("option", { name: "Published plan" }));
    expect(relatedWorksVariables().filterOptions.planId).toBe(1);

    await userEvent.click(screen.getByRole("button", { name: "emptyStates.filtered.showAllPlans" }));
    expect(relatedWorksVariables().filterOptions.planId).toBeNull();
  });

  it.each([
    ["confirm", "actionsAria.confirm", RelatedWorkStatus.Pending, RelatedWorkStatus.Accepted],
    ["dismiss", "actionsAria.dismiss", RelatedWorkStatus.Pending, RelatedWorkStatus.Rejected],
    ["restore", "actionsAria.restore", RelatedWorkStatus.Rejected, RelatedWorkStatus.Pending],
  ])("should save %s as the matching status", async (action, buttonName, tabStatus, savedStatus) => {
    const items = tabStatus === RelatedWorkStatus.Pending ? MOCK_PENDING_WORKS : MOCK_REJECTED_WORKS;
    setupMocks({ items, totalCount: items.length, statusOnlyCount: items.length });
    renderList(tabStatus);

    const firstItem = within(screen.getByTestId("related-works-list")).getAllByRole("listitem")[0];
    await userEvent.click(within(firstItem).getByRole("button", { name: buttonName }));

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith({
        variables: { input: { id: items[0].id, status: savedStatus } },
      });
      expect(mockRefetch).toHaveBeenCalled();
      expect(mockToastAdd).toHaveBeenCalledWith(`messages.actions.${action}`, { type: "success" });
    });
  });

  it("should store unmatch as rejected for matched and manually added outputs", async () => {
    const items = [
      MOCK_ACCEPTED_WORKS[0],
      { ...MOCK_ACCEPTED_WORKS[1], sourceType: RelatedWorkSourceType.UserAdded },
    ];
    setupMocks({ items, totalCount: 2, statusOnlyCount: 2 });
    renderList(RelatedWorkStatus.Accepted);

    const buttons = within(screen.getByTestId("related-works-list")).getAllByRole("button", {
      name: "actionsAria.unmatch",
    });
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      await userEvent.click(button);
    }

    await waitFor(() => expect(mockUpdateStatus).toHaveBeenCalledTimes(buttons.length));
    mockUpdateStatus.mock.calls.forEach(([options]) => {
      expect(options.variables.input.status).toBe(RelatedWorkStatus.Rejected);
    });
  });

  it("should go back a page when the last item on a page is moved", async () => {
    setupMocks({ items: [MOCK_PENDING_WORKS[0]], totalCount: 11, statusOnlyCount: 11, hasPreviousPage: true });
    renderList(RelatedWorkStatus.Pending, { defaultPage: 2 });
    expect(relatedWorksVariables().paginationOptions.offset).toBe(10);

    await userEvent.click(screen.getByRole("button", { name: "actionsAria.confirm" }));

    await waitFor(() => expect(relatedWorksVariables().paginationOptions.offset).toBe(0));
    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it("should show an error toast when the update fails", async () => {
    mockUpdateStatus.mockRejectedValue(new Error("Network error"));
    setupMocks({ items: MOCK_PENDING_WORKS, totalCount: 2, statusOnlyCount: 2 });
    renderList(RelatedWorkStatus.Pending);

    const firstItem = within(screen.getByTestId("related-works-list")).getAllByRole("listitem")[0];
    await userEvent.click(within(firstItem).getByRole("button", { name: "actionsAria.confirm" }));

    await waitFor(() => {
      expect(mockHandleApolloError).toHaveBeenCalledWith(expect.any(Error), "RelatedWorksList.updateRelatedWorkStatus");
      expect(mockToastAdd).toHaveBeenCalledWith("messages.errors.updateStatus", { type: "error" });
    });
  });

  it("should not show an error toast for aborted requests", async () => {
    mockHandleApolloError.mockReturnValueOnce({ wasRealError: false, message: "" });
    mockUpdateStatus.mockRejectedValue(new Error("AbortError"));
    setupMocks({ items: MOCK_PENDING_WORKS, totalCount: 2, statusOnlyCount: 2 });
    renderList(RelatedWorkStatus.Pending);

    const firstItem = within(screen.getByTestId("related-works-list")).getAllByRole("listitem")[0];
    await userEvent.click(within(firstItem).getByRole("button", { name: "actionsAria.confirm" }));

    await waitFor(() => expect(mockHandleApolloError).toHaveBeenCalled());
    expect(mockToastAdd).not.toHaveBeenCalled();
  });

  it("should clear cached related work stats after a status update", () => {
    renderList(RelatedWorkStatus.Pending);

    const [document, options] = mockUseMutation.mock.calls[0] as any;
    expect(document).toBe(UpdateRelatedWorkStatusDocument);

    const cache = { evict: jest.fn(), gc: jest.fn() };
    options.update(cache);
    expect(cache.evict).toHaveBeenCalledWith({ fieldName: "relatedWorksByPlanStats" });
    expect(cache.evict).toHaveBeenCalledWith({ fieldName: "relatedWorksByProjectStats" });
    expect(cache.gc).toHaveBeenCalled();
  });

  it("should flag works from unpublished plans on the project page", () => {
    const items = MOCK_PENDING_WORKS.map((work) => ({ ...work, planId: 2, planTitle: "Draft plan" }));
    setupMocks({ items, totalCount: items.length, statusOnlyCount: items.length });
    renderList(RelatedWorkStatus.Accepted, {
      identifierType: RelatedWorksIdentifierType.ProjectId,
      unpublishedPlanIds: [2],
    });

    expect(screen.getAllByText("badges.unpublished")).toHaveLength(items.length);
  });

  it("should pass axe accessibility test", async () => {
    setupMocks({ items: MOCK_PENDING_WORKS, totalCount: 2, statusOnlyCount: 2 });
    const { container } = renderList(RelatedWorkStatus.Pending);

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  it("should pass axe accessibility test with the plan scope", async () => {
    setupMocks({ items: MOCK_PENDING_WORKS, totalCount: 2, statusOnlyCount: 2 });
    const { container } = renderList(RelatedWorkStatus.Pending, {
      planScope: { title: "My Plan", allPlansHref: "/en-US/projects/1/related-works" },
    });

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  it("should pass axe accessibility test with no results", async () => {
    const { container } = renderList(RelatedWorkStatus.Accepted, {
      identifierType: RelatedWorksIdentifierType.ProjectId,
      onReviewMatches: jest.fn(),
      addHref: "/add",
    });

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

function expectDois(testId: string, expectedDois: string[]) {
  const container = screen.getByTestId(testId);
  const dois = within(container)
    .queryAllByRole("listitem")
    .map((item) => item.getAttribute("data-testid"));

  expect(dois.length).toBe(expectedDois.length);
  expect(dois).toStrictEqual(expectedDois);
}
