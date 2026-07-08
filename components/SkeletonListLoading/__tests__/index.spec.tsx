import React from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import SkeletonListLoading from "../index";

expect.extend(toHaveNoViolations);

describe("SkeletonListLoading", () => {
  it("renders 5 skeleton items by default", () => {
    render(<SkeletonListLoading />);

    expect(screen.getByTestId("skeleton-list-loading")).toBeInTheDocument();
    expect(screen.getByTestId("skeleton-list-loading").querySelectorAll('[class*="skeletonItem"]')).toHaveLength(5);
  });

  it("renders a custom count of skeleton items", () => {
    render(<SkeletonListLoading count={3} />);

    expect(screen.getByTestId("skeleton-list-loading").querySelectorAll('[class*="skeletonItem"]')).toHaveLength(3);
  });

  it("clamps count to a minimum of 1", () => {
    render(<SkeletonListLoading count={0} />);

    expect(screen.getByTestId("skeleton-list-loading").querySelectorAll('[class*="skeletonItem"]')).toHaveLength(1);
  });

  it("clamps count to a maximum of 20", () => {
    render(<SkeletonListLoading count={25} />);

    expect(screen.getByTestId("skeleton-list-loading").querySelectorAll('[class*="skeletonItem"]')).toHaveLength(20);
  });

  it("does not render when isActive is false", () => {
    render(<SkeletonListLoading isActive={false} />);

    expect(screen.queryByTestId("skeleton-list-loading")).not.toBeInTheDocument();
  });

  it("announces a clear loading message to screen readers", () => {
    render(<SkeletonListLoading ariaLabel="Loading projects" />);

    expect(screen.getByTestId("skeleton-list-loading-message")).toHaveTextContent("Loading projects");
  });

  it("uses a descriptive default loading message", () => {
    render(<SkeletonListLoading />);

    expect(screen.getByTestId("skeleton-list-loading-message")).toHaveTextContent("Loading list, please wait");
  });

  it("has correct accessibility attributes on the status region", () => {
    render(<SkeletonListLoading ariaLabel="Loading projects" />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(status).toHaveAttribute("aria-busy", "true");
  });

  it("hides decorative skeleton visuals from assistive technology", () => {
    render(<SkeletonListLoading count={3} />);

    const decorativeList = screen.getByTestId("skeleton-list-loading").querySelector('[aria-hidden="true"]');
    expect(decorativeList).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("applies additional className", () => {
    render(<SkeletonListLoading className="custom-class" />);

    expect(screen.getByTestId("skeleton-list-loading")).toHaveClass("custom-class");
  });

  it("should not have accessibility violations", async () => {
    const { container } = render(<SkeletonListLoading count={3} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
