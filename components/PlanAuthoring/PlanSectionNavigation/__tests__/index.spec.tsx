import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { PlanSectionDefinition } from "../../model";
import PlanSectionNavigation from "../index";

expect.extend(toHaveNoViolations);

const sections: PlanSectionDefinition[] = [
  {
    identity: { kind: "base", versionedSectionId: 1 },
    title: "Products of research",
    displayOrder: 1,
    questions: [],
  },
  {
    identity: { kind: "base", versionedSectionId: 2 },
    title: "Access and sharing",
    displayOrder: 2,
    questions: [],
  },
];

describe("PlanSectionNavigation", () => {
  it("marks the active section and wires picker/select callbacks", () => {
    const onOpenPicker = jest.fn();
    const onSelectSection = jest.fn();

    render(
      <PlanSectionNavigation
        sections={sections}
        activeSection={sections[0]}
        activeIndex={0}
        onOpenPicker={onOpenPicker}
        onSelectSection={onSelectSection}
      />
    );

    expect(
      screen.getByRole("navigation", { name: "sectionNav.ariaLabel" })
    ).toBeInTheDocument();

    // Translation mock returns the key, so every segment shares the same name.
    const segments = screen.getAllByRole("button", {
      name: "sectionNav.goToSectionAria",
    });
    expect(segments).toHaveLength(2);
    expect(segments[0]).toHaveAttribute("aria-current", "true");
    expect(segments[1]).not.toHaveAttribute("aria-current");

    fireEvent.click(segments[1]);
    expect(onSelectSection).toHaveBeenCalledWith(sections[1]);

    fireEvent.click(
      screen.getByRole("button", { name: "sectionNav.openPickerAria" })
    );
    expect(onOpenPicker).toHaveBeenCalled();
  });

  it("should not have accessibility violations", async () => {
    const { container } = render(
      <PlanSectionNavigation
        sections={sections}
        activeSection={sections[0]}
        activeIndex={0}
        onOpenPicker={jest.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
