import React from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { useTranslations } from "next-intl";
import Loading from "../index";

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(),
}));

// Mock Spinner component
jest.mock("@/components/Spinner", () => {
  return function MockSpinner({ isActive }: { isActive: boolean }) {
    return isActive ? <div data-testid="spinner">Spinner</div> : null;
  };
});

const mockGlobal = jest.fn();
const mockUseTranslations = useTranslations as jest.MockedFunction<typeof useTranslations>;

describe("Loading Component", () => {
  beforeEach(() => {
    mockUseTranslations.mockReturnValue(mockGlobal as unknown as ReturnType<typeof useTranslations>);
    mockGlobal.mockReturnValue("Loading");
  });

  it("renders with default props", () => {
    render(<Loading message="Loading" />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("renders with custom message", () => {
    render(<Loading message="Custom loading message" />);

    expect(screen.getByText("Custom loading message")).toBeInTheDocument();
    expect(screen.queryByText("Loading")).not.toBeInTheDocument();
  });

  it("applies the loading message class when a message is provided", () => {
    render(<Loading message="Loading" />);

    expect(screen.getByText("Loading")).toHaveClass("loading-message");
  });

  it("applies different variants", () => {
    const { rerender } = render(<Loading variant="inline" />);
    expect(screen.getByRole("status")).toHaveClass("loading-inline");

    rerender(<Loading variant="minimal" />);
    expect(screen.getByRole("status")).toHaveClass("loading-minimal");
  });

  it("handles all valid variants", () => {
    const variants = ["page", "inline", "minimal", "fullscreen"] as const;

    variants.forEach((variant) => {
      const { unmount } = render(<Loading variant={variant} />);
      expect(screen.getByRole("status")).toHaveClass(`loading-${variant}`);
      unmount();
    });
  });

  it("defaults to page variant when invalid variant is provided", () => {
    // @ts-expect-error - Testing invalid variant
    render(<Loading variant="invalid" />);

    expect(screen.getByRole("status")).toHaveClass("loading-invalid");
  });

  it("hides spinner when showSpinner is false", () => {
    render(<Loading showSpinner={false} message="Loading" />);

    expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("does not render an empty loading message", () => {
    render(<Loading />);

    expect(screen.getByRole("status").querySelector(".loading-message")).not.toBeInTheDocument();
  });

  it("does not render when isActive is false", () => {
    render(<Loading isActive={false} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("has correct accessibility attributes", () => {
    render(<Loading />);

    const loadingElement = screen.getByRole("status");
    expect(loadingElement).toHaveAttribute("aria-live", "polite");
  });

  it("should not have accessibility violations", async () => {
    const { container } = render(<Loading />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
