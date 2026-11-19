import React from "react";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import RelatedWorksAddPanel from "@/components/RelatedWorksAddPanel";

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
  usePathname: jest.fn(() => "/projects/1/related-works"),
}));

const ADD_HREF = "/projects/1/dmp/2/related-works/add";

describe("RelatedWorksAddPanel", () => {
  it("should render a labelled section with a heading, description and add link", () => {
    render(<RelatedWorksAddPanel href={ADD_HREF} />);

    const panel = screen.getByRole("region", { name: "title" });
    expect(screen.getByRole("heading", { level: 2, name: "title" })).toBeInTheDocument();
    expect(panel).toHaveTextContent("descriptionPublished");
    expect(screen.getByRole("link", { name: "button" })).toHaveAttribute("href", ADD_HREF);
  });

  it("should describe adding outputs before the plan is published", () => {
    render(
      <RelatedWorksAddPanel
        href={ADD_HREF}
        hasPublishedPlan={false}
      />,
    );

    expect(screen.getByText("descriptionUnpublished")).toBeInTheDocument();
    expect(screen.queryByText("descriptionPublished")).not.toBeInTheDocument();
  });

  it("should reach the add link with the keyboard", async () => {
    render(<RelatedWorksAddPanel href={ADD_HREF} />);

    await userEvent.tab();
    expect(screen.getByRole("link", { name: "button" })).toHaveFocus();
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(<RelatedWorksAddPanel href={ADD_HREF} />);

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
