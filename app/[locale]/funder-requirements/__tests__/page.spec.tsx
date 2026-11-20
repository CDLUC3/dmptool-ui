import React from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { axe, toHaveNoViolations } from "jest-axe";
import { RouterProvider } from "react-aria-components";

import { mockScrollTo } from "@/__mocks__/common";
import messages from "@/messages/en-US/global.json";
import { useFunderTemplates } from "@/app/hooks/useFunderTemplates";
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

jest.mock("@/app/hooks/useFunderTemplates", () => {
  const actual = jest.requireActual("@/app/hooks/useFunderTemplates");
  return { ...actual, useFunderTemplates: jest.fn() };
});

jest.mock("@/utils/index", () => ({
  ...jest.requireActual("@/utils/index"),
  handleApolloError: jest.fn(() => ({ wasRealError: true, message: "Network error" })),
}));

const { useFunderTemplates: actualUseFunderTemplates } = jest.requireActual("@/app/hooks/useFunderTemplates");
const mockUseFunderTemplates = useFunderTemplates as jest.Mock;

const brokenLinkData = {
  publishedFunderTemplates: {
    items: [{
      id: 1,
      templateId: 1,
      name: "Broken Link Template",
      ownerDisplayName: "Broken Link Org",
      modified: "2024-06-27T00:00:00Z",
      funderLinks: [{ id: 1, text: null, url: "not a url" }],
      samplePlanLinks: [],
    }],
    totalCount: 1,
    limit: 10,
    currentOffset: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    availableSortFields: [],
  },
};

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
    mockUseFunderTemplates.mockImplementation(actualUseFunderTemplates);
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

  it("should list the first page of templates sorted by template name", () => {
    renderPage();

    expect(screen.getByText("Showing 1–10 of 12 templates")).toBeInTheDocument();
    const rowHeaders = getRowHeaders();
    expect(rowHeaders).toHaveLength(10);
    expect(rowHeaders[0]).toBe("Agency for Healthcare Research and Quality (AHRQ)");
    expect(rowHeaders[1]).toBe("Alfred P. Sloan Foundation");
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

    const nihUrl = "https://sharing.nih.gov/data-management-and-sharing-policy/planning-and-budgeting-for-data-management-and-sharing/writing-a-data-management-and-sharing-plan";
    const nihRow = getRowFor("National Institutes of Health (NIH): Default DMSP");
    const nihLink = within(nihRow).getByRole("link", { name: "sharing.nih.gov (Opens in a new tab)" });
    expect(nihLink).toHaveAttribute("href", nihUrl);
    expect(nihLink).toHaveAttribute("title", nihUrl);

    const mooreRow = getRowFor("Gordon and Betty Moore Foundation");
    expect(within(mooreRow).getByRole("link", { name: /Moore Sample Plan 1/ })).toBeInTheDocument();
    expect(within(mooreRow).getByRole("link", { name: /Moore Sample Plan 2/ })).toBeInTheDocument();
  });

  it("should fall back to the full URL when a link has no text and its URL can't be parsed", () => {
    mockUseFunderTemplates.mockReturnValue({ data: brokenLinkData, loading: false, error: undefined });
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

  it("should sort by last updated, oldest first and then newest first", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(getColumnHeader(/Last updated/));
    expect(getColumnHeader(/Last updated/)).toHaveAttribute("aria-sort", "ascending");
    expect(getColumnHeader(/Template name/)).toHaveAttribute("aria-sort", "none");
    expect(getRowHeaders()[0]).toBe("U.S. Geological Survey (USGS)");

    await user.click(getColumnHeader(/Last updated/));
    expect(getColumnHeader(/Last updated/)).toHaveAttribute("aria-sort", "descending");
    expect(getRowHeaders()[0]).toBe("Atlantic Offshore Research (RWSC & ROSA)");
  });

  it("should sort by organization name using only the keyboard", async () => {
    const user = userEvent.setup();
    renderPage();

    act(() => getColumnHeader(/Organization name/).focus());
    await user.keyboard("{Enter}");

    expect(getColumnHeader(/Organization name/)).toHaveAttribute("aria-sort", "ascending");
    expect(within(getTable()).getAllByRole("row")[1]).toHaveTextContent("Agency for Healthcare Research and Quality (ahrq.gov)");

    await user.keyboard("{Enter}");
    expect(getColumnHeader(/Organization name/)).toHaveAttribute("aria-sort", "descending");
    expect(within(getTable()).getAllByRole("row")[1]).toHaveTextContent("United States Department of Energy (DOE) (energy.gov)");
  });

  it("should sort the cards from the sort select and keep the table headers in step", async () => {
    const user = userEvent.setup();
    renderPage();

    const sortSelect = screen.getByRole("button", { name: /Sort by/ });
    expect(sortSelect).toHaveTextContent("Template name (A–Z)");

    await user.click(sortSelect);
    await user.click(screen.getByRole("option", { name: "Last updated (newest first)" }));

    expect(screen.getByRole("button", { name: /Sort by/ })).toHaveTextContent("Last updated (newest first)");
    const cards = within(screen.getByRole("list", { name: "Funder templates" })).getAllByRole("heading", { level: 2 });
    expect(cards[0]).toHaveTextContent("Atlantic Offshore Research (RWSC & ROSA)");
    expect(getColumnHeader(/Last updated/)).toHaveAttribute("aria-sort", "descending");
    expect(getColumnHeader(/Template name/)).toHaveAttribute("aria-sort", "none");
  });

  it("should show the table header sort in the sort select", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(getColumnHeader(/Organization name/));

    expect(screen.getByRole("button", { name: /Sort by/ })).toHaveTextContent("Organization name (A–Z)");
  });

  it("should filter by template name or organization name when the search is submitted with the keyboard", async () => {
    const user = userEvent.setup();
    renderPage();

    const search = screen.getByRole("searchbox", { name: "Search" });
    await user.click(search);
    await user.keyboard("energy.gov{Enter}");

    expect(screen.getByText("Showing 1–2 of 2 templates")).toBeInTheDocument();
    expect(getRowHeaders()).toEqual([
      "Department of Energy (DOE): Generic (2025 Update)",
      "Department of Energy (DOE): Office of Energy Efficiency and Renewable Energy (EERE)",
    ]);

    await user.clear(search);
    await user.type(search, "sloan");
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(getRowHeaders()).toEqual(["Alfred P. Sloan Foundation"]);
    expect(screen.getByText("Showing 1–1 of 1 template")).toBeInTheDocument();
  });

  it("should show all templates again when the search box is cleared", async () => {
    const user = userEvent.setup();
    renderPage();

    const search = screen.getByRole("searchbox", { name: "Search" });
    await user.type(search, "sloan{Enter}");
    expect(getRowHeaders()).toHaveLength(1);

    await user.clear(search);
    expect(getRowHeaders()).toHaveLength(10);
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
    expect(getRowHeaders()).toHaveLength(10);
    expect(screen.getByText("Showing 1–10 of 12 templates")).toBeInTheDocument();
  });

  it("should show an empty state, without search, when there are no funder templates at all", () => {
    mockUseFunderTemplates.mockReturnValue({
      data: {
        publishedFunderTemplates: {
          ...brokenLinkData.publishedFunderTemplates,
          items: [],
          totalCount: 0,
        },
      },
      loading: false,
      error: undefined,
    });
    renderPage();

    expect(screen.getByText("There are no funder templates available yet.")).toBeInTheDocument();
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Showing/)).not.toBeInTheDocument();
    expect(screen.queryByText("No templates match your search.")).not.toBeInTheDocument();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("should go to the next page of templates", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByText("Showing 11–12 of 12 templates")).toBeInTheDocument();
    expect(getRowHeaders()).toEqual([
      "National Science Foundation (NSF): Generic",
      "U.S. Geological Survey (USGS)",
    ]);
  });

  it("should move focus to the results count after changing page", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("Showing 11–12 of 12 templates")).toHaveFocus();

    await user.click(screen.getByRole("link", { name: /page 1/i, current: false }));
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
    expect(cards).toHaveLength(10);
    expect(cards[0]).toHaveTextContent("Agency for Healthcare Research and Quality (AHRQ)");
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
      previousData: brokenLinkData,
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
