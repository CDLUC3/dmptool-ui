import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { NextIntlClientProvider } from "next-intl";
import { axe, toHaveNoViolations } from "jest-axe";

import { RelatedWorksIdentifierType, RelatedWorkStatus } from "@/generated/graphql";
import { RelatedWorksTabs } from "@/components/RelatedWorksTabs";
import { RelatedWorksList } from "@/components/RelatedWorksList";

expect.extend(toHaveNoViolations);

// Mock RelatedWorksList as it is already tested elsewhere
jest.mock("@/components/RelatedWorksList", () => ({
  RelatedWorksList: jest.fn(({ status, onReviewMatches }) => (
    <div data-testid={`related-works-${status}`}>
      {onReviewMatches && (
        <button
          type="button"
          onClick={onReviewMatches}
        >
          {`review-from-${status}`}
        </button>
      )}
    </div>
  )),
}));

const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NextIntlClientProvider
    locale="en"
    messages={{}}
  >
    {children}
  </NextIntlClientProvider>
);

describe("RelatedWorksTabs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Tabs read and write the URL hash, so start each test without one
    window.history.replaceState(null, "", "/");
  });

  it("renders all tabs", () => {
    render(
      <TestProviders>
        <RelatedWorksTabs
          identifierType={RelatedWorksIdentifierType.PlanId}
          identifier={1}
        />
      </TestProviders>,
    );

    expect(screen.getByRole("tab", { name: "tabs.pending" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "tabs.accepted" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "tabs.rejected" })).toBeVisible();
  });

  it("renders pending works by default", () => {
    render(
      <TestProviders>
        <RelatedWorksTabs
          identifierType={RelatedWorksIdentifierType.PlanId}
          identifier={1}
        />
      </TestProviders>,
    );

    expect(screen.getByTestId(`related-works-${RelatedWorkStatus.Pending}`)).toBeInTheDocument();
  });

  it("switches to accepted tab", async () => {
    render(
      <TestProviders>
        <RelatedWorksTabs
          identifierType={RelatedWorksIdentifierType.PlanId}
          identifier={1}
        />
      </TestProviders>,
    );

    await userEvent.click(screen.getByRole("tab", { name: "tabs.accepted" }));

    expect(screen.getByTestId(`related-works-${RelatedWorkStatus.Accepted}`)).toBeInTheDocument();
  });

  it("switches to confirm matches and focuses its tab from an empty state action", async () => {
    render(
      <TestProviders>
        <RelatedWorksTabs
          identifierType={RelatedWorksIdentifierType.PlanId}
          identifier={1}
          hasPublishedPlan={true}
        />
      </TestProviders>,
    );

    await userEvent.click(screen.getByRole("tab", { name: "tabs.accepted" }));
    await userEvent.click(screen.getByRole("button", { name: `review-from-${RelatedWorkStatus.Accepted}` }));

    const pendingTab = screen.getByRole("tab", { name: "tabs.pending" });
    expect(pendingTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId(`related-works-${RelatedWorkStatus.Pending}`)).toBeInTheDocument();
    expect(window.location.hash).toBe("#maybe");
    await waitFor(() => expect(pendingTab).toHaveFocus());
  });

  it("does not offer empty state tab switching when the plan is unpublished", async () => {
    render(
      <TestProviders>
        <RelatedWorksTabs
          identifierType={RelatedWorksIdentifierType.PlanId}
          identifier={1}
          hasPublishedPlan={false}
        />
      </TestProviders>,
    );

    await userEvent.click(screen.getByRole("tab", { name: "tabs.accepted" }));
    expect(screen.queryByRole("button", { name: /review-from/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "tabs.rejected" })).not.toBeInTheDocument();
  });

  it("switches to rejected tab", async () => {
    render(
      <TestProviders>
        <RelatedWorksTabs
          identifierType={RelatedWorksIdentifierType.PlanId}
          identifier={1}
        />
      </TestProviders>,
    );

    await userEvent.click(screen.getByRole("tab", { name: "tabs.rejected" }));

    expect(screen.getByTestId(`related-works-${RelatedWorkStatus.Rejected}`)).toBeInTheDocument();
  });

  it("opens the tab named in the URL hash and follows later hash changes", async () => {
    window.history.replaceState(null, "", "/#related");
    render(
      <TestProviders>
        <RelatedWorksTabs
          identifierType={RelatedWorksIdentifierType.PlanId}
          identifier={1}
        />
      </TestProviders>,
    );

    expect(screen.getByRole("tab", { name: "tabs.accepted" })).toHaveAttribute("aria-selected", "true");

    act(() => {
      window.history.replaceState(null, "", "/#dismissed");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(screen.getByRole("tab", { name: "tabs.rejected" })).toHaveAttribute("aria-selected", "true");

    act(() => {
      window.history.replaceState(null, "", "/#unknown");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(screen.getByRole("tab", { name: "tabs.rejected" })).toHaveAttribute("aria-selected", "true");
  });

  it("keeps the URL hash in step with the selected tab", async () => {
    render(
      <TestProviders>
        <RelatedWorksTabs
          identifierType={RelatedWorksIdentifierType.PlanId}
          identifier={1}
        />
      </TestProviders>,
    );

    await userEvent.click(screen.getByRole("tab", { name: "tabs.rejected" }));
    expect(window.location.hash).toBe("#dismissed");
  });

  it("shows the unpublished explainer in Confirm matches instead of a list", () => {
    render(
      <TestProviders>
        <RelatedWorksTabs
          identifierType={RelatedWorksIdentifierType.PlanId}
          identifier={1}
          hasPublishedPlan={false}
          unpublishedContent={<p>publish your plan first</p>}
        />
      </TestProviders>,
    );

    const panel = screen.getByRole("tabpanel", { name: "tabs.pending" });
    expect(within(panel).getByText("publish your plan first")).toBeInTheDocument();
    expect(screen.queryByTestId(`related-works-${RelatedWorkStatus.Pending}`)).not.toBeInTheDocument();
  });

  it("passes the plan scope and add link to each list", async () => {
    const planScope = { title: "My plan", allPlansHref: "/projects/1/related-works" };
    render(
      <TestProviders>
        <RelatedWorksTabs
          identifierType={RelatedWorksIdentifierType.PlanId}
          identifier={7}
          hasPublishedPlan={true}
          planScope={planScope}
          addHref="/add"
          unpublishedPlanIds={[3]}
        />
      </TestProviders>,
    );

    expect(jest.mocked(RelatedWorksList)).toHaveBeenLastCalledWith(
      expect.objectContaining({
        identifierType: RelatedWorksIdentifierType.PlanId,
        identifier: 7,
        status: RelatedWorkStatus.Pending,
        planScope,
        addHref: "/add",
        unpublishedPlanIds: [3],
        onReviewMatches: expect.any(Function),
      }),
      undefined,
    );
  });

  it("moves between tabs with the arrow keys", async () => {
    render(
      <TestProviders>
        <RelatedWorksTabs
          identifierType={RelatedWorksIdentifierType.PlanId}
          identifier={1}
        />
      </TestProviders>,
    );

    await userEvent.tab();
    expect(screen.getByRole("tab", { name: "tabs.pending" })).toHaveFocus();

    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "tabs.accepted" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId(`related-works-${RelatedWorkStatus.Accepted}`)).toBeInTheDocument();

    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "tabs.rejected" })).toHaveFocus();
    expect(window.location.hash).toBe("#dismissed");
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(
      <TestProviders>
        <RelatedWorksTabs
          identifierType={RelatedWorksIdentifierType.PlanId}
          identifier={1}
        />
      </TestProviders>,
    );

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it("should pass axe accessibility test when the plan is not published", async () => {
    const { container } = render(
      <TestProviders>
        <RelatedWorksTabs
          identifierType={RelatedWorksIdentifierType.PlanId}
          identifier={1}
          hasPublishedPlan={false}
          unpublishedContent={<p>publish your plan first</p>}
        />
      </TestProviders>,
    );

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
