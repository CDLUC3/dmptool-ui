import React from 'react';
import { act, fireEvent, render, screen, within, waitFor, cleanup } from '@/utils/test-utils';
import { MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { InMemoryCache } from '@apollo/client';

import TemplateListPage from '../page';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  mocks,
  multipleItemsMock,
  multipleItemsErrorMock,
  errorMock,
  unpublishedChangesMock
} from '../__mocks__/templateListPage.mocks';

expect.extend(toHaveNoViolations);

// Mock useFormatter and useTranslations  next-intl
jest.mock('next-intl', () => ({
  useFormatter: jest.fn(() => ({
    dateTime: jest.fn(() => '01-01-2023'),
  })),
  useTranslations: jest.fn(() => jest.fn((key) => key)), // Mock `useTranslations`
}));

interface PageHeaderProps {
  title: string;
  description: string;
  actions: React.ReactNode;
  breadcrumbs: React.ReactNode;
}

jest.mock('@/components/PageHeader', () => {
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

let apolloCache: InMemoryCache;
describe('TemplateListPage', () => {
  beforeEach(() => {
    // Create fresh cache for each test
    apolloCache = new InMemoryCache();
    // Prevent DOMException from scrollIntoView
    HTMLElement.prototype.scrollIntoView = jest.fn();

    // Prevent DOMException from focus
    HTMLElement.prototype.focus = jest.fn();
  });

  afterEach(async () => {
    // Flush pending Apollo microtasks (VERY IMPORTANT)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    jest.clearAllMocks();
    await apolloCache.reset();
    cleanup();
  })

  const renderPage = (apolloMocks: readonly MockedResponse[] = mocks) => render(
    <MockedProvider
      mocks={apolloMocks}
      cache={apolloCache}
    >
      <TemplateListPage />
    </MockedProvider>
  );

  it('should render the page header with correct title and description', async () => {
    renderPage();

    // MockedProvider requires await for requests to resolve
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('title');

    expect(screen.getByText('description')).toBeInTheDocument();
  });

  it('should render the create template link in header actions', async () => {
    renderPage();
    // MockedProvider requires await for requests to resolve
    const createLink = await screen.findByText('actionCreate');
    expect(createLink).toBeInTheDocument();
    expect(createLink).toHaveAttribute('href', '/en-US/template/create');
  });

  it('should render the search field with correct label and help text', async () => {

    renderPage();
    await screen.findByLabelText('searchLabel');

    expect(screen.getByLabelText('searchLabel')).toBeInTheDocument();
    expect(screen.getByText('searchHelpText')).toBeInTheDocument();

  });

  it('should render the template list with correct number of items', async () => {

    renderPage();

    // Wait until the list renders with the right name
    const list = await waitFor(() => screen.getByRole('list', { name: 'templateList' }));
    expect(list).toBeInTheDocument();

    // MockedProvider requires await for requests to resolve
    const templateItems = await screen.findAllByTestId('template-list-item');
    expect(templateItems).toHaveLength(2);
  });

  it('should render template items with correct titles', async () => {
    renderPage();
    // MockedProvider requires await for requests to resolve
    expect(await screen.findByText('UCOP')).toBeInTheDocument();

    const templateData = screen.getAllByTestId('template-metadata');
    const lastRevisedBy = within(templateData[0]).getByText(/lastRevisedBy.*Test User/);
    const lastUpdated = within(templateData[0]).getByText(/lastUpdated.*01-01-2023/);
    const publishStatus = within(templateData[0]).getByText(/published/i);
    const visibility = within(templateData[0]).getByText(/visibility.*Organization/);
    expect(lastRevisedBy).toBeInTheDocument();
    expect(publishStatus).toBeInTheDocument();
    expect(lastUpdated).toBeInTheDocument();
    expect(visibility).toBeInTheDocument();
  });

  it('should display "unpublished changes" status for templates with unpublished changes', async () => {
    renderPage(unpublishedChangesMock);

    // Wait for template to render
    expect(await screen.findByText('Template With Unpublished Changes')).toBeInTheDocument();

    // Check that the status shows unpublished changes
    const templateData = screen.getAllByTestId('template-metadata');
    const publishStatus = within(templateData[0]).getByText(/status.unpublishedChanges/i);
    expect(publishStatus).toBeInTheDocument();
  });

  it('should render the template list with correct ARIA role', async () => {
    renderPage();

    // Wait until the list renders with the right name
    const list = await waitFor(() => screen.getByRole('list', { name: 'templateList' }));
    expect(list).toBeInTheDocument();
    // Count children by data-testid
    // Wait for all template items to appear
    const templateItems = await screen.findAllByTestId('template-list-item');
    expect(templateItems).toHaveLength(2); // or however many are in your mock
  })

  it('should render breadcrumbs with correct links', async () => {
    renderPage();

    // MockedProvider requires await for requests to resolve
    // Searching for translation keys since cannot run next-intl for unit tests
    const homeLink = await screen.findByRole('link', { name: 'breadcrumbs.home' });
    const templatesLink = await screen.findByRole('link', { name: 'breadcrumbs.templates' });

    expect(homeLink).toHaveAttribute('href', '/en-US');
    expect(templatesLink).toHaveAttribute('href', '/en-US/template');
  });

  it('should render error when graphql query returns as error', async () => {
    renderPage(errorMock);

    // MockedProvider requires await for requests to resolve
    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });


  it('should reset filters when user clicks on \'clear filter\' ', async () => {
    renderPage();


    // Wait for initial list to render
    const initialItems = await screen.findAllByTestId('template-list-item');
    expect(initialItems.length).toBeGreaterThan(0);


    // Search for UCOP
    const searchInput = await screen.findByLabelText(/searchLabel/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'UCOP' } });
    });
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    // Wait for filtered results
    const filteredItems = await screen.findAllByTestId('template-list-item');
    // You can check the title text inside each item
    expect(filteredItems.some(item => item.textContent?.includes('UCOP'))).toBe(true);
    expect(filteredItems.some(item => item.textContent?.includes('CDL'))).toBe(false);

    // Check that the clear filter button is present
    const clearFilterButton = await screen.findAllByText(/clearFilter/i);
    expect(clearFilterButton).toHaveLength(1);

    // Click the clear filter button
    fireEvent.click(clearFilterButton[0]);

    const allItemsAfterClear = await screen.findAllByTestId('template-list-item');
    expect(allItemsAfterClear.some(item => item.textContent?.includes('UCOP'))).toBe(true);
    expect(allItemsAfterClear.some(item => item.textContent?.includes('CDL'))).toBe(true);

  })

  it('should show error message when we cannot find item anything matching search term', async () => {
    renderPage();

    // MockedProvider requires await for requests to resolve
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('title');

    // MockedProvider requires await for requests to resolve

    const searchInput = await screen.findByLabelText(/searchLabel/i);
    expect(searchInput).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: 'test' } });


    const searchButton = await screen.findByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    // Check that we can find list item for UCOP
    const errorElement = screen.getByText('messaging.noItemsFound');
    expect(errorElement).toBeInTheDocument();

  })

  it('should display correct load more and remaining text when doing a search', async () => {
    renderPage();

    // MockedProvider requires await for requests to resolve

    // Searching for translation keys since cannot run next-intl for unit tests
    const homeLink = await screen.findByRole('link', { name: 'breadcrumbs.home' });
    expect(homeLink).toBeInTheDocument();

    // Searching for translation key since cannot run next-intl for unit tests
    const searchInput = await screen.findByLabelText(/searchLabel/i);
    expect(searchInput).toBeInTheDocument();

    // enter findable search term
    fireEvent.change(searchInput, { target: { value: 'missing' } });

    // Click the Search button
    const searchButton = await screen.findByRole('button', { name: /search/i });
    fireEvent.click(searchButton);


    const templateItems = await screen.findAllByTestId('template-list-item');
    expect(templateItems).toHaveLength(1);

    const loadMoreButton = await screen.findByRole('button', { name: /loadMore/i });
    fireEvent.click(loadMoreButton);

    const templateItems2 = await screen.findAllByTestId('template-list-item');
    expect(templateItems2).toHaveLength(1);
  });


  it('should display correct load more and remaining text', async () => {
    renderPage(multipleItemsMock);

    // MockedProvider requires await for requests to resolve
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('title');
    const templateItems = await screen.findAllByTestId('template-list-item');
    expect(templateItems).toHaveLength(5);

    expect(await screen.findByRole('button', { name: /loadMore/i })).toBeInTheDocument();

    const loadMoreButton = await screen.findByRole('button', { name: /loadMore/i });
    fireEvent.click(loadMoreButton);

    const templateItems2 = await screen.findAllByTestId('template-list-item');
    expect(templateItems2).toHaveLength(5);
  });

  it('should display error if loadMore fetch for search returns error', async () => {
    renderPage(multipleItemsErrorMock);

    // Simulate search
    const searchInput = await screen.findByLabelText(/searchLabel/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'template' } });
    });

    const searchButton = await screen.findByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    // Wait for items to render, then click "Load more"
    const templateItems = await screen.findAllByTestId('template-list-item');
    expect(templateItems.length).toBeGreaterThan(0);
    const loadMoreButton = await screen.findByRole('button', { name: /loadMore/i });
    await act(async () => {
      fireEvent.click(loadMoreButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    }, { timeout: 3000 });

  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <MockedProvider
        mocks={mocks}
        cache={apolloCache}
        defaultOptions={{
          query: { fetchPolicy: 'no-cache' },
          watchQuery: { fetchPolicy: 'no-cache' },
        }}
      >
        <TemplateListPage />
      </MockedProvider>
    );

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});