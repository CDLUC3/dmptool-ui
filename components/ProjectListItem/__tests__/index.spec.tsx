import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ProjectListItem from "../index";
import { ProjectItemProps } from "@/app/types";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

// Mock next-intl hooks
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => jest.fn((key) => key)),
}));

// Mock data from styleguide - using the "perfect data example"
const mockProjectItem: ProjectItemProps = {
  title: "Coastal Ocean Processes of North Greenland",
  link: "/projects/coastal-ocean-greenland",
  startDate: "July 1st 2025",
  endDate: "June 30 2028",
  funding: "National Science Foundation (nsf.gov), European Research Council",
  grantId: "252552-255",
  defaultExpanded: false,
  modified: "04-01-2024",
  members: [
    { name: "Dr. Erik Lindström", roles: "Principal Investigator" },
    { name: "Dr. Anna Bergqvist", roles: "Co-Investigator" },
    { name: "Dr. Magnus Carlsson", roles: "Research Associate" },
    { name: "Dr. Astrid Johansson", roles: "Postdoctoral Researcher" },
  ],
  plans: [
    {
      name: "Ocean Processes of Greenland",
      dmpId: "10.4832/DIB57N",
      link: "/projects/coastal-ocean-greenland/plans/1",
    },
    {
      name: "Arctic Marine Data Collection Protocol",
      dmpId: null,
      link: "/projects/coastal-ocean-greenland/plans/2",
    },
    {
      name: "Climate Change Impact Assessment",
      dmpId: "10.1038/s41597-024-03456",
      link: "/projects/coastal-ocean-greenland/plans/3",
    },
  ],
};

describe("ProjectListItem", () => {
  it("should render the ProjectListItem component", () => {
    render(<ProjectListItem item={mockProjectItem} />);

    // Check for the main project title heading
    expect(
      screen.getByRole("heading", { level: 2, name: /Coastal Ocean Processes of North Greenland/i }),
    ).toBeInTheDocument();

    // Check for plans section
    expect(screen.getByText("plans")).toBeInTheDocument();
    expect(screen.getByText("Ocean Processes of Greenland")).toBeInTheDocument();

    // Check for update links (title link + update button)
    const updateLinks = screen.getAllByRole("link", { name: /buttons.linkUpdate/i });
    expect(updateLinks.length).toBe(1);

    // Check for expand button
    expect(screen.getByRole("button", { name: /buttons.linkExpand/i })).toBeInTheDocument();
    expect(screen.getByText("projectDetails")).toBeInTheDocument();
  });

  it("should expand and collapse the project details", () => {
    render(<ProjectListItem item={mockProjectItem} />);

    const expandButton = screen.getByRole("button", { name: /buttons.linkExpand/i });
    fireEvent.click(expandButton);

    // Check for expanded content that only appears when expanded
    expect(screen.getByText("July 1st 2025 to June 30 2028")).toBeInTheDocument();

    // Check for the expanded project members section (all members listed)
    // Since each member is in a separate span, we need to check for individual members
    expect(screen.getByText(/Dr. Anna Bergqvist/i)).toBeInTheDocument();
    expect(screen.getByText(/Dr. Magnus Carlsson/i)).toBeInTheDocument();
    expect(screen.getByText(/Dr. Astrid Johansson/i)).toBeInTheDocument();

    // Check for funding details in expanded section
    expect(screen.getByText(/National Science Foundation \(nsf\.gov\) \(252552-255\)/i)).toBeInTheDocument();

    // Check for section headings using getAllByRole to handle multiple matches
    const h4Headings = screen.getAllByRole("heading", { level: 4 });
    expect(h4Headings.length).toBeGreaterThanOrEqual(3); // At least project, fundings, projectMembers, researchOutputs

    const collapseButton = screen.getByRole("button", { name: /buttons.linkCollapse/i });
    fireEvent.click(collapseButton);

    // Check that expanded content is hidden (but collapsed metadata should still be there)
    expect(screen.queryByText("July 1st 2025 to June 30 2028")).not.toBeInTheDocument();
    expect(screen.queryByText(/Dr. Anna Bergqvist/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dr. Magnus Carlsson/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dr. Astrid Johansson/i)).not.toBeInTheDocument();

    // But the collapsed metadata should still be visible
    expect(screen.getByText(/Dr. Erik Lindström/i)).toBeInTheDocument(); // This should still be in collapsed metadata
  });

  it("shows view button instead of update when isReadOnly", () => {
    render(<ProjectListItem item={mockProjectItem} isReadOnly={true} />);

    expect(screen.getByRole("link", { name: /buttons.view/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /buttons.linkUpdate/i })).not.toBeInTheDocument();
  });


  it("should pass axe accessibility test", async () => {
    const { container } = render(
      <div role="list">
        <ProjectListItem item={mockProjectItem} />
      </div>,
    );

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
