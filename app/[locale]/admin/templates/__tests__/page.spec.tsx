import React from "react";
import { act, fireEvent, render, screen, within, waitFor } from "@/utils/test-utils";
import { MockedProvider } from "@apollo/client/testing/react";
import OrganizationTemplateListPage from "../page";
import { axe, toHaveNoViolations } from "jest-axe";
import { mockScrollIntoView } from "@/__mocks__/common";
import {
  mocks,
  multipleItemsMock,
  multipleItemsErrorMock,
  errorMock,
} from "../__mocks__/organizationTemplatesPage.mocks";

expect.extend(toHaveNoViolations);

// Mock useFormatter and useTranslations from next-intl
jest.mock("next-intl", () => ({
  useFormatter: jest.fn(() => ({
    dateTime: jest.fn(() => "01-01-2023"),
  })),
  useTranslations: jest.fn(() => jest.fn((key) => key)), // Mock `useTranslations`
}));

interface PageHeaderProps {
  title: string;
  description: string;
  actions: React.ReactNode;
  breadcrumbs: React.ReactNode;
}

jest.mock("@/components/PageHeader", () => {
  return {
    __esModule: true,
    default: ({ title, description, actions, breadcrumbs }: PageHeaderProps) => (
      <div data-testid="mock-page-header">
        <h1>{title}</h1>
        <p>{description}</p>
        <div data-testid="header-actions">{actions}</div>
        <div data-testid="breadcrumbs">{breadcrumbs}</div>
      </div>
    ),
  };
});

describe("OrganizationTemplateListPage", () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
  });

  it("should render the page header with correct title and description", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={mocks}>
          <OrganizationTemplateListPage />
        </MockedProvider>,
      );
    });

    // MockedProvider requires await for requests to resolve
    await waitFor(() => {
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("title");
    });

    expect(screen.getByText("description")).toBeInTheDocument();
  });

  it("should render the create template link in header actions", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={mocks}>
          <OrganizationTemplateListPage />
        </MockedProvider>,
      );
    });

    // MockedProvider requires await for requests to resolve
    await waitFor(() => {
      const createLink = screen.getByText("actionCreate");
      expect(createLink).toBeInTheDocument();
      expect(createLink).toHaveAttribute("href", "/en-US/template/create");
    });
  });

  it("should render the search field with correct label and help text", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={mocks}>
          <OrganizationTemplateListPage />
        </MockedProvider>,
      );
    });

    // MockedProvider requires await for requests to resolve
    await waitFor(() => {
      // Searching for translation keys since cannot run next-intl for unit tests
      expect(screen.getByLabelText("searchLabel")).toBeInTheDocument();
      expect(screen.getByText("searchHelpText")).toBeInTheDocument();
    });
  });

  it("should render the template list with correct number of items", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={mocks}>
          <OrganizationTemplateListPage />
        </MockedProvider>,
      );
    });

    // MockedProvider requires await for requests to resolve
    await waitFor(() => {
      const templateItems = screen.getAllByTestId("template-list-item");
      expect(templateItems).toHaveLength(2);
    });
  });

  it("should render template items with correct titles", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={mocks}>
          <OrganizationTemplateListPage />
        </MockedProvider>,
      );
    });

    // MockedProvider requires await for requests to resolve
    await waitFor(() => {
      expect(screen.getByText("UCOP")).toBeInTheDocument();
    });

    const templateData = screen.getAllByTestId("template-metadata");
    const lastRevisedBy = within(templateData[0]).getByText(/lastRevisedBy.*Test User/);
    const lastUpdated = within(templateData[0]).getByText(/lastUpdated.*01-01-2023/);
    const publishStatus = within(templateData[0]).getByText(/published/i);
    const visibility = within(templateData[0]).getByText(/visibility.*Organization/);
    expect(lastRevisedBy).toBeInTheDocument();
    expect(publishStatus).toBeInTheDocument();
    expect(lastUpdated).toBeInTheDocument();
    expect(visibility).toBeInTheDocument();
  });

  it("should render the template list with correct ARIA role", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={mocks}>
          <OrganizationTemplateListPage />
        </MockedProvider>,
      );
    });

    // MockedProvider requires await for requests to resolve
    await waitFor(() => {
      const list = screen.getByRole("list", { name: "templateList" });
      expect(list).toBeInTheDocument();
      const listItems = within(list).getAllByRole("listitem");
      expect(listItems).toHaveLength(2); // Expecting 2 items as per mock data
    });
  });

  it("should render breadcrumbs with correct links", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={mocks}>
          <OrganizationTemplateListPage />
        </MockedProvider>,
      );
    });

    // MockedProvider requires await for requests to resolve
    await waitFor(() => {
      // Searching for translation keys since cannot run next-intl for unit tests
      const homeLink = screen.getByRole("link", { name: "breadcrumbs.home" });
      const templatesLink = screen.getByRole("link", { name: "breadcrumbs.templates" });

      expect(homeLink).toHaveAttribute("href", "/en-US");
      expect(templatesLink).toHaveAttribute("href", "/en-US/template");
    });
  });

  it("should render error when graphql query returns as error", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={errorMock}>
          <OrganizationTemplateListPage />
        </MockedProvider>,
      );
    });

    // MockedProvider requires await for requests to resolve
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("should reset filters when user clicks on 'clear filter' ", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={mocks}>
          <OrganizationTemplateListPage />
        </MockedProvider>,
      );
    });

    // MockedProvider requires await for requests to resolve
    await waitFor(() => {
      // Searching for translation keys since cannot run next-intl for unit tests
      const homeLink = screen.getByRole("link", { name: "breadcrumbs.home" });
      expect(homeLink).toBeInTheDocument();
    });

    // Searching for translation key since cannot run next-intl for unit tests
    const searchInput = screen.getByLabelText(/searchLabel/i);
    expect(searchInput).toBeInTheDocument();

    // enter findable search term
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "UCOP" } });
    });

    // Click the Search button
    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      // Newly filtered list should only show UCOP
      expect(screen.getByText("UCOP")).toBeInTheDocument();
      expect(screen.queryByText("CDL")).not.toBeInTheDocument();
    });

    // Check that the clear filter button is present
    const clearFilterButton = screen.getAllByText(/clearFilter/i);
    expect(clearFilterButton).toHaveLength(1);

    // Click the clear filter button
    fireEvent.click(clearFilterButton[0]);

    // Check that the search input is cleared
    await waitFor(() => {
      const searchInput = screen.getByLabelText(/searchLabel/i);
      expect(searchInput).toHaveValue("");
      // Check that both items are now visible again
      expect(screen.getByText("UCOP")).toBeInTheDocument();
      expect(screen.getByText("CDL")).toBeInTheDocument();
    });
  });

  it("should show error message when we cannot find item anything matching search term", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={mocks}>
          <OrganizationTemplateListPage />
        </MockedProvider>,
      );
    });

    // MockedProvider requires await for requests to resolve
    await waitFor(() => {
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("title");
    });

    // MockedProvider requires await for requests to resolve
    await waitFor(() => {
      const searchInput = screen.getByLabelText(/searchLabel/i);
      expect(searchInput).toBeInTheDocument();
      fireEvent.change(searchInput, { target: { value: "test" } });
    });

    await waitFor(() => {
      const searchButton = screen.getByRole("button", { name: /search/i });
      fireEvent.click(searchButton);

      // Check that we can find list item for UCOP
      const errorElement = screen.getByText("messaging.noItemsFound");
      expect(errorElement).toBeInTheDocument();
    });
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(
      <MockedProvider mocks={mocks}>
        <OrganizationTemplateListPage />
      </MockedProvider>,
    );

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  it("should display correct load more and remaining text", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={multipleItemsMock}>
          <OrganizationTemplateListPage />
        </MockedProvider>,
      );
    });

    // MockedProvider requires await for requests to resolve
    await waitFor(() => {
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("title");
      const templateItems = screen.getAllByTestId("template-list-item");
      expect(templateItems).toHaveLength(5);
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /loadMore/i })).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByRole("button", { name: /loadMore/i });
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      const templateItems = screen.getAllByTestId("template-list-item");
      expect(templateItems).toHaveLength(7);
    });
  });

  it("should display correct load more and remaining text when doing a search", async () => {
    await act(async () => {
      render(
        <MockedProvider mocks={multipleItemsMock}>
          <OrganizationTemplateListPage />
        </MockedProvider>,
      );
    });

    // MockedProvider requires await for requests to resolve
    await waitFor(() => {
      // Searching for translation keys since cannot run next-intl for unit tests
      const homeLink = screen.getByRole("link", { name: "breadcrumbs.home" });
      expect(homeLink).toBeInTheDocument();
    });

    await waitFor(() => {
      // Searching for translation key since cannot run next-intl for unit tests
      const searchInput = screen.getByLabelText(/searchLabel/i);
      expect(searchInput).toBeInTheDocument();

      // enter findable search term
      fireEvent.change(searchInput, { target: { value: "template" } });

      // Click the Search button
      const searchButton = screen.getByRole("button", { name: /search/i });
      fireEvent.click(searchButton);
    });

    await waitFor(() => {
      const templateItems = screen.getAllByTestId("template-list-item");
      expect(templateItems).toHaveLength(3);
    });

    const loadMoreButton = screen.getByRole("button", { name: /loadMore/i });
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      const templateItems = screen.getAllByTestId("template-list-item");
      expect(templateItems).toHaveLength(5);
    });
  });

  it("should display error if loadMore fetch for search returns error", async () => {
    render(
      <MockedProvider
        mocks={multipleItemsErrorMock}
      >
        <OrganizationTemplateListPage />
      </MockedProvider>,
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getAllByTestId("template-list-item").length).toBeGreaterThan(0);
    });

    // Simulate search
    const searchInput = screen.getByLabelText(/searchLabel/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "template" } });
    });

    const searchButton = screen.getByRole("button", { name: /search/i });
    await act(async () => {
      fireEvent.click(searchButton);
    });

    // Wait for search results
    await waitFor(() => {
      const templateItems = screen.getAllByTestId("template-list-item");
      expect(templateItems.length).toBeGreaterThan(0);
    });

    // Click load more
    const loadMoreButton = screen.getByRole("button", { name: /loadMore/i });
    await act(async () => {
      fireEvent.click(loadMoreButton);
    });

    // Wait for loading to finish
    await waitFor(
      () => {
        expect(screen.queryByText(/messaging.loading/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.queryByText(/Network error/i)).toBeInTheDocument();
  });
});
