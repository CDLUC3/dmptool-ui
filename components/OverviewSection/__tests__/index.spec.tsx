import { fireEvent, render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import OverviewSection from "../index";

expect.extend(toHaveNoViolations);

describe("OverviewSection", () => {
  const defaultProps = {
    heading: "Test Section",
    headingId: "test-section",
    linkHref: "/test-link",
    linkText: "Edit",
    linkAriaLabel: "Edit test section",
  };

  it("renders with required props", () => {
    render(
      <OverviewSection {...defaultProps}>
        <p>Test content</p>
      </OverviewSection>,
    );

    expect(screen.getByText("Test Section")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("should not have accessibility violations", async () => {
    const { container } = render(
      <OverviewSection {...defaultProps}>
        <p>Test content</p>
      </OverviewSection>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders complex children content", () => {
    render(
      <OverviewSection {...defaultProps}>
        <div>
          <p>
            <strong>Count: 5</strong>
          </p>
          <p>
            <span>Item 1</span>
            <span>Item 2</span>
          </p>
        </div>
      </OverviewSection>,
    );

    expect(screen.getByText("Count: 5")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("renders a disabled edit control and no link when disabled", () => {
    render(
      <OverviewSection
        {...defaultProps}
        disabled
        hoverMessage="Only collaborators can edit"
      >
        <p>Test content</p>
      </OverviewSection>,
    );

    expect(screen.queryByRole("link", { name: "Edit test section" })).not.toBeInTheDocument();
    const disabledButton = screen.getByRole("button", { name: "Edit" });
    expect(disabledButton).toHaveAttribute("aria-disabled", "true");
  });

  it("shows popover message via DialogTrigger when disabled control is pressed", () => {
    render(
      <OverviewSection
        {...defaultProps}
        disabled
        hoverMessage="Only collaborators can edit"
      >
        <p>Test content</p>
      </OverviewSection>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Only collaborators can edit")).toBeInTheDocument();
  });
});
