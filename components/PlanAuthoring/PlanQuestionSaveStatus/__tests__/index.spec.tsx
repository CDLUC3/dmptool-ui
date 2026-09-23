import React from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import PlanQuestionSaveStatus from "../index";

expect.extend(toHaveNoViolations);

describe("PlanQuestionSaveStatus", () => {
  it("renders nothing when clean", () => {
    const { container } = render(<PlanQuestionSaveStatus state="clean" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("exposes a polite live region while saving", () => {
    render(<PlanQuestionSaveStatus state="saving" />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("saveStatus.saving");
  });

  it("shows the provided error message on error", () => {
    render(
      <PlanQuestionSaveStatus
        state="error"
        errorMessage="Could not save answer"
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Could not save answer"
    );
  });

  it("should not have accessibility violations", async () => {
    const { container } = render(<PlanQuestionSaveStatus state="saved" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
