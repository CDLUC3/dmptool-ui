import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { useQuery } from "@apollo/client/react";
import { useRouter } from "@/i18n/routing";
import { ProjectDocument } from "@/generated/graphql";
import AddRelatedWorkProjectPage from "../page";

expect.extend(toHaveNoViolations);

jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({ projectId: "1" })),
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
  useRouter: jest.fn(),
  usePathname: jest.fn(() => "/projects/1/related-works/add"),
}));

jest.mock("@apollo/client/react", () => ({
  useQuery: jest.fn(),
}));

const mockUseQuery = jest.mocked(useQuery);
const mockPush = jest.fn();

type MockPlan = { id: number | null; title: string; registered: string | null };

const PUBLISHED_PLAN: MockPlan = { id: 1, title: "Published plan", registered: "2025-01-01" };
const DRAFT_PLAN: MockPlan = { id: 2, title: "Draft plan", registered: null };

/* eslint-disable @typescript-eslint/no-explicit-any */
const setupMocks = ({
  plans = [PUBLISHED_PLAN, DRAFT_PLAN],
  loading = false,
  error,
}: { plans?: MockPlan[]; loading?: boolean; error?: Error } = {}) => {
  mockUseQuery.mockImplementation((document) => {
    if (document === ProjectDocument) {
      return { data: loading || error ? undefined : { project: { plans } }, loading, error } as any;
    }
    return { data: null, loading: false } as any;
  });
};

describe("AddRelatedWorkProjectPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    setupMocks();
  });

  it("should render the page header with a single h1 and the description", () => {
    render(<AddRelatedWorkProjectPage />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "title" })).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
  });

  it("should render the breadcrumb links", () => {
    render(<AddRelatedWorkProjectPage />);

    expect(screen.getByRole("link", { name: "breadcrumbs.home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "breadcrumbs.projects" })).toHaveAttribute("href", "/projects");
    expect(screen.getByRole("link", { name: "breadcrumbs.projectOverview" })).toHaveAttribute("href", "/projects/1");
    expect(screen.getByRole("link", { name: "breadcrumbs.relatedWorks" })).toHaveAttribute(
      "href",
      "/projects/1/related-works",
    );
  });

  it("should list every plan as a radio button with its publication status", () => {
    render(<AddRelatedWorkProjectPage />);

    expect(screen.getByRole("radiogroup", { name: /planLabel/ })).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    expect(screen.getByRole("radio", { name: "Published plan" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Draft plan" })).not.toBeChecked();
    // React Aria puts the group's help text on aria-describedby, so assert the
    // per-plan status labels are visible next to each option instead.
    expect(screen.getByText("planStatus.published")).toBeInTheDocument();
    expect(screen.getByText("planStatus.unpublished")).toBeInTheDocument();
  });

  it("should ask for a plan when Continue is pressed without choosing one", async () => {
    render(<AddRelatedWorkProjectPage />);

    await userEvent.click(screen.getByRole("button", { name: "buttons.continue" }));

    expect(await screen.findByText("errors.choosePlan")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should go to the chosen plan's add page when Continue is pressed", async () => {
    render(<AddRelatedWorkProjectPage />);

    await userEvent.click(screen.getByRole("radio", { name: "Draft plan" }));
    await userEvent.click(screen.getByRole("button", { name: "buttons.continue" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/projects/1/dmp/2/related-works/add");
    });
  });

  it("should choose a plan with the keyboard", async () => {
    render(<AddRelatedWorkProjectPage />);

    act(() => {
      screen.getByRole("radio", { name: "Published plan" }).focus();
    });
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Draft plan" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Draft plan" })).toHaveFocus();
  });

  it("should select the plan when the project only has one", async () => {
    setupMocks({ plans: [DRAFT_PLAN] });
    render(<AddRelatedWorkProjectPage />);

    expect(screen.getByRole("radio", { name: "Draft plan" })).toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: "buttons.continue" }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/projects/1/dmp/2/related-works/add");
    });
  });

  it("should leave out plans without an id", () => {
    setupMocks({ plans: [PUBLISHED_PLAN, { ...DRAFT_PLAN, id: null }] });
    render(<AddRelatedWorkProjectPage />);

    expect(screen.getAllByRole("radio")).toHaveLength(1);
  });

  it("should link to the project overview when the project has no plans", () => {
    setupMocks({ plans: [] });
    render(<AddRelatedWorkProjectPage />);

    expect(screen.getByText("noPlans")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "buttons.projectOverview" })).toHaveAttribute("href", "/projects/1");
  });

  it("should show a loading message while the plans load", () => {
    setupMocks({ loading: true });
    render(<AddRelatedWorkProjectPage />);

    expect(screen.getAllByText("messaging.loading").length).toBeGreaterThan(0);
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("should show an error when the plans fail to load", async () => {
    setupMocks({ error: new Error("Network failure") });
    render(<AddRelatedWorkProjectPage />);

    expect(await screen.findByText("errors.loadPlans")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryByText("noPlans")).not.toBeInTheDocument();
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(<AddRelatedWorkProjectPage />);

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it("should pass axe accessibility test when the project has no plans", async () => {
    setupMocks({ plans: [] });
    const { container } = render(<AddRelatedWorkProjectPage />);

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
