import React from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { axe, toHaveNoViolations } from "jest-axe";
import { RouterProvider } from "react-aria-components";

import { mockScrollTo } from "@/__mocks__/common";
import messages from "@/messages/en-US/global.json";
import { PaginationType } from "@/generated/graphql";
import {
  FunderTemplate,
  FunderTemplatesQueryData,
  FunderTemplatesQueryOptions,
  useFunderTemplates,
} from "@/app/hooks/useFunderTemplates";
import { handleApolloError } from "@/utils/index";
import FunderRequirementsPage from "../page";

expect.extend(toHaveNoViolations);

jest.mock("next-intl", () => jest.requireActual("next-intl"));

jest.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => "/funder-requirements"),
}));

// The API searches, sorts and pages the templates (and is tested there), so these tests only check that the page
// asks for the right page of results and shows what comes back
jest.mock("@/app/hooks/useFunderTemplates", () => {
  const actual = jest.requireActual("@/app/hooks/useFunderTemplates");
  return { ...actual, useFunderTemplates: jest.fn() };
});

jest.mock("@/utils/index", () => ({
  ...jest.requireActual("@/utils/index"),
  handleApolloError: jest.fn(() => ({ wasRealError: true, message: "Network error" })),
}));

const mockUseFunderTemplates = useFunderTemplates as jest.Mock;

const NIH_SAMPLE_URL = "https://sharing.nih.gov/data-management-and-sharing-policy/planning-and-budgeting-for-data-management-and-sharing/writing-a-data-management-and-sharing-plan";

const template = (id: number, overrides: Partial<FunderTemplate> = {}): FunderTemplate => ({
  id,
  templateId: id,
  name: `Funder Template ${id}`,
  ownerURI: `https://ror.org/${id}`,
  ownerDisplayName: `Funder ${id} (funder${id}.org)`,
  modified: "2024-06-27T00:00:00Z",
  funderLinks: [{ id: id * 100, text: `Funder ${id} policy`, url: `https://funder${id}.org/policy` }],
  samplePlanLinks: [],
  ...overrides,
});

// The first page of 12 templates, in the order the API returned them
const firstPage: FunderTemplate[] = [
  template(2, {
    name: "Alfred P. Sloan Foundation",
    ownerDisplayName: "Alfred P. Sloan Foundation (sloan.org)",
    funderLinks: [{ id: 2, text: "Sloan Grant Proposal Guidelines", url: "https://sloan.org/grants/apply" }],
  }),
  template(3, {
    name: "Gordon and Betty Moore Foundation",
    ownerDisplayName: "Gordon and Betty Moore Foundation (moore.org)",
    samplePlanLinks: [
      { id: 31, text: "Moore Sample Plan 1", url: "https://www.moore.org/sample-1.pdf" },
      { id: 32, text: "Moore Sample Plan 2", url: "https://www.moore.org/sample-2.pdf" },
    ],
  }),
  template(4, {
    name: "National Institutes of Health (NIH): Default DMSP",
    ownerDisplayName: "National Institutes of Health (nih.gov)",
    funderLinks: [
      { id: 41, text: "Final NIH Policy for Data Management and Sharing", url: "https://grants.nih.gov/not-od-21-013" },
      { id: 42, text: "Elements of an NIH Data Management and Sharing Plan", url: "https://grants.nih.gov/not-od-21-014" },
      { id: 43, text: "Allowable Costs for Data Management and Sharing", url: "https://grants.nih.gov/not-od-21-015" },
    ],
    samplePlanLinks: [{ id: 44, text: null, url: NIH_SAMPLE_URL }],
  }),
  template(5, {
    name: "Broken Link Template",
    funderLinks: [{ id: 5, text: null, url: "not a url" }],
  }),
  ...[6, 7, 8, 9, 10, 11].map((id) => template(id)),
];
const secondPage: FunderTemplate[] = [template(12), template(13)];
const TOTAL = firstPage.length + secondPage.length;

const results = (items: FunderTemplate[], overrides = {}): FunderTemplatesQueryData => ({
  publishedFunderTemplates: {
    __typename: "FunderTemplateSearchResults",
    items,
    totalCount: TOTAL,
    limit: 10,
    currentOffset: 0,
    hasNextPage: true,
    hasPreviousPage: false,
    availableSortFields: ["vt.name", "a.displayName", "vt.modified"],
    ...overrides,
  },
});

const noResults = results([], { totalCount: 0, hasNextPage: false });

// Stands in for the API: return the second page when it's asked for, and nothing for a search with no matches
const apiResponse = ({ variables }: FunderTemplatesQueryOptions) => {
  let data = results(firstPage);
  if (variables.term === "no such funder") {
    data = noResults;
  } else if (variables.paginationOptions?.offset === 10) {
    data = results(secondPage, { currentOffset: 10, hasNextPage: false, hasPreviousPage: true });
  }
  return { data, previousData: undefined, loading: false, error: undefined };
};

// The variables from the most recent request for templates
const lastRequest = () => mockUseFunderTemplates.mock.calls.at(-1)[0].variables;
const request = (overrides: { term?: string; offset?: number; sortField?: string; sortDir?: string } = {}) => ({
  term: overrides.term ?? "",
  paginationOptions: {
    type: PaginationType.Offset,
    offset: overrides.offset ?? 0,
    limit: 10,
    sortField: overrides.sortField ?? "vt.name",
    sortDir: overrides.sortDir ?? "ASC",
  },
});

const renderPage = () => render(
  <NextIntlClientProvider locale="en-US" messages={messages} timeZone="UTC">
    <FunderRequirementsPage />
  </NextIntlClientProvider>
);

const getTable = () => screen.getByRole("grid", { name: "Funder templates" });
const getRowHeaders = () => within(getTable()).getAllByRole("rowheader").map((cell) => cell.textContent);
const getColumnHeader = (name: RegExp) => within(getTable()).getByRole("columnheader", { name });
const getRowFor = (templateName: string) =>
  within(getTable()).getByRole("rowheader", { name: templateName }).closest("[role='row']") as HTMLElement;

describe("FunderRequirementsPage", () => {
  beforeEach(() => {
    mockScrollTo();
    mockUseFunderTemplates.mockImplementation(apiResponse);
  });

  it("should render the title, description and breadcrumbs", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Funder Requirements" })).toBeInTheDocument();
    expect(screen.getByText(/Templates for data management plans are based on/)).toBeInTheDocument();
    const breadcrumbs = screen.getByRole("list", { name: "Breadcrumbs" });
    expect(within(breadcrumbs).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("should not offer a way to create a plan", () => {
    renderPage();

    expect(screen.queryByText(/create (a new )?plan/i)).not.toBeInTheDocument();
  });

  it("should ask for the first page of templates sorted by template name, and list them in the order returned", () => {
    renderPage();

    expect(lastRequest()).toEqual(request());
    expect(screen.getByText("Showing 1–10 of 12 templates")).toBeInTheDocument();
    expect(getRowHeaders()).toEqual(firstPage.map((item) => item.name));
  });

  it("should announce which columns are sortable and the current sort direction", () => {
    renderPage();

    expect(getColumnHeader(/Template name/)).toHaveAttribute("aria-sort", "ascending");
    expect(getColumnHeader(/Organization name/)).toHaveAttribute("aria-sort", "none");
    expect(getColumnHeader(/Last updated/)).toHaveAttribute("aria-sort", "none");
    expect(getColumnHeader(/Funder links/)).not.toHaveAttribute("aria-sort");
    expect(getColumnHeader(/^Download$/)).not.toHaveAttribute("aria-sort");
  });

  it("should show the organization name with its domain and the last updated date", () => {
    renderPage();

    const row = getRowFor("Alfred P. Sloan Foundation");
    expect(within(row).getByText("Alfred P. Sloan Foundation (sloan.org)")).toBeInTheDocument();
    expect(within(row).getByText("06-27-2024")).toBeInTheDocument();
  });

  it("should give the Word and PDF downloads labels that include the file type and template name", () => {
    renderPage();

    const row = getRowFor("Alfred P. Sloan Foundation");
    expect(within(row).getByRole("link", { name: "Download Alfred P. Sloan Foundation as Word" }))
      .toHaveAttribute("href", "/api/download-template?versionedTemplateId=2&format=docx");
    expect(within(row).getByRole("link", { name: "Download Alfred P. Sloan Foundation as PDF" }))
      .toHaveAttribute("href", "/api/download-template?versionedTemplateId=2&format=pdf");
  });

  it("should keep the locale out of the download links when the app's router adds it to other links", () => {
    render(
      <NextIntlClientProvider locale="en-US" messages={messages} timeZone="UTC">
        <RouterProvider navigate={jest.fn()} useHref={(href) => `/en-US${href}`}>
          <FunderRequirementsPage />
        </RouterProvider>
      </NextIntlClientProvider>
    );

    const breadcrumbs = screen.getByRole("list", { name: "Breadcrumbs" });
    expect(within(breadcrumbs).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/en-US/");
    const download = within(getRowFor("Alfred P. Sloan Foundation"))
      .getByRole("link", { name: "Download Alfred P. Sloan Foundation as Word" });
    expect(download).toHaveAttribute("href", "/api/download-template?versionedTemplateId=2&format=docx");
    expect(download).toHaveAttribute("download");
  });

  it("should list every funder link, each opening in a new tab", () => {
    renderPage();

    const row = getRowFor("National Institutes of Health (NIH): Default DMSP");
    const funderLinks = [
      "Final NIH Policy for Data Management and Sharing",
      "Elements of an NIH Data Management and Sharing Plan",
      "Allowable Costs for Data Management and Sharing",
    ];
    funderLinks.forEach((text) => {
      const link = within(row).getByRole("link", { name: new RegExp(text) });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("should show sample plan links when there are any, using the hostname when a link has no text", () => {
    renderPage();

    const nihRow = getRowFor("National Institutes of Health (NIH): Default DMSP");
    const nihLink = within(nihRow).getByRole("link", { name: "sharing.nih.gov (Opens in a new tab)" });
    expect(nihLink).toHaveAttribute("href", NIH_SAMPLE_URL);
    expect(nihLink).toHaveAttribute("title", NIH_SAMPLE_URL);

    const mooreRow = getRowFor("Gordon and Betty Moore Foundation");
    expect(within(mooreRow).getByRole("link", { name: /Moore Sample Plan 1/ })).toBeInTheDocument();
    expect(within(mooreRow).getByRole("link", { name: /Moore Sample Plan 2/ })).toBeInTheDocument();
  });

  it("should fall back to the full URL when a link has no text and its URL can't be parsed", () => {
    renderPage();

    const row = getRowFor("Broken Link Template");
    expect(within(row).getByRole("link", { name: "not a url (Opens in a new tab)" })).toHaveAttribute("title", "not a url");
  });

  it("should leave the sample plans cell empty, apart from screen reader text, when there are none", () => {
    renderPage();

    const row = getRowFor("Alfred P. Sloan Foundation");
    const cells = within(row).getAllByRole("gridcell");
    const samplePlansCell = cells[cells.length - 1];
    expect(within(samplePlansCell).queryByRole("link")).not.toBeInTheDocument();
    expect(within(samplePlansCell).getByText("None")).toHaveClass("hidden-accessibly");
  });

  it("should ask for templates sorted by last updated, oldest first and then newest first", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(getColumnHeader(/Last updated/));
    expect(lastRequest()).toEqual(request({ sortField: "vt.modified", sortDir: "ASC" }));
    expect(getColumnHeader(/Last updated/)).toHaveAttribute("aria-sort", "ascending");
    expect(getColumnHeader(/Template name/)).toHaveAttribute("aria-sort", "none");

    await user.click(getColumnHeader(/Last updated/));
    expect(lastRequest()).toEqual(request({ sortField: "vt.modified", sortDir: "DESC" }));
    expect(getColumnHeader(/Last updated/)).toHaveAttribute("aria-sort", "descending");
  });

  it("should ask for templates sorted by organization name using only the keyboard", async () => {
    const user = userEvent.setup();
    renderPage();

    act(() => getColumnHeader(/Organization name/).focus());
    await user.keyboard("{Enter}");
    expect(lastRequest()).toEqual(request({ sortField: "a.displayName", sortDir: "ASC" }));
    expect(getColumnHeader(/Organization name/)).toHaveAttribute("aria-sort", "ascending");

    await user.keyboard("{Enter}");
    expect(lastRequest()).toEqual(request({ sortField: "a.displayName", sortDir: "DESC" }));
    expect(getColumnHeader(/Organization name/)).toHaveAttribute("aria-sort", "descending");
  });

  it("should sort from the sort select and keep the table headers in step", async () => {
    const user = userEvent.setup();
    renderPage();

    const sortSelect = screen.getByRole("button", { name: /Sort by/ });
    expect(sortSelect).toHaveTextContent("Template name (A–Z)");

    await user.click(sortSelect);
    await user.click(screen.getByRole("option", { name: "Last updated (newest first)" }));

    expect(lastRequest()).toEqual(request({ sortField: "vt.modified", sortDir: "DESC" }));
    expect(screen.getByRole("button", { name: /Sort by/ })).toHaveTextContent("Last updated (newest first)");
    expect(getColumnHeader(/Last updated/)).toHaveAttribute("aria-sort", "descending");
    expect(getColumnHeader(/Template name/)).toHaveAttribute("aria-sort", "none");
  });

  it("should show the table header sort in the sort select", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(getColumnHeader(/Organization name/));

    expect(screen.getByRole("button", { name: /Sort by/ })).toHaveTextContent("Organization name (A–Z)");
  });

  it("should go back to the first page when the sort changes", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(lastRequest().paginationOptions.offset).toBe(10);

    await user.click(getColumnHeader(/Organization name/));
    expect(lastRequest()).toEqual(request({ sortField: "a.displayName", sortDir: "ASC" }));
  });

  it("should search when the search is submitted with the keyboard or the Search button", async () => {
    const user = userEvent.setup();
    renderPage();

    const search = screen.getByRole("searchbox", { name: "Search" });
    await user.click(search);
    await user.keyboard("  energy.gov {Enter}");
    expect(lastRequest()).toEqual(request({ term: "energy.gov" }));

    // Emptying the box shows all templates again (see below), but typing alone does not search
    await user.clear(search);
    await user.type(search, "sloan");
    expect(lastRequest()).toEqual(request());
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(lastRequest()).toEqual(request({ term: "sloan" }));
  });

  it("should go back to the first page when searching", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "nih{Enter}");

    expect(lastRequest()).toEqual(request({ term: "nih" }));
  });

  it("should ask for all templates again when the search box is cleared", async () => {
    const user = userEvent.setup();
    renderPage();

    const search = screen.getByRole("searchbox", { name: "Search" });
    await user.type(search, "sloan{Enter}");
    expect(lastRequest().term).toBe("sloan");

    await user.clear(search);
    expect(lastRequest()).toEqual(request());
  });

  it("should show a no matches state, and no table, when the search has no results", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole("searchbox", { name: "Search" }), "no such funder{Enter}");

    expect(screen.getByText("No templates match your search.")).toBeInTheDocument();
    expect(screen.getByText(/Check the spelling/)).toBeInTheDocument();
    expect(screen.getByText("Showing 0 templates")).toBeInTheDocument();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("should clear the search and move focus back to the search box from the no matches state", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole("searchbox", { name: "Search" }), "no such funder{Enter}");
    await user.click(screen.getByRole("button", { name: "Clear search" }));

    const search = screen.getByRole("searchbox", { name: "Search" });
    expect(search).toHaveValue("");
    expect(search).toHaveFocus();
    expect(lastRequest()).toEqual(request());
    expect(screen.getByText("Showing 1–10 of 12 templates")).toBeInTheDocument();
  });

  it("should show an empty state, without search, when there are no funder templates at all", () => {
    mockUseFunderTemplates.mockReturnValue({ data: noResults, loading: false, error: undefined });
    renderPage();

    expect(screen.getByText("There are no funder templates available yet.")).toBeInTheDocument();
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Showing/)).not.toBeInTheDocument();
    expect(screen.queryByText("No templates match your search.")).not.toBeInTheDocument();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("should ask for the next page of templates and show it", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /next/i }));

    expect(lastRequest()).toEqual(request({ offset: 10 }));
    expect(screen.getByText("Showing 11–12 of 12 templates")).toBeInTheDocument();
    expect(getRowHeaders()).toEqual(secondPage.map((item) => item.name));
  });

  it("should move focus to the results count after changing page", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("Showing 11–12 of 12 templates")).toHaveFocus();

    await user.click(screen.getByRole("link", { name: /page 1/i, current: false }));
    expect(lastRequest()).toEqual(request());
    expect(screen.getByText("Showing 1–10 of 12 templates")).toHaveFocus();
  });

  it("should keep focus in the search box after searching", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole("searchbox", { name: "Search" }), "sloan{Enter}");

    expect(screen.getByRole("searchbox", { name: "Search" })).toHaveFocus();
  });

  it("should render each template as a card for small screens", () => {
    renderPage();

    const cards = within(screen.getByRole("list", { name: "Funder templates" })).getAllByRole("heading", { level: 2 });
    expect(cards).toHaveLength(firstPage.length);
    expect(cards[0]).toHaveTextContent("Alfred P. Sloan Foundation");
  });

  it("should show a loading message while the templates load", () => {
    mockUseFunderTemplates.mockReturnValue({ data: undefined, loading: true, error: undefined });
    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Showing/)).not.toBeInTheDocument();
    expect(screen.queryByText("No templates match your search.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();
  });

  it("should keep the last results on screen, marked busy, while new results load", () => {
    mockUseFunderTemplates.mockReturnValue({
      data: undefined,
      previousData: results([firstPage[3]], { totalCount: 1, hasNextPage: false }),
      loading: true,
      error: undefined,
    });
    renderPage();

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(screen.queryByText(/^Showing/)).not.toBeInTheDocument();
    expect(getRowHeaders()).toEqual(["Broken Link Template"]);
    expect(getTable().closest("[aria-busy]")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Search" })).toBeEnabled();
  });

  it("should not mark the results busy once they have loaded", () => {
    renderPage();

    expect(getTable().closest("[aria-busy]")).toHaveAttribute("aria-busy", "false");
  });

  it("should show an error message when the templates fail to load", () => {
    const error = new Error("Network error");
    mockUseFunderTemplates.mockReturnValue({ data: undefined, loading: false, error });
    renderPage();

    expect(handleApolloError).toHaveBeenCalledWith(error, "FunderRequirementsPage.useFunderTemplates");
    expect(screen.getByText("Something went wrong loading the funder templates. Please try again later.")).toBeInTheDocument();
    expect(screen.queryByText(/^Showing/)).not.toBeInTheDocument();
    expect(screen.queryByText("No templates match your search.")).not.toBeInTheDocument();
    expect(screen.queryByText("There are no funder templates available yet.")).not.toBeInTheDocument();
  });

  it("should not show an error message when the request was aborted", () => {
    (handleApolloError as jest.Mock).mockReturnValueOnce({ wasRealError: false, message: "" });
    mockUseFunderTemplates.mockReturnValue({ data: undefined, loading: false, error: new Error("aborted") });
    renderPage();

    expect(screen.queryByText("Something went wrong loading the funder templates. Please try again later.")).not.toBeInTheDocument();
  });

  it("should pass axe accessibility test", async () => {
    const { container } = renderPage();

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it("should pass axe accessibility test in the no matches state", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "no such funder{Enter}");

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
