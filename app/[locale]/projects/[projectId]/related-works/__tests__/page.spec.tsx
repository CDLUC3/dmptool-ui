import React from "react";
import { act, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { useParams } from "next/navigation";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { axe, toHaveNoViolations } from "jest-axe";
import { useMutation, useQuery } from "@apollo/client/react";
import RelatedWorksProjectPage from "../page";
import {
  ProjectDocument,
  RelatedWorksDocument,
  RelatedWorksIdentifierType,
  RelatedWorkStatus,
} from "@/generated/graphql";
import {
  MOCK_ACCEPTED_WORKS,
  MOCK_PENDING_WORKS,
  MOCK_REJECTED_WORKS,
} from "@/app/[locale]/projects/[projectId]/dmp/[dmpid]/related-works/mockWorks";
import { namespacedTranslations, getCardHeading } from "@/utils/relatedWorksTestUtils";

expect.extend(toHaveNoViolations);

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));

jest.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a
      href={href}
      {...props}
    >
      {children}
    </a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => "/projects/1/related-works"),
}));

jest.mock("@apollo/client/react", () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

const mockUseParams = jest.mocked(useParams);
const mockUseTranslations = jest.mocked(useTranslations);
const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);

const PROJECT_ID = 1;
type MockPlan = { id: number | null; title: string; registered: string | null };

const PUBLISHED_PLAN: MockPlan = { id: 1, title: "Published plan", registered: "2025-01-01" };
const DRAFT_PLAN: MockPlan = { id: 2, title: "Draft plan", registered: null };

// Spread outputs across both plans so the project page shows which plan each one matches
const withPlans = <T extends { planId?: number | null; planTitle?: string | null }>(works: T[]) =>
  works.map((work, index) => {
    const plan = index % 2 === 0 ? PUBLISHED_PLAN : DRAFT_PLAN;
    return { ...work, planId: plan.id, planTitle: plan.title };
  });

const WORKS_BY_STATUS = {
  [RelatedWorkStatus.Accepted]: withPlans(MOCK_ACCEPTED_WORKS),
  [RelatedWorkStatus.Pending]: withPlans(MOCK_PENDING_WORKS),
  [RelatedWorkStatus.Rejected]: withPlans(MOCK_REJECTED_WORKS),
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const setupMocks = ({ plans = [PUBLISHED_PLAN, DRAFT_PLAN] }: { plans?: MockPlan[] } = {}) => {
  mockUseQuery.mockImplementation((document, options: any) => {
    if (document === ProjectDocument) {
      return { data: { project: { plans } }, loading: false } as any;
    }
    if (document === RelatedWorksDocument) {
      const status = options.variables.filterOptions.status as RelatedWorkStatus;
      const items = WORKS_BY_STATUS[status];
      return {
        data: {
          relatedWorks: {
            items,
            totalCount: items.length,
            statusOnlyCount: items.length,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        loading: false,
        refetch: jest.fn().mockResolvedValue({}),
      } as any;
    }
    return { data: null, loading: false } as any;
  });
};

const relatedWorksCalls = () =>
  mockUseQuery.mock.calls.filter(([document]) => document === RelatedWorksDocument).map(([, options]) => options as any);

const renderPage = () =>
  render(
    <NextIntlClientProvider
      locale="en"
      timeZone="UTC"
      messages={{}}
    >
      <RelatedWorksProjectPage />
    </NextIntlClientProvider>,
  );

describe("RelatedWorksProjectPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState(null, "", "/");
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader
    mockUseTranslations.mockImplementation(namespacedTranslations as any);
    mockUseParams.mockReturnValue({ projectId: String(PROJECT_ID) });
    mockUseMutation.mockReturnValue([jest.fn().mockResolvedValue({ data: {} }), { loading: false }] as any);
    setupMocks();
  });

  it("should render the page header with a single h1 and the description", () => {
    renderPage();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "RelatedWorksProjectPage.title" })).toBeInTheDocument();
    expect(screen.getByText("RelatedWorksProjectPage.description")).toBeInTheDocument();
  });

  it("should render the breadcrumb links up to the project overview", () => {
    renderPage();

    expect(screen.getByRole("link", { name: "Global.breadcrumbs.home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Global.breadcrumbs.projects" })).toHaveAttribute("href", "/projects");
    expect(screen.getByRole("link", { name: "Global.breadcrumbs.projectOverview" })).toHaveAttribute(
      "href",
      "/projects/1",
    );
    expect(screen.queryByRole("link", { name: "Global.breadcrumbs.planOverview" })).not.toBeInTheDocument();
  });

  it("should request related works for the whole project", () => {
    renderPage();

    expect(mockUseQuery).toHaveBeenCalledWith(ProjectDocument, { variables: { projectId: PROJECT_ID }, skip: false });
    expect(relatedWorksCalls()[0].variables).toMatchObject({
      id: PROJECT_ID,
      idType: RelatedWorksIdentifierType.ProjectId,
    });
  });

  it("should link to choosing a plan when the project has several plans", () => {
    renderPage();

    expect(screen.getByText("RelatedWorksAddPanel.descriptionPublished")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "RelatedWorksAddPanel.button" })).toHaveAttribute(
      "href",
      "/projects/1/related-works/add",
    );
  });

  it("should link straight to the plan's add page when the project has one plan", () => {
    setupMocks({ plans: [PUBLISHED_PLAN, { ...DRAFT_PLAN, id: null }] });
    renderPage();

    expect(screen.getByRole("link", { name: "RelatedWorksAddPanel.button" })).toHaveAttribute(
      "href",
      "/projects/1/dmp/1/related-works/add",
    );
  });

  it("should open on Confirm matches with a plan filter instead of a single plan", () => {
    renderPage();

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "RelatedWorksTabs.tabs.accepted",
      "RelatedWorksTabs.tabs.pending",
      "RelatedWorksTabs.tabs.rejected",
    ]);
    expect(screen.getByRole("tab", { name: "RelatedWorksTabs.tabs.pending" })).toHaveAttribute("aria-selected", "true");
    expect(getCardHeading("Synthetic Empathy: Emotional Intelligence in Autonomous Agents")).toBeInTheDocument();
    expect(screen.getByText("RelatedWorksList.filters.planId")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "RelatedWorksList.planScope.label" })).not.toBeInTheDocument();
  });

  it("should show the matched plan on each card and flag plans that are not published", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("tab", { name: "RelatedWorksTabs.tabs.accepted" }));

    const cards = within(screen.getByTestId("related-works-list")).getAllByRole("listitem");
    expect(cards[0]).toHaveTextContent("RelatedWorksListItem.fieldNames.planTitle: Published plan");
    expect(cards[0]).not.toHaveTextContent("RelatedWorksListItem.badges.unpublished");
    expect(cards[1]).toHaveTextContent("RelatedWorksListItem.fieldNames.planTitle: Draft plan");
    expect(cards[1]).toHaveTextContent("RelatedWorksListItem.badges.unpublished");
  });

  it("should explain how matching works when no plan in the project is published", () => {
    setupMocks({ plans: [DRAFT_PLAN] });
    renderPage();

    expect(screen.queryByRole("tab", { name: "RelatedWorksTabs.tabs.rejected" })).not.toBeInTheDocument();
    expect(screen.getByText("RelatedWorksAddPanel.descriptionUnpublished")).toBeInTheDocument();

    const explainer = screen.getByRole("region", { name: "RelatedWorksUnpublished.title" });
    // The project page covers every plan, so it doesn't name one
    expect(explainer).not.toHaveTextContent("RelatedWorksUnpublished.planLabel");
    expect(within(explainer).queryByRole("link", { name: "RelatedWorksUnpublished.viewAllPlans" })).not.toBeInTheDocument();
    expect(within(explainer).getByRole("link", { name: "RelatedWorksUnpublished.buttons.publish" })).toHaveAttribute(
      "href",
      "/projects/1",
    );
    expect(within(explainer).getByRole("link", { name: "RelatedWorksUnpublished.buttons.add" })).toHaveAttribute(
      "href",
      "/projects/1/dmp/2/related-works/add",
    );
  });

  it("should keep every tab when at least one plan is published", () => {
    setupMocks({ plans: [DRAFT_PLAN, PUBLISHED_PLAN] });
    renderPage();

    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.queryByRole("region", { name: "RelatedWorksUnpublished.title" })).not.toBeInTheDocument();
  });

  it("should show every tab and the published copy while the project is still loading", () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === ProjectDocument) {
        return { data: undefined, loading: true } as any;
      }
      return {
        data: { relatedWorks: { items: [], totalCount: 0, statusOnlyCount: 0 } },
        loading: false,
        refetch: jest.fn(),
      } as any;
    });
    renderPage();

    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByText("RelatedWorksAddPanel.descriptionPublished")).toBeInTheDocument();
    expect(relatedWorksCalls()[0].variables).toMatchObject({ id: PROJECT_ID });
  });

  it("should not flag outputs as unpublished when a plan has no id", async () => {
    setupMocks({ plans: [PUBLISHED_PLAN, { ...DRAFT_PLAN, id: null }] });
    renderPage();
    await userEvent.click(screen.getByRole("tab", { name: "RelatedWorksTabs.tabs.accepted" }));

    expect(screen.queryByText("RelatedWorksListItem.badges.unpublished")).not.toBeInTheDocument();
  });

  it("should pass axe accessibility test", async () => {
    const { container } = renderPage();

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it("should pass axe accessibility test when no plan is published", async () => {
    setupMocks({ plans: [DRAFT_PLAN] });
    const { container } = renderPage();

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
