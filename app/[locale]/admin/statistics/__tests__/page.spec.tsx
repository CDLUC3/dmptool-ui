import React from "react";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import { mockScrollTo } from "@/__mocks__/common";

import AdminStatisticsPage from "../page";

expect.extend(toHaveNoViolations);

jest.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => "/admin/statistics"),
}));

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

describe("AdminStatisticsPage", () => {
  beforeEach(() => {
    mockScrollTo();
  });

  it("should render the usage statistics page as coming soon", () => {
    render(<AdminStatisticsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "sections.reporting.items.usageStatistics.title" })
    ).toBeInTheDocument();
    expect(screen.getByText("sections.reporting.items.usageStatistics.description")).toBeInTheDocument();
    expect(screen.getByText("message")).toBeInTheDocument();
  });

  it("should link back to the admin overview in the breadcrumbs", () => {
    render(<AdminStatisticsPage />);

    expect(screen.getByRole("link", { name: "breadcrumbs.admin" })).toHaveAttribute("href", "/admin");
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(<AdminStatisticsPage />);

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
