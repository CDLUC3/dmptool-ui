import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { useParams } from "next/navigation";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { axe, toHaveNoViolations } from "jest-axe";
import { useMutation, useQuery } from "@apollo/client/react";
import RelatedWorksPlanPage from "../page";
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
  usePathname: jest.fn(() => "/projects/1/dmp/2/related-works"),
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
const PLAN_ID = 2;

const WORKS_BY_STATUS = {
  [RelatedWorkStatus.Accepted]: MOCK_ACCEPTED_WORKS,
  [RelatedWorkStatus.Pending]: MOCK_PENDING_WORKS,
  [RelatedWorkStatus.Rejected]: MOCK_REJECTED_WORKS,
};

let mockUpdateStatus: jest.Mock;

/* eslint-disable @typescript-eslint/no-explicit-any */
const setupMocks = ({ registered = "2025-01-01" as string | null, projectLoaded = true } = {}) => {
  mockUseQuery.mockImplementation((document, options: any) => {
    if (document === ProjectDocument) {
      return {
        data: projectLoaded
          ? {
              project: {
                plans: [
                  { id: PLAN_ID, title: "Coastal ocean plan", registered },
                  { id: 3, title: "Another plan", registered: "2025-01-01" },
                ],
              },
            }
          : undefined,
        loading: !projectLoaded,
      } as any;
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
      <RelatedWorksPlanPage />
    </NextIntlClientProvider>,
  );

describe("RelatedWorksPlanPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState(null, "", "/");
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader
    mockUseTranslations.mockImplementation(namespacedTranslations as any);
    mockUseParams.mockReturnValue({ projectId: String(PROJECT_ID), dmpid: String(PLAN_ID) });
    mockUpdateStatus = jest.fn().mockResolvedValue({ data: {} });
    mockUseMutation.mockReturnValue([mockUpdateStatus, { loading: false }] as any);
    setupMocks();
  });

  it("should render the page header with a single h1 and the description", () => {
    renderPage();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "RelatedWorksPlanPage.title" })).toBeInTheDocument();
    expect(screen.getByText("RelatedWorksPlanPage.description")).toBeInTheDocument();
  });

  it("should render the breadcrumb links up to the plan overview", () => {
    renderPage();

    expect(screen.getByRole("link", { name: "Global.breadcrumbs.home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Global.breadcrumbs.projects" })).toHaveAttribute("href", "/projects");
    expect(screen.getByRole("link", { name: "Global.breadcrumbs.projectOverview" })).toHaveAttribute("href", "/projects/1");
    expect(screen.getByRole("link", { name: "Global.breadcrumbs.planOverview" })).toHaveAttribute("href", "/projects/1/dmp/2");
  });

  it("should load the project and request related works for this plan", () => {
    renderPage();

    expect(mockUseQuery).toHaveBeenCalledWith(ProjectDocument, { variables: { projectId: PROJECT_ID }, skip: false });
    expect(relatedWorksCalls()[0].variables).toMatchObject({
      id: PLAN_ID,
      idType: RelatedWorksIdentifierType.PlanId,
    });
  });

  it("should link to adding a research output for this plan", () => {
    renderPage();

    expect(screen.getByText("RelatedWorksAddPanel.descriptionPublished")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "RelatedWorksAddPanel.button" })).toHaveAttribute("href", "/projects/1/dmp/2/related-works/add");
  });

  it("should open on Confirm matches with the three tabs in order", () => {
    renderPage();

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "RelatedWorksTabs.tabs.accepted",
      "RelatedWorksTabs.tabs.pending",
      "RelatedWorksTabs.tabs.rejected",
    ]);
    expect(screen.getByRole("tab", { name: "RelatedWorksTabs.tabs.pending" })).toHaveAttribute("aria-selected", "true");
    expect(getCardHeading("Synthetic Empathy: Emotional Intelligence in Autonomous Agents")).toBeInTheDocument();
    expect(getCardHeading("NeuroSynthetics: Toward Biologically-Inspired Cognitive Robotics")).toBeInTheDocument();
  });

  it("should show which plan is being matched, with a link to all plans in the project", () => {
    renderPage();

    const scope = screen.getByRole("group", { name: "RelatedWorksList.planScope.label" });
    expect(scope).toHaveTextContent("Coastal ocean plan");
    expect(within(scope).getByRole("link", { name: "RelatedWorksList.planScope.viewAllPlans" })).toHaveAttribute(
      "href",
      "/projects/1/related-works",
    );
    // The plan page is already scoped to one plan, so there is no plan filter
    expect(screen.queryByText("RelatedWorksList.filters.planId")).not.toBeInTheDocument();
  });

  it("should show your research outputs and dismissed outputs in their tabs", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("tab", { name: "RelatedWorksTabs.tabs.accepted" }));
    expect(getCardHeading("Real-Time Sim2Real Transfer for Bipedal Robot Gait Adaptation")).toBeInTheDocument();
    expect(getCardHeading("Multisensory Feedback Loops for Dexterous Robotic Manipulation")).toBeInTheDocument();
    expect(window.location.hash).toBe("#related");

    await userEvent.click(screen.getByRole("tab", { name: "RelatedWorksTabs.tabs.rejected" }));
    expect(
      getCardHeading("Stellar Cartography and the Dynamic Mapping of Interstellar Gas Clouds"),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe("#dismissed");
  });

  it("should move between tabs with the keyboard", async () => {
    renderPage();

    act(() => screen.getByRole("tab", { name: "RelatedWorksTabs.tabs.pending" }).focus());

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "RelatedWorksTabs.tabs.rejected" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "RelatedWorksTabs.tabs.rejected" })).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "RelatedWorksTabs.tabs.accepted" })).toHaveAttribute("aria-selected", "true");
  });

  it("should open the tab named in the URL hash", () => {
    window.history.replaceState(null, "", "/#dismissed");
    renderPage();

    expect(screen.getByRole("tab", { name: "RelatedWorksTabs.tabs.rejected" })).toHaveAttribute("aria-selected", "true");
  });

  it("should save a confirmed match as accepted", async () => {
    renderPage();

    const firstCard = within(screen.getByTestId("related-works-list")).getAllByRole("listitem")[0];
    await userEvent.click(within(firstCard).getByRole("button", { name: "RelatedWorksListItem.actionsAria.confirm" }));

    await waitFor(() =>
      expect(mockUpdateStatus).toHaveBeenCalledWith({
        variables: { input: { id: MOCK_PENDING_WORKS[0].id, status: RelatedWorkStatus.Accepted } },
      }),
    );
  });

  it("should explain how matching works when the plan is not published", () => {
    setupMocks({ registered: null });
    renderPage();

    expect(screen.queryByRole("tab", { name: "RelatedWorksTabs.tabs.rejected" })).not.toBeInTheDocument();
    expect(screen.getByText("RelatedWorksAddPanel.descriptionUnpublished")).toBeInTheDocument();

    const explainer = screen.getByRole("region", { name: "RelatedWorksUnpublished.title" });
    expect(explainer).toHaveTextContent("RelatedWorksUnpublished.planLabel: Coastal ocean plan");
    expect(within(explainer).getByRole("link", { name: "RelatedWorksUnpublished.viewAllPlans" })).toHaveAttribute(
      "href",
      "/projects/1/related-works",
    );
    expect(within(explainer).getByRole("link", { name: "RelatedWorksUnpublished.buttons.publish" })).toHaveAttribute(
      "href",
      "/projects/1/dmp/2",
    );
    expect(within(explainer).getByRole("link", { name: "RelatedWorksUnpublished.buttons.add" })).toHaveAttribute(
      "href",
      "/projects/1/dmp/2/related-works/add",
    );
    // There are no matches to search for until the plan is published
    expect(relatedWorksCalls().some((options) => options.variables.filterOptions.status === RelatedWorkStatus.Pending)).toBe(
      false,
    );
  });

  it("should open Confirm matches when the URL asks for Dismissed on an unpublished plan", () => {
    window.history.replaceState(null, "", "/#dismissed");
    setupMocks({ registered: null });
    renderPage();

    expect(screen.getByRole("tab", { name: "RelatedWorksTabs.tabs.pending" })).toHaveAttribute("aria-selected", "true");
  });

  it("should show every tab while the project is still loading", () => {
    setupMocks({ projectLoaded: false });
    renderPage();

    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByText("RelatedWorksAddPanel.descriptionPublished")).toBeInTheDocument();
  });

  it("should pass axe accessibility test", async () => {
    const { container } = renderPage();

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it("should pass axe accessibility test when the plan is not published", async () => {
    setupMocks({ registered: null });
    const { container } = renderPage();

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
