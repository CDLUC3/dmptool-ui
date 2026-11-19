import React from "react";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import PageHeader from "@/components/PageHeader";

expect.extend(toHaveNoViolations);

jest.mock("@/components/BackButton", () => ({
  __esModule: true,
  default: () => <button type="button">back</button>,
}));

describe("PageHeader", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
  });

  it("should render the title as the only h1 and set the document title", () => {
    render(<PageHeader title="Research outputs" />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Research outputs" })).toBeInTheDocument();
    expect(document.title).toBe("Research outputs | DMP Tool");
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("should strip HTML from the title", () => {
    render(<PageHeader title="<em>Research</em> outputs" />);

    expect(screen.getByRole("heading", { level: 1, name: "Research outputs" })).toBeInTheDocument();
    expect(document.title).toBe("Research outputs | DMP Tool");
  });

  it("should not change the document title while the title is empty", () => {
    document.title = "Previous page | DMP Tool";
    render(<PageHeader title="  " />);

    expect(document.title).toBe("Previous page | DMP Tool");
  });

  it("should render a plain text description", () => {
    render(
      <PageHeader
        title="Research outputs"
        description="Outputs linked to your plan."
      />,
    );

    expect(screen.getByText("Outputs linked to your plan.")).toHaveClass("pageheader-intro");
  });

  it("should render rich description content", () => {
    render(
      <PageHeader
        title="Research outputs"
        description={
          <>
            Outputs are matched <strong>after you publish</strong> your plan.
          </>
        }
      />,
    );

    const strong = screen.getByText("after you publish");
    expect(strong.tagName).toBe("STRONG");
    expect(strong.closest("p")).toHaveTextContent("Outputs are matched after you publish your plan.");
  });

  it("should leave out the description when there is none", () => {
    const { container } = render(<PageHeader title="Research outputs" />);

    expect(container.querySelector(".pageheader-intro")).not.toBeInTheDocument();
  });

  it("should render breadcrumbs, the back button, actions and extra classes", () => {
    const { container, rerender } = render(
      <PageHeader
        title="Research outputs"
        className="custom-header"
        breadcrumbs={<nav aria-label="Breadcrumbs">crumbs</nav>}
        actions={<a href="/add">Add research output</a>}
      />,
    );

    expect(container.firstChild).toHaveClass("template-editor-header", "custom-header");
    expect(screen.getByRole("navigation", { name: "Breadcrumbs" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "back" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add research output" })).toHaveAttribute("href", "/add");

    rerender(
      <PageHeader
        title="Research outputs"
        showBackButton={false}
      />,
    );
    expect(screen.queryByRole("button", { name: "back" })).not.toBeInTheDocument();
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(
      <PageHeader
        title="Research outputs"
        description={
          <>
            Outputs are matched <strong>after you publish</strong> your plan.
          </>
        }
        actions={<a href="/add">Add research output</a>}
      />,
    );

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
