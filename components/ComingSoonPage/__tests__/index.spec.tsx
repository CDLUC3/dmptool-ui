import React from "react";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import { mockScrollTo } from "@/__mocks__/common";

import ComingSoonPage from "../index";

expect.extend(toHaveNoViolations);

jest.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => "/about"),
}));

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

describe("ComingSoonPage", () => {
  beforeEach(() => {
    mockScrollTo();
  });

  it("should render the title, description and coming soon message", () => {
    render(<ComingSoonPage title="About" description="About the tool" />);

    expect(screen.getByRole("heading", { level: 1, name: "About" })).toBeInTheDocument();
    expect(screen.getByText("About the tool")).toBeInTheDocument();
    expect(screen.getByText("message")).toBeInTheDocument();
  });

  it("should render breadcrumbs from Home through the parent pages to this page", () => {
    render(
      <ComingSoonPage
        title="Usage statistics"
        parentBreadcrumbs={[{ label: "Admin", href: "/admin" }]}
      />
    );

    expect(screen.getByRole("link", { name: "breadcrumbs.home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");
    expect(screen.queryByRole("link", { name: "Usage statistics" })).not.toBeInTheDocument();
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(
      <ComingSoonPage
        title="About"
        description="About the tool"
        parentBreadcrumbs={[{ label: "Admin", href: "/admin" }]}
      />
    );

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
