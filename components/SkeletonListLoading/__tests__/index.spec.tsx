import React from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { useTranslations } from "next-intl";
import SkeletonListLoading from "../index";

expect.extend(toHaveNoViolations);

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(),
}));

const mockGlobal = jest.fn();
const mockUseTranslations = useTranslations as jest.MockedFunction<typeof useTranslations>;

describe("SkeletonListLoading", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(mockGlobal as unknown as ReturnType<typeof useTranslations>);
    mockGlobal.mockReturnValue("Loading list, please wait...");
  });

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

  it("renders 6 grid cards by default in grid layout", () => {
    render(<SkeletonListLoading layout="grid" />);

    expect(screen.getByTestId("skeleton-list-loading").querySelectorAll('[class*="skeletonCard"]')).toHaveLength(6);
  });

  it("renders a custom count of grid cards", () => {
    render(<SkeletonListLoading layout="grid" count={3} />);

    expect(screen.getByTestId("skeleton-list-loading").querySelectorAll('[class*="skeletonCard"]')).toHaveLength(3);
  });

  it("renders list items rather than grid cards in default layout", () => {
    render(<SkeletonListLoading />);

    const container = screen.getByTestId("skeleton-list-loading");
    expect(container.querySelectorAll('[class*="skeletonCard"]')).toHaveLength(0);
    expect(container.querySelectorAll('[class*="skeletonItem"]')).toHaveLength(5);
  });

  it("does not render when isActive is false", () => {
    render(<SkeletonListLoading isActive={false} />);

    expect(screen.queryByTestId("skeleton-list-loading")).not.toBeInTheDocument();
  });

  it("announces a clear loading message to screen readers", () => {
    render(<SkeletonListLoading ariaLabel="Loading projects" />);

    expect(screen.getByTestId("skeleton-list-loading-message")).toHaveTextContent("Loading projects");
  });

  it("uses the localized default loading message when no ariaLabel is passed", () => {
    render(<SkeletonListLoading />);

    expect(mockGlobal).toHaveBeenCalledWith("messaging.loadingList");
    expect(screen.getByTestId("skeleton-list-loading-message")).toHaveTextContent("Loading list, please wait...");
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

  it("should not have accessibility violations in grid layout", async () => {
    const { container } = render(<SkeletonListLoading layout="grid" count={3} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
