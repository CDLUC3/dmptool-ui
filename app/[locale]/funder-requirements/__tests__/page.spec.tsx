import React from "react";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import { mockScrollTo } from "@/__mocks__/common";

import FunderRequirementsPage from "../page";

expect.extend(toHaveNoViolations);

jest.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => "/funder-requirements"),
}));

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

describe("FunderRequirementsPage", () => {
  beforeEach(() => {
    mockScrollTo();
  });

  it("should render the title, description and coming soon message", () => {
    render(<FunderRequirementsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "title" })).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(screen.getByText("comingSoon")).toBeInTheDocument();
  });

  it("should render a breadcrumb back to the home page", () => {
    render(<FunderRequirementsPage />);

    expect(screen.getByRole("link", { name: "breadcrumbs.home" })).toHaveAttribute("href", "/");
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(<FunderRequirementsPage />);

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
