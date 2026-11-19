import React from "react";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import { NextIntlClientProvider } from "next-intl";
import ExternalLink from "../index";

expect.extend(toHaveNoViolations);

const renderLink = (props: Partial<React.ComponentProps<typeof ExternalLink>> = {}) =>
  render(
    <NextIntlClientProvider
      locale="en"
      timeZone="UTC"
      messages={{}}
    >
      <ExternalLink
        href="https://doi.org/10.1234/abc"
        {...props}
      >
        {props.children ?? "My research output"}
      </ExternalLink>
    </NextIntlClientProvider>,
  );

describe("ExternalLink", () => {
  it("should open in a new tab safely", () => {
    renderLink();

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://doi.org/10.1234/abc");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should announce that the link opens in a new tab", () => {
    renderLink();

    expect(screen.getByRole("link", { name: "My research output (opensInNewTab)" })).toBeInTheDocument();
  });

  it("should show a decorative external link icon", () => {
    renderLink();

    const svg = screen.getByTestId("dmpIconSvg");
    expect(svg).toHaveClass("icon-external_link", "icon");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("fill", "currentColor");
    expect(screen.getByTestId("dmpIconSvgUse")).toHaveAttribute("href", "/icons/iconset.svg#icon-external_link");
  });

  it("should pass through other anchor props", () => {
    renderLink({ className: "match", id: "author-link" });

    const link = screen.getByRole("link");
    expect(link).toHaveClass("match");
    expect(link).toHaveAttribute("id", "author-link");
  });

  it("should pass axe accessibility test", async () => {
    const { container } = renderLink();

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
