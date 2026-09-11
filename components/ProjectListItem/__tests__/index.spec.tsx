import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import ProjectListItem from "../index";
import { ProjectItemProps } from "@/app/types";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

// Mock next-intl hooks
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => jest.fn((key) => key)),
}));

const mockProjectItem: ProjectItemProps = {
  id: 42,
  title: "Coastal Ocean Processes of North Greenland",
  link: "/projects/coastal-ocean-greenland",
  startDate: "July 1st 2025",
  endDate: "June 30 2028",
  funding: "National Science Foundation (nsf.gov), European Research Council",
  grantId: "252552-255",
  defaultExpanded: false,
  modified: "12 Aug 2026",
  collaboratorCount: 3,
  relatedWorksCount: 3,
  members: [
    { name: "Dr. Erik Lindström", roles: "Principal Investigator" },
    { name: "Dr. Anna Bergqvist", roles: "Co-Investigator" },
  ],
  plans: [
    {
      name: "Ocean Processes of Greenland",
      dmpId: "10.4832/DIB57N",
      link: "/projects/coastal-ocean-greenland/plans/1",
      status: "DRAFT",
      role: "Owner",
      modified: "14 Aug",
    },
    {
      name: "Arctic Marine Data Collection Protocol",
      dmpId: null,
      link: "/projects/coastal-ocean-greenland/plans/2",
      status: "COMPLETE",
      role: "Editor",
      modified: "2 Jul",
    },
  ],
};

describe("ProjectListItem", () => {
  it("renders the collapsed header and summary strip", () => {
    render(<ProjectListItem item={mockProjectItem} />);

    expect(
      screen.getByRole("heading", { level: 2, name: /Coastal Ocean Processes of North Greenland/i }),
    ).toBeInTheDocument();

    // Funding line
    expect(screen.getByText(/funding: funderSummary/)).toBeInTheDocument();
    expect(screen.getByText(/grantId: 252552-255/)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Coastal Ocean Processes of North Greenland" })).toHaveAttribute(
      "href",
      "/projects/coastal-ocean-greenland",
    );
    expect(screen.getByRole("link", { name: /openProject Coastal Ocean/i })).toBeInTheDocument();

    // Summary strip
    const summary = screen.getByRole("group", { name: "projectSummary" });
    expect(within(summary).getByText("lastUpdatedOn")).toBeInTheDocument();
    expect(within(summary).getByText("planCount")).toBeInTheDocument();
    expect(within(summary).getByText("collaboratorsYouAndOthers")).toBeInTheDocument();
    expect(within(summary).getByText("relatedWorksFound")).toBeInTheDocument();

    // Plans table is hidden until expanded
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /messaging.detailsToggleAria/i })).toBeInTheDocument();
  });

  it("expands to show the plans table and collapses again", () => {
    render(<ProjectListItem item={mockProjectItem} />);

    fireEvent.click(screen.getByRole("button", { name: /messaging.detailsToggleAria/i }));

    expect(screen.getByRole("heading", { level: 3, name: "plansInProject" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "createNewDmpInProject" })).toHaveAttribute(
      "href",
      expect.stringContaining("/projects/42/dmp/start"),
    );

    const table = screen.getByRole("table");
    const headers = within(table).getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual(["plan", "statusColumn", "yourRole", "updated", "actions"]);

    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);

    const firstRow = within(rows[0]);
    expect(firstRow.getByRole("link", { name: "Ocean Processes of Greenland" })).toBeInTheDocument();
    expect(firstRow.getByText("planStatus.DRAFT")).toBeInTheDocument();
    expect(firstRow.getByText("Owner")).toBeInTheDocument();
    expect(firstRow.getByText("14 Aug")).toBeInTheDocument();
    expect(firstRow.getByRole("link", { name: /openPlan Ocean Processes of Greenland/ })).toHaveAttribute(
      "href",
      "/projects/coastal-ocean-greenland/plans/1",
    );

    expect(within(rows[1]).getByText("planStatus.COMPLETE")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /messaging.detailsToggleAria/i }));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(document.getElementById("project-42-content")).toHaveAttribute("inert");
  });

  it("uses the project id for ARIA relationships and unique ids when titles match", () => {
    render(
      <div role="list">
        <ProjectListItem item={mockProjectItem} data-index={0} />
        <ProjectListItem
          item={{ ...mockProjectItem, id: 43, title: mockProjectItem.title }}
          data-index={1}
        />
      </div>,
    );

    const heading = document.getElementById("project-42-heading");
    expect(heading).toHaveTextContent(mockProjectItem.title);
    expect(document.getElementById("project-43-heading")).toHaveTextContent(mockProjectItem.title);

    const toggle = screen.getAllByRole("button", {
      name: /messaging.detailsToggleAria/i,
    })[0];
    expect(toggle).toHaveAttribute("aria-controls", "project-42-content");
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    const region = document.getElementById("project-42-content");
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute("inert");

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveAttribute("data-index", "0");
    expect(items[1]).toHaveAttribute("data-index", "1");
  });

  it("shows an empty state when the project has no plans", () => {
    render(<ProjectListItem item={{ ...mockProjectItem, plans: [], defaultExpanded: true }} />);

    expect(screen.getByText("noPlansYet")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows noFunderSelected when funding is empty and hides the grant id", () => {
    render(<ProjectListItem item={{ ...mockProjectItem, funding: "", grantId: null }} />);

    expect(screen.getByText(/funding: noFunderSelected/)).toBeInTheDocument();
    expect(screen.queryByText(/grantId/)).not.toBeInTheDocument();
  });

  it("falls back to member names when no collaborator count is provided", () => {
    render(<ProjectListItem item={{ ...mockProjectItem, collaboratorCount: undefined }} />);

    expect(screen.getByText("collaboratorsNamed")).toBeInTheDocument();
    expect(screen.queryByText("collaboratorsYouAndOthers")).not.toBeInTheDocument();
  });

  it("omits the related works indicator when no count is provided", () => {
    render(<ProjectListItem item={{ ...mockProjectItem, relatedWorksCount: undefined }} />);

    expect(screen.queryByText("relatedWorksFound")).not.toBeInTheDocument();
  });

  it("uses a view label and hides the create link when isReadOnly", () => {
    render(<ProjectListItem item={{ ...mockProjectItem, defaultExpanded: true }} isReadOnly={true} />);

    expect(screen.getByRole("link", { name: /buttons.view Coastal Ocean/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /openProject/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "createNewDmpInProject" })).not.toBeInTheDocument();
  });

  it("shows Just you when collaboratorCount is 1", () => {
    render(<ProjectListItem item={{ ...mockProjectItem, collaboratorCount: 1 }} />);

    expect(screen.getByText("collaboratorsJustYou")).toBeInTheDocument();
    expect(screen.queryByText("collaboratorsYouAndOthers")).not.toBeInTheDocument();
  });

  it("shows None when there are no collaborators or named members", () => {
    const { rerender } = render(
      <ProjectListItem
        item={{
          ...mockProjectItem,
          collaboratorCount: 0,
          members: [],
        }}
      />,
    );

    expect(screen.getByText("collaboratorsNone")).toBeInTheDocument();

    rerender(
      <ProjectListItem
        item={{
          ...mockProjectItem,
          collaboratorCount: undefined,
          members: [{ name: "  ", roles: "" }],
        }}
      />,
    );

    expect(screen.getByText("collaboratorsNone")).toBeInTheDocument();
    expect(screen.queryByText("collaboratorsJustYou")).not.toBeInTheDocument();
    expect(screen.queryByText("collaboratorsYouAndOthers")).not.toBeInTheDocument();
    expect(screen.queryByText("collaboratorsNamed")).not.toBeInTheDocument();
  });

  it("renders a single funder name and a plain title when there is no project link", () => {
    render(
      <ProjectListItem
        item={{
          ...mockProjectItem,
          title: "Standalone project",
          link: undefined,
          funding: "National Science Foundation",
        }}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Standalone project" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Standalone project" })).not.toBeInTheDocument();
    expect(screen.getByText(/funding: National Science Foundation/)).toBeInTheDocument();
    expect(screen.queryByText(/funderSummary/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /openProject/i })).not.toBeInTheDocument();
  });

  it("handles sparse plan rows and an overridden create-plan link", () => {
    render(
      <ProjectListItem
        item={{
          ...mockProjectItem,
          id: undefined,
          createPlanLink: "/custom/create-plan",
          defaultExpanded: true,
          modified: undefined,
          relatedWorksCount: 0,
          plans: [
            {
              name: "Untitled draft",
              status: null,
              role: null,
              modified: null,
            },
            {
              name: "Legacy plan",
              status: "UNKNOWN_STATUS",
              role: "Viewer",
              modified: "1 Jan",
              link: "/projects/legacy/plans/9",
            },
            {
              name: "Archived plan",
              status: "ARCHIVED",
              role: "Owner",
              modified: "3 Mar",
              link: "/projects/legacy/plans/10",
            },
          ],
        }}
      />,
    );

    expect(screen.queryByText("lastUpdatedOn")).not.toBeInTheDocument();
    expect(screen.getByText("relatedWorksFound")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "createNewDmpInProject" })).toHaveAttribute(
      "href",
      "/custom/create-plan",
    );

    expect(screen.getByText("Untitled draft")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Untitled draft" })).not.toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("UNKNOWN_STATUS")).toBeInTheDocument();
    expect(screen.getByText("planStatus.ARCHIVED")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /openPlan Legacy plan/ })).toBeInTheDocument();
  });

  it("hides the create-plan link when no project id or createPlanLink is available", () => {
    render(
      <ProjectListItem
        item={{
          ...mockProjectItem,
          id: undefined,
          createPlanLink: undefined,
          defaultExpanded: true,
        }}
      />,
    );

    expect(screen.queryByRole("link", { name: "createNewDmpInProject" })).not.toBeInTheDocument();
  });

  it("should pass axe accessibility test when collapsed and expanded", async () => {
    const { container } = render(
      <div role="list">
        <ProjectListItem item={mockProjectItem} />
        <ProjectListItem
          item={{ ...mockProjectItem, id: 43, title: "Second project", defaultExpanded: true }}
        />
      </div>,
    );

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
