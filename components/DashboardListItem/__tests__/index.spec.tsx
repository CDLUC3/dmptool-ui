import React from "react";
import "@testing-library/jest-dom";
import { render, screen, act } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { NextIntlClientProvider } from "next-intl";
import DashboardListItem from "../index";

expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/'),
}));

// Mock translations
const messages = {
  Global: {
    links: {
      update: "Update",
    },
  },
};

const renderWithIntl = (component: React.ReactElement, wrapInList = false) => {
  const wrappedComponent = wrapInList ? <div role="list">{component}</div> : component;

  return render(
    <NextIntlClientProvider
      locale="en"
      messages={messages}
    >
      {wrappedComponent}
    </NextIntlClientProvider>,
  );
};

describe("DashboardListItem", () => {
  const defaultProps = {
    heading: "Test Dashboard Item",
    url: "/test-url",
    children: <p>Test content description</p>,
  };

  it("should render the component with correct structure", () => {
    renderWithIntl(<DashboardListItem {...defaultProps} />);

    const listItem = screen.getByTestId("dashboard-list-item");
    expect(listItem).toBeInTheDocument();
  });

  it("should display the heading correctly", () => {
    renderWithIntl(<DashboardListItem {...defaultProps} />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Test Dashboard Item");
  });

  it("should render children content", () => {
    renderWithIntl(<DashboardListItem {...defaultProps} />);

    expect(screen.getByText("Test content description")).toBeInTheDocument();
  });

  it("should have accessible links with aria-labels", () => {
    // Render in non-fully-clickable mode so both title and update are separate links
    renderWithIntl(<DashboardListItem {...defaultProps} isFullyClickable={false} />);

    // Should have 2 links (title and update button)
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);

    // Both links should go to the correct URL and have aria-labels
    links.forEach((link) => {
      expect(link).toHaveAttribute("href", "/test-url");
      expect(link).toHaveAttribute("aria-label");
    });
  });

  it("should generate unique heading ID", () => {
    renderWithIntl(<DashboardListItem {...defaultProps} />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveAttribute("id");
    expect(heading.getAttribute("id")).toBeTruthy();
  });

  it("should handle heading with special characters and spaces", () => {
    const propsWithSpecialHeading = {
      ...defaultProps,
      heading: "Special Heading With Spaces & Characters!",
    };

    renderWithIntl(<DashboardListItem {...propsWithSpecialHeading} />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveAttribute("id");
    expect(heading).toHaveTextContent("Special Heading With Spaces & Characters!");
  });

  it("should have proper CSS classes applied", () => {
    renderWithIntl(<DashboardListItem {...defaultProps} />);

    const listItem = screen.getByTestId("dashboard-list-item");
    expect(listItem).toHaveClass("dashboardItemLink");
  });

  it("should render with different URLs correctly", () => {
    const propsWithDifferentUrl = {
      ...defaultProps,
      url: "/different/path",
    };

    renderWithIntl(<DashboardListItem {...propsWithDifferentUrl} />);

    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link).toHaveAttribute("href", "/different/path");
    });
  });

  it("should pass axe accessibility test", async () => {
    const { container } = renderWithIntl(<DashboardListItem {...defaultProps} />, true);

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
