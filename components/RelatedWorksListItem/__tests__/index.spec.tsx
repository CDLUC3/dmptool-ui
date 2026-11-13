import React from "react";
import {act, render, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RelatedWorksListItem from "../index";
import "@testing-library/jest-dom";
import {axe, toHaveNoViolations} from "jest-axe";
import {NextIntlClientProvider} from "next-intl";
import {
  RelatedWorkConfidence,
  RelatedWorkSearchResult,
  RelatedWorksIdentifierType,
  RelatedWorkSourceType,
  RelatedWorkStatus,
  WorkType
} from "@/generated/graphql";

expect.extend(toHaveNoViolations);

const RELATED_WORK: RelatedWorkSearchResult = {
  id: 4,
  planId: 1,
  planTitle: "My Plan",
  workVersion: {
    id: 3,
    work: {
      id: 2,
      doi: "10.1126/fake.2025.084512",
      created: "",
      modified: "",
    },
    hash: "",
    workType: WorkType.Article,
    publicationDate: "2020-05-15",
    title: "Title",
    authors: [
      {
        firstInitial: "G",
        givenName: "Given",
        middleInitials: "M",
        middleNames: "Middle",
        surname: "Last",
        full: null,
        orcid: "0000-0003-1234-5678",
      },
    ],
    institutions: [{ ror: "08t3yqz51", name: "Institution Name" }],
    funders: [{ ror: "098k2sk96", name: "Funder Name" }],
    awards: [{ awardId: "123456789" }],
    publicationVenue: "Journal Name",
    sourceName: "OpenAlex",
    sourceUrl: "https://openalex.org/works/w2060245136",
    created: "",
    modified: "",
  },
  sourceType: RelatedWorkSourceType.SystemMatched,
  score: 1.0,
  scoreMax: 1.0,
  scoreNorm: 1.0,
  status: RelatedWorkStatus.Pending,
  confidence: RelatedWorkConfidence.High,
  doiMatch: {
    found: true,
    score: 15,
    sources: [],
  },
  contentMatch: {
    score: 18.0,
    titleHighlight: "<mark>Title</mark>",
    abstractHighlights: ["a <mark>fragment</mark> of an abstract...", "a second <mark>fragment</mark> of an abstract"],
  },
  authorMatches: [{ index: 0, score: 2.0 }],
  institutionMatches: [{ index: 0, score: 2.0 }],
  funderMatches: [{ index: 0, score: 2.0 }],
  awardMatches: [{ index: 0, score: 2.0 }],
  created: "2025-08-21",
  modified: "2025-09-02",
};

interface HarnessProps {
  onAction?: jest.Mock;
  relatedWork?: Partial<RelatedWorkSearchResult>;
  identifierType?: RelatedWorksIdentifierType;
  highlightMatches?: boolean;
  isPlanPublished?: boolean;
}

function RelatedWorksListItemHarness({
  onAction = jest.fn().mockResolvedValue(undefined),
  relatedWork = {},
  identifierType = RelatedWorksIdentifierType.PlanId,
  highlightMatches = false,
  isPlanPublished = true,
}: HarnessProps) {
  return (
    <NextIntlClientProvider
      locale={"en"}
      timeZone={"UTC"}
      messages={{}}
    >
      <div role="list">
        <RelatedWorksListItem
          identifierType={identifierType}
          relatedWork={{ ...RELATED_WORK, ...relatedWork }}
          highlightMatches={highlightMatches}
          isPlanPublished={isPlanPublished}
          onAction={onAction}
        />
      </div>
    </NextIntlClientProvider>
  );
}

const getStatusBarText = () => screen.getByRole("group", { name: "summaryLabel" }).textContent;

describe("RelatedWorksListItem", () => {
  it("should render the title link, subtitle and pending status bar", () => {
    render(<RelatedWorksListItemHarness />);

    const heading = screen.getByRole("heading", { level: 3 });
    const link = within(heading).getByRole("link");
    expect(link).toHaveAttribute("href", "https://doi.org/10.1126/fake.2025.084512");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveTextContent("Title (opensInNewTab)");

    expect(screen.getByText("Journal Name")).toBeInTheDocument();
    expect(screen.getByText("2020")).toBeInTheDocument();

    const statusBar = getStatusBarText();
    expect(statusBar).toContain("fieldNames.dateFound: Aug 21, 2025");
    expect(statusBar).toContain("fieldNames.type: workType.ARTICLE");
    expect(statusBar).toContain("fieldNames.source:");
    expect(statusBar).toContain("OpenAlex");
    expect(statusBar).toContain("fieldNames.likelihood: confidence.HIGH");
    // Plan title only shows on the project level page
    expect(statusBar).not.toContain("fieldNames.planTitle");
    expect(screen.queryByTestId("sourceBadge")).not.toBeInTheDocument();
  });

  it("should open and close details", async () => {
    render(<RelatedWorksListItemHarness />);

    const toggle = screen.getByRole("button", { name: "messaging.detailsToggleAria" });
    const region = screen.getByRole("region", { hidden: true });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", region.id);
    expect(region).toHaveAttribute("aria-hidden", "true");
    expect(region).toHaveAttribute("inert");

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(region).toHaveAttribute("aria-hidden", "false");
    expect(region).not.toHaveAttribute("inert");
    expect(within(region).getByText("instructions.review")).toBeVisible();
    expect(within(region).getAllByRole("heading", { level: 4 }).map((h) => h.textContent)).toEqual([
      "fieldNames.doi",
      "fieldNames.title",
      "fieldNames.abstract",
      "fieldNames.authors",
      "fieldNames.institutions",
      "fieldNames.awardIds",
      "fieldNames.funders",
    ]);

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(region).toHaveAttribute("aria-hidden", "true");
  });

  it("should show the external link icon and new tab text on every new tab link", async () => {
    render(<RelatedWorksListItemHarness />);
    await userEvent.click(screen.getByRole("button", { name: "messaging.detailsToggleAria" }));

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "https://doi.org/10.1126/fake.2025.084512",
      "https://doi.org/10.1126/fake.2025.084512",
      "https://orcid.org/0000-0003-1234-5678",
      "https://ror.org/08t3yqz51",
      "https://ror.org/098k2sk96",
      "https://openalex.org/works/w2060245136",
    ]);
    links.forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAccessibleName(expect.stringMatching(/\(opensInNewTab\)$/));
      const icon = within(link).getByTestId("dmpIconSvg");
      expect(icon).toHaveClass("icon-external_link");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("should toggle details with the keyboard", async () => {
    render(<RelatedWorksListItemHarness />);

    const toggle = screen.getByRole("button", { name: "messaging.detailsToggleAria" });
    act(() => toggle.focus());
    await userEvent.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("should confirm a pending match", async () => {
    const onAction = jest.fn().mockResolvedValue(undefined);
    render(<RelatedWorksListItemHarness onAction={onAction} />);

    const confirm = screen.getByRole("button", { name: "actionsAria.confirm" });
    expect(confirm).toHaveTextContent("buttons.confirm");
    await userEvent.click(confirm);

    await waitFor(() => {
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onAction).toHaveBeenCalledWith(RELATED_WORK.id, "confirm");
    });
  });

  it("should dismiss a pending match", async () => {
    const onAction = jest.fn().mockResolvedValue(undefined);
    render(<RelatedWorksListItemHarness onAction={onAction} />);

    await userEvent.click(screen.getByRole("button", { name: "actionsAria.dismiss" }));

    await waitFor(() => {
      expect(onAction).toHaveBeenCalledWith(RELATED_WORK.id, "dismiss");
    });
  });

  it("should disable the actions while an action is in progress", async () => {
    let resolveAction: () => void = () => {};
    const onAction = jest.fn(() => new Promise<void>((resolve) => (resolveAction = resolve)));
    render(<RelatedWorksListItemHarness onAction={onAction} />);

    await userEvent.click(screen.getByRole("button", { name: "actionsAria.confirm" }));
    const confirm = screen.getByRole("button", { name: "actionsAria.confirm" });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveTextContent("buttons.loading.confirm");
    expect(screen.getByRole("button", { name: "actionsAria.dismiss" })).toBeDisabled();

    await act(async () => resolveAction());
    expect(confirm).toBeEnabled();
    expect(confirm).toHaveTextContent("buttons.confirm");
  });

  it("should show restore and confirm for a dismissed match", async () => {
    const onAction = jest.fn().mockResolvedValue(undefined);
    render(
      <RelatedWorksListItemHarness
        onAction={onAction}
        relatedWork={{ status: RelatedWorkStatus.Rejected }}
      />,
    );

    expect(screen.getByRole("button", { name: "actionsAria.confirm" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "actionsAria.dismiss" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "actionsAria.restore" }));
    await waitFor(() => expect(onAction).toHaveBeenCalledWith(RELATED_WORK.id, "restore"));

    const statusBar = getStatusBarText();
    expect(statusBar).toContain("fieldNames.dateDismissed: Sep 2, 2025");
    expect(statusBar).toContain("fieldNames.dateFound: Aug 21, 2025");
    expect(screen.queryByText("instructions.review", { exact: false })).not.toBeInTheDocument();
  });

  it("should show unmatch and the confirmed badge for a confirmed match", async () => {
    const onAction = jest.fn().mockResolvedValue(undefined);
    render(
      <RelatedWorksListItemHarness
        onAction={onAction}
        relatedWork={{ status: RelatedWorkStatus.Accepted }}
      />,
    );

    expect(screen.getByTestId("sourceBadge")).toHaveTextContent("badges.confirmedMatch");
    expect(getStatusBarText()).toContain("fieldNames.dateConfirmed: Sep 2, 2025");
    expect(screen.queryByRole("button", { name: "actionsAria.confirm" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "actionsAria.unmatch" }));
    await waitFor(() => expect(onAction).toHaveBeenCalledWith(RELATED_WORK.id, "unmatch"));
  });

  it("should show unmatch and the added manually badge for a user added output", async () => {
    const onAction = jest.fn().mockResolvedValue(undefined);
    render(
      <RelatedWorksListItemHarness
        onAction={onAction}
        relatedWork={{ status: RelatedWorkStatus.Accepted, sourceType: RelatedWorkSourceType.UserAdded }}
      />,
    );

    expect(screen.getByTestId("sourceBadge")).toHaveTextContent("badges.addedManually");
    expect(getStatusBarText()).toContain("fieldNames.dateAdded: Aug 21, 2025");

    await userEvent.click(screen.getByRole("button", { name: "actionsAria.unmatch" }));
    await waitFor(() => expect(onAction).toHaveBeenCalledWith(RELATED_WORK.id, "unmatch"));
  });

  it("should show the plan title and unpublished tag on the project page", () => {
    render(
      <RelatedWorksListItemHarness
        identifierType={RelatedWorksIdentifierType.ProjectId}
        isPlanPublished={false}
      />,
    );

    const statusBar = getStatusBarText();
    expect(statusBar).toContain("fieldNames.planTitle: My Plan");
    expect(statusBar).toContain("badges.unpublished");
  });

  it("should accept epoch timestamps for dates", () => {
    render(<RelatedWorksListItemHarness relatedWork={{ created: String(Date.UTC(2024, 0, 5)) }} />);

    expect(getStatusBarText()).toContain("fieldNames.dateFound: Jan 5, 2024");
  });

  it("should keep the full text of a long title for screen readers and in the details", async () => {
    const longTitle = "A very long research output title ".repeat(8).trim();
    render(
      <RelatedWorksListItemHarness
        relatedWork={{
          workVersion: { ...RELATED_WORK.workVersion, title: longTitle },
          contentMatch: { score: 0, titleHighlight: null, abstractHighlights: [] },
        }}
      />,
    );

    const link = within(screen.getByRole("heading", { level: 3 })).getByRole("link");
    expect(link).toHaveAccessibleName(`${longTitle} (opensInNewTab)`);
    expect(link.querySelector(".titleText")).toHaveTextContent(longTitle);

    await userEvent.click(screen.getByRole("button", { name: /messaging.detailsToggleAria/ }));
    expect(screen.getByRole("region")).toHaveTextContent(longTitle);
  });

  it("should handle a missing title, authors, venue, dates, source link and likelihood", () => {
    render(
      <RelatedWorksListItemHarness
        relatedWork={{
          created: "not a date",
          confidence: null,
          workVersion: {
            ...RELATED_WORK.workVersion,
            title: null,
            authors: [],
            publicationVenue: null,
            publicationDate: null,
            sourceUrl: null,
          },
        }}
      />,
    );

    // The DOI stands in for a missing title
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveTextContent(RELATED_WORK.workVersion.work.doi);
    expect(screen.queryByText("Journal Name")).not.toBeInTheDocument();
    expect(screen.queryByText("2020")).not.toBeInTheDocument();

    const statusBar = getStatusBarText();
    expect(statusBar).toContain("fieldNames.dateFound: ");
    expect(statusBar).not.toContain("Invalid Date");
    expect(statusBar).toContain("fieldNames.source:");
    expect(statusBar).toContain("OpenAlex");
    expect(statusBar).not.toContain("fieldNames.likelihood");
    // Without a source URL the source name is plain text
    expect(screen.queryByRole("link", { name: /OpenAlex/ })).not.toBeInTheDocument();
  });

  it("should show the publication year of a Jan 1 date in time zones behind UTC", () => {
    // Setting process.env.TZ inside a test has no effect on Date in Jest
    const getFullYear = jest.spyOn(Date.prototype, "getFullYear").mockImplementation(function (this: Date) {
      return new Date(this.getTime() - 8 * 60 * 60 * 1000).getUTCFullYear();
    });
    try {
      render(
        <RelatedWorksListItemHarness
          relatedWork={{
            workVersion: { ...RELATED_WORK.workVersion, publicationDate: "2023-01-01" },
          }}
        />,
      );

      expect(screen.getByText("2023")).toBeInTheDocument();
      expect(screen.queryByText("2022")).not.toBeInTheDocument();
    } finally {
      getFullYear.mockRestore();
    }
  });

  it("should only highlight matches when enabled", async () => {
    const { unmount } = render(<RelatedWorksListItemHarness />);
    const region = screen.getByRole("region", { hidden: true });
    expect(region.querySelectorAll(".match").length).toBe(0);
    expect(region.querySelectorAll(".hideContentHighlights").length).toBe(1);
    unmount();

    render(<RelatedWorksListItemHarness highlightMatches={true} />);
    const highlighted = screen.getByRole("region", { hidden: true });
    expect(highlighted.querySelectorAll(".match").length).toBeGreaterThan(0);
    expect(highlighted.querySelectorAll(".showContentHighlights").length).toBe(1);
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(<RelatedWorksListItemHarness />);

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  it("should pass axe accessibility test when expanded", async () => {
    const { container } = render(
      <RelatedWorksListItemHarness
        identifierType={RelatedWorksIdentifierType.ProjectId}
        relatedWork={{ status: RelatedWorkStatus.Accepted }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "messaging.detailsToggleAria" }));

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
