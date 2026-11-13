import React from "react";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import RelatedWorksEmptyState from "../index";

expect.extend(toHaveNoViolations);

describe("RelatedWorksEmptyState", () => {
  it("should render the title, description and actions as a labelled section", () => {
    render(
      <RelatedWorksEmptyState
        icon="search"
        title="No matches to review"
        description="New matches will appear here."
        actions={<button type="button">Add research output</button>}
      />,
    );

    const section = screen.getByRole("region", { name: "No matches to review" });
    expect(screen.getByRole("heading", { level: 3, name: "No matches to review" })).toBeInTheDocument();
    expect(section).toHaveTextContent("New matches will appear here.");
    expect(screen.getByRole("button", { name: "Add research output" })).toBeInTheDocument();
    expect(section.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("should render without a description or actions", () => {
    const { container } = render(
      <RelatedWorksEmptyState
        icon="cancel"
        title="No dismissed matches"
      />,
    );

    expect(container.querySelectorAll("p")).toHaveLength(0);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(
      <RelatedWorksEmptyState
        icon="check_circle"
        title="No research outputs linked yet"
        description="Confirmed outputs appear here."
        actions={<a href="/add">Add research output</a>}
      />,
    );

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
