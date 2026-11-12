import React from "react";
import { act, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import RelatedWorksUnpublished from "@/components/RelatedWorksUnpublished";

expect.extend(toHaveNoViolations);

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

const PUBLISH_HREF = "/projects/1/dmp/2";
const ADD_HREF = "/projects/1/dmp/2/related-works/add";
const ALL_PLANS_HREF = "/projects/1/related-works";

describe("RelatedWorksUnpublished", () => {
  it("should explain the matching steps in order with publish and add links", () => {
    render(
      <RelatedWorksUnpublished
        publishHref={PUBLISH_HREF}
        addHref={ADD_HREF}
      />,
    );

    const explainer = screen.getByRole("region", { name: "title" });
    expect(within(explainer).getByRole("heading", { level: 3, name: "title" })).toBeInTheDocument();
    expect(explainer).toHaveTextContent("intro");
    expect(within(within(explainer).getByRole("list")).getAllByRole("listitem").map((step) => step.textContent)).toEqual([
      "steps.search",
      "steps.review",
      "steps.linked",
    ]);
    expect(within(explainer).getByRole("link", { name: "buttons.publish" })).toHaveAttribute("href", PUBLISH_HREF);
    expect(within(explainer).getByRole("link", { name: "buttons.add" })).toHaveAttribute("href", ADD_HREF);
  });

  it("should not name a plan on the project page", () => {
    render(
      <RelatedWorksUnpublished
        publishHref={PUBLISH_HREF}
        addHref={ADD_HREF}
      />,
    );

    expect(screen.queryByText(/planLabel/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "viewAllPlans" })).not.toBeInTheDocument();
  });

  it("should name the plan and link to all plans on the plan page", () => {
    render(
      <RelatedWorksUnpublished
        publishHref={PUBLISH_HREF}
        addHref={ADD_HREF}
        planTitle="Coastal ocean plan"
        viewAllPlansHref={ALL_PLANS_HREF}
      />,
    );

    expect(screen.getByText("planLabel: Coastal ocean plan")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "viewAllPlans" })).toHaveAttribute("href", ALL_PLANS_HREF);
  });

  it("should show the plan or the link on its own", () => {
    const { rerender } = render(
      <RelatedWorksUnpublished
        publishHref={PUBLISH_HREF}
        addHref={ADD_HREF}
        planTitle="Coastal ocean plan"
      />,
    );
    expect(screen.getByText("planLabel: Coastal ocean plan")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "viewAllPlans" })).not.toBeInTheDocument();

    rerender(
      <RelatedWorksUnpublished
        publishHref={PUBLISH_HREF}
        addHref={ADD_HREF}
        viewAllPlansHref={ALL_PLANS_HREF}
      />,
    );
    expect(screen.queryByText(/planLabel/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "viewAllPlans" })).toBeInTheDocument();
  });

  it("should move through the links in reading order with the keyboard", async () => {
    render(
      <RelatedWorksUnpublished
        publishHref={PUBLISH_HREF}
        addHref={ADD_HREF}
        planTitle="Coastal ocean plan"
        viewAllPlansHref={ALL_PLANS_HREF}
      />,
    );

    await userEvent.tab();
    expect(screen.getByRole("link", { name: "viewAllPlans" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "buttons.publish" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "buttons.add" })).toHaveFocus();
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(
      <RelatedWorksUnpublished
        publishHref={PUBLISH_HREF}
        addHref={ADD_HREF}
        planTitle="Coastal ocean plan"
        viewAllPlansHref={ALL_PLANS_HREF}
      />,
    );

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
