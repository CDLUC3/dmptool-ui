import React from "react";
import { render, screen } from "@testing-library/react";
import QuestionPreviewLink from "..";

jest.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("QuestionPreviewLink", () => {
  it("opens the preview in a new tab with the editor's preview id", () => {
    render(
      <QuestionPreviewLink href="/template/7/preview/q/22" label="Preview question" draftSync={{ previewId: "abc" }} />
    );

    const link = screen.getByRole("link", { name: /Preview question/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
    expect(link).toHaveAttribute("href", "/template/7/preview/q/22?draft=abc");
  });

  it("explains that the preview includes unsaved changes", () => {
    render(
      <QuestionPreviewLink href="/template/7/preview/q/22" label="Preview question" draftSync={{ previewId: "abc" }} />
    );

    expect(screen.getByRole("link", { name: /Preview question/ })).toHaveAccessibleDescription(
      "questionPreview.linkHelp"
    );
  });

  it("shows a disabled button until the editor has a preview id", () => {
    render(
      <QuestionPreviewLink href="/template/7/preview/q/22" label="Preview question" draftSync={{ previewId: null }} />
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview question" })).toBeDisabled();
  });

  it("shows a disabled button when disabled", () => {
    render(
      <QuestionPreviewLink
        href="/template/7/preview/q/22"
        label="Preview question"
        isDisabled
        draftSync={{ previewId: "abc" }}
      />
    );

    expect(screen.getByRole("button", { name: "Preview question" })).toBeDisabled();
  });
});
