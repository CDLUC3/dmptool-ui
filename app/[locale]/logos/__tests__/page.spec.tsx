import React from "react";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import { useTranslations } from "next-intl";
import { mockScrollTo } from "@/__mocks__/common";

import LogosPage from "../page";

expect.extend(toHaveNoViolations);

jest.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => "/logos"),
}));

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

describe("LogosPage", () => {
  beforeEach(() => {
    mockScrollTo();
  });

  it("should render the logos page as coming soon", () => {
    render(<LogosPage />);

    expect(useTranslations).toHaveBeenCalledWith("ComingSoon.pages.logos");
    expect(screen.getByRole("heading", { level: 1, name: "title" })).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(screen.getByText("message")).toBeInTheDocument();
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(<LogosPage />);

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
