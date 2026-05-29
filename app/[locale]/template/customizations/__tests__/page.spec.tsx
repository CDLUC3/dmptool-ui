import React from 'react';
import { act, fireEvent, render, screen, within, waitFor, cleanup } from '@/utils/test-utils';
import { MockedProvider } from '@apollo/client/testing/react';
import { InMemoryCache } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import TemplateListCustomizationsPage from '../page';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  CustomizableTemplatesDocument,
  AddTemplateCustomizationDocument,
  TemplateCustomizationStatus
} from '@/generated/graphql';
import {
  mocks,
  errorMock,
  mutationErrorMock,
  multipleItemsMock,
  multipleItemsErrorMock,
  searchWithPaginationMock
} from '../__mocks__/customizableTemplates.mocks';

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(() => ({
    add: jest.fn(),
  })),
}));

// Mock useFormatter and useTranslations  next-intl
jest.mock('next-intl', () => ({
  useFormatter: jest.fn(() => ({
    dateTime: jest.fn(() => '01-01-2023'),
  })),
  useTranslations: jest.fn(() => jest.fn((key) => key)),
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
describe('TemplateListCustomizationsPage', () => {
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

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const renderPage = (apolloMocks: any = mocks) => render(
    <MockedProvider
      mocks={apolloMocks}
      cache={apolloCache}
    >
      <TemplateListCustomizationsPage />
    </MockedProvider>
  );

  it('should render the page header with correct title and description', async () => {
    renderPage();

    // MockedProvider requires await for requests to resolve
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('title');

    expect(screen.getByText('description')).toBeInTheDocument();
  });

  it('should render the search field with correct label and help text', async () => {

    renderPage();

    await screen.findAllByTestId('template-list-item');

    // MockedProvider requires await for requests to resolve
    // Searching for translation keys since cannot run next-intl for unit tests
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

  it('should render template items with correct metadata', async () => {
    renderPage();

    // MockedProvider requires await for requests to resolve
    expect(await screen.findByText('NSF-BIO: Biological Sciences')).toBeInTheDocument();
    expect(await screen.findByText('NSF-ENG: Engineering')).toBeInTheDocument();

    const templateData = screen.getAllByTestId('template-metadata');
    // First item should show customization metadata
    const lastCustomizedBy = within(templateData[0]).getByText(/templateStatus.lastCustomizedBy.*Test User/);
    const lastCustomized = within(templateData[0]).getByText(/templateStatus.lastCustomized.*01-01-2023/);
    const customizationStatus = within(templateData[0]).getByText(/templateStatus.customizationStatus.*templateStatus.published/i);

    expect(lastCustomizedBy).toBeInTheDocument();
    expect(lastCustomized).toBeInTheDocument();
    expect(customizationStatus).toBeInTheDocument();
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

    // Search for "biological" - wait a bit for button to be ready
    const searchInput = await screen.findByLabelText(/searchLabel/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'biological' } });
    });

    // Find button by text content (React Aria SearchField shows "buttons.search" text)
    const searchButton = await screen.findByText('buttons.search');
    await act(async () => {
      fireEvent.click(searchButton);
    });

    // Wait for filtered results
    const filteredItems = await screen.findAllByTestId('template-list-item');
    // Should only show the biological sciences template
    expect(filteredItems.some(item => item.textContent?.includes('NSF-BIO: Biological Sciences'))).toBe(true);
    expect(filteredItems.some(item => item.textContent?.includes('NSF-ENG: Engineering'))).toBe(false);

    // Check that the clear filter button is present
    const clearFilterButton = await screen.findAllByText(/links.clearFilter/i);
    expect(clearFilterButton.length).toBeGreaterThan(0);

    // Click the clear filter button
    fireEvent.click(clearFilterButton[0]);

    // Should show all items again
    const allItemsAfterClear = await screen.findAllByTestId('template-list-item');
    expect(allItemsAfterClear.some(item => item.textContent?.includes('NSF-BIO: Biological Sciences'))).toBe(true);
    expect(allItemsAfterClear.some(item => item.textContent?.includes('NSF-ENG: Engineering'))).toBe(true);
  })

  it('should show error message when we cannot find item anything matching search term', async () => {
    renderPage();

    // MockedProvider requires await for requests to resolve
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('title');

    const searchInput = await screen.findByLabelText(/searchLabel/i);
    expect(searchInput).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: 'test' } });

    const searchButton = await screen.findByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    // Check that we see the no items found message
    const errorElement = await screen.findByText('messaging.noItemsFound');
    expect(errorElement).toBeInTheDocument();

  })

  it('should display correct load more and remaining text when doing a search', async () => {
    renderPage(searchWithPaginationMock);

    const searchInput = await screen.findByLabelText(/searchLabel/i);
    expect(searchInput).toBeInTheDocument();

    // enter search term that matches searchWithPaginationMock and trigger search
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'biological' } });
    });

    // Find button by text content and click it
    const searchButton = await screen.findByText('buttons.search');
    await act(async () => {
      fireEvent.click(searchButton);
    });

    // Should show initial 1 item from search results
    const templateItems = await screen.findAllByTestId('template-list-item');
    expect(templateItems).toHaveLength(1);

    const loadMoreButton = await screen.findByRole('button', { name: /loadMoreSearchResults/i });

    await act(async () => {
      fireEvent.click(loadMoreButton);
    });

    // Wait for the items to update
    await waitFor(() => {
      const templateItems2 = screen.getAllByTestId('template-list-item');
      expect(templateItems2).toHaveLength(2);
    });
  });


  it('should display correct load more and remaining text', async () => {
    renderPage(multipleItemsMock);

    // MockedProvider requires await for requests to resolve
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('title');

    // multipleItemsMock returns 3 items initially (LIMIT = 3)
    const templateItems = await screen.findAllByTestId('template-list-item');
    expect(templateItems).toHaveLength(3);

    const loadMoreButton = await screen.findByRole('button', { name: /loadMoreTemplates/i });
    expect(loadMoreButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(loadMoreButton);
    });

    // After loading more, should have 5 total items - wait for the items to update
    await waitFor(() => {
      const templateItems2 = screen.getAllByTestId('template-list-item');
      expect(templateItems2).toHaveLength(5);
    });
  });

  it('should display error if loadMore fetch returns error', async () => {
    renderPage(multipleItemsErrorMock);

    // Wait for initial items to render
    const templateItems = await screen.findAllByTestId('template-list-item');
    expect(templateItems.length).toBeGreaterThan(0);

    // Click "Load more" to trigger error
    const loadMoreButton = await screen.findByRole('button', { name: /loadMoreTemplates/i });
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
        <TemplateListCustomizationsPage />
      </MockedProvider>
    );

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('handleAddCustomization', () => {
    let mockPush: jest.Mock;
    let mockToastAdd: jest.Mock;

    beforeEach(() => {
      mockPush = jest.fn();
      mockToastAdd = jest.fn();

      (useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
      });

      (useToast as jest.Mock).mockReturnValue({
        add: mockToastAdd,
      });
    });

    it('should redirect directly if template customization already exists (has id)', async () => {
      renderPage();

      // Wait for initial load
      await screen.findAllByTestId('template-list-item');

      // Find the customize button for the first item (which has id=1)
      const updateButton = screen.getAllByLabelText("links.update NSF-BIO: Biological Sciences");

      await act(async () => {
        fireEvent.click(updateButton[1]);
      });

      // Should redirect without calling mutation
      expect(mockPush).toHaveBeenCalledWith('/en-US/template/customizations/1');
    });

    it('should create new template customization and redirect on success', async () => {
      const newCustomizationMock = [
        {
          request: {
            query: CustomizableTemplatesDocument,
            variables: {
              paginationOptions: {
                type: "CURSOR",
                limit: 5,
              },
            },
          },
          result: {
            data: {
              customizableTemplates: {
                items: [
                  {
                    __typename: 'CustomizableTemplateSearchResult',
                    customizationId: null, // ← No existing customization
                    customizationIsDirty: false,
                    customizationLastCustomized: null,
                    customizationLastCustomizedById: null,
                    customizationLastCustomizedByName: null,
                    customizationMigrationStatus: null,
                    versionedTemplateDescription: 'NSF-BIO: Biological Sciences',
                    versionedTemplateAffiliationId: "https://ror.org/03yrm5c26",
                    versionedTemplateAffiliationName: 'National Science Foundation',
                    versionedTemplateId: 2,
                    versionedTemplateName: 'NSF-BIO: Biological Sciences',
                    versionedTemplateBestPractice: false,
                    customizationStatus: null,
                    versionedTemplateLastModified: '2023-12-01T00:00:00Z',
                  },
                ],
                nextCursor: null,
                totalCount: 1,
              },
            },
          },
        },
        {
          request: {
            query: AddTemplateCustomizationDocument,
            variables: {
              input: {
                versionedTemplateId: 2,
                status: TemplateCustomizationStatus.Draft,
              }
            }
          },
          result: {
            data: {
              addTemplateCustomization: {
                customizationId: 19,
                customizationIsDirty: false,
                customizationMigrationStatus: "OK",
                customizationStatus: "DRAFT",
                errors: {
                  general: null,
                  __typename: "TemplateErrors"
                },
                versionedTemplateAffiliationId: "https://ror.org/03yrm5c26",
                versionedTemplateId: 2,
                __typename: "TemplateCustomization"
              }
            }
          }
        }
      ];
      renderPage(newCustomizationMock);

      // Wait for initial load
      await screen.findAllByTestId('template-list-item');

      // Create a mock for a template without customizationId
      const updateButton = screen.getAllByLabelText("links.update NSF-BIO: Biological Sciences");

      await act(async () => {
        fireEvent.click(updateButton[1]);
      });

      // Wait for mutation to complete
      await waitFor(() => {
        expect(mockToastAdd).toHaveBeenCalledWith(
          expect.any(String),
          { type: 'success' }
        );
      });

      // Should redirect to the new customization page
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en-US/template/customizations/19');
      });
    });

    it('should display errors when mutation returns errors', async () => {
      renderPage(mutationErrorMock);

      await screen.findAllByTestId('template-list-item');

      const updateButton = screen.getAllByLabelText("links.update Test Template");

      await act(async () => {
        fireEvent.click(updateButton[1]);
      });


      // Should display the error message on page
      await waitFor(() => {
        // Try finding the error in different ways
        const errorByTestId = screen.queryByTestId('error-messages');

        expect(
          screen.getByText('Something went wrong') ||
          errorByTestId?.textContent?.includes('Something went wrong')
        ).toBeTruthy();
      }, { timeout: 3000 });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle error when mutation succeeds but no ID is returned', async () => {
      const noIdMocks = [
        {
          request: {
            query: CustomizableTemplatesDocument,
            variables: {
              paginationOptions: {
                type: "CURSOR",
                limit: 5,
              },
            },
          },
          result: {
            data: {
              customizableTemplates: {
                items: [
                  {
                    __typename: 'CustomizableTemplateSearchResult',
                    customizationId: null,
                    customizationIsDirty: false,
                    customizationLastCustomized: null,
                    customizationLastCustomizedById: null,
                    customizationLastCustomizedByName: null,
                    customizationMigrationStatus: null,
                    versionedTemplateDescription: 'Test Template',
                    versionedTemplateAffiliationId: "https://ror.org/test",
                    versionedTemplateAffiliationName: 'Test Funder',
                    versionedTemplateId: 999,
                    versionedTemplateName: 'Test Template',
                    versionedTemplateBestPractice: false,
                    customizationStatus: null,
                    versionedTemplateLastModified: '2023-12-01T00:00:00Z',
                  },
                ],
                nextCursor: null,
                totalCount: 1,
              },
            },
          },
        },
        {
          request: {
            query: AddTemplateCustomizationDocument,
            variables: {
              input: {
                versionedTemplateId: 999,
                status: TemplateCustomizationStatus.Draft,
              }

            }
          },
          result: {
            data: {
              addTemplateCustomization: {
                id: null, // No ID returned
                errors: {
                  collaboratorIds: null,
                  description: null,
                  general: null,
                  languageId: null,
                  latestPublishVersion: null,
                  latestPublishVisibility: null,
                  name: null,
                  ownerId: null,
                  sectionIds: null,
                  sourceTemplateId: null,
                  __typename: "TemplateErrors"
                },
                isDirty: false,
                currentVersionedTemplateId: null,
                affiliationId: null,
                status: "DRAFT",
                migrationStatus: null,
                latestPublishedDate: null,
                __typename: "TemplateCustomization"
              }
            }
          }
        }
      ];

      renderPage(noIdMocks);

      await screen.findAllByTestId('template-list-item');

      const updateButton = screen.getAllByLabelText("links.update Test Template");

      await act(async () => {
        fireEvent.click(updateButton[1]);
      });

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText('messaging.somethingWentWrong')).toBeInTheDocument();
      });

      // Should NOT redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle mutation error with catch block', async () => {
      const mutationErrorMocks = [
        {
          request: {
            query: CustomizableTemplatesDocument,
            variables: {
              paginationOptions: {
                type: "CURSOR",
                limit: 5,
              },
            },
          },
          result: {
            data: {
              customizableTemplates: {
                items: [
                  {
                    __typename: 'CustomizableTemplateSearchResult',
                    customizationId: null,
                    customizationIsDirty: false,
                    customizationLastCustomized: null,
                    customizationLastCustomizedById: null,
                    customizationLastCustomizedByName: null,
                    customizationMigrationStatus: null,
                    versionedTemplateDescription: 'Test Template',
                    versionedTemplateAffiliationId: "https://ror.org/test",
                    versionedTemplateAffiliationName: 'Test Funder',
                    versionedTemplateId: 999,
                    versionedTemplateName: 'Test Template',
                    versionedTemplateBestPractice: false,
                    customizationStatus: null,
                    versionedTemplateLastModified: '2023-12-01T00:00:00Z',
                  },
                ],
                nextCursor: null,
                totalCount: 1,
              },
            },
          },
        },
        {
          request: {
            query: AddTemplateCustomizationDocument,
            variables: {
              input: {
                versionedTemplateId: 999,
                status: TemplateCustomizationStatus.Draft,
              }
            }
          },
          error: new Error('Network error during mutation'),
        }
      ];

      renderPage(mutationErrorMocks);

      await screen.findAllByTestId('template-list-item');

      const updateButton = screen.getAllByLabelText("links.update Test Template");

      await act(async () => {
        fireEvent.click(updateButton[1]);
      });

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText('messaging.somethingWentWrong')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should NOT redirect
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    let mockPush: jest.Mock;
    let mockToastAdd: jest.Mock;

    beforeEach(() => {
      mockPush = jest.fn();
      mockToastAdd = jest.fn();

      (useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
      });

      (useToast as jest.Mock).mockReturnValue({
        add: mockToastAdd,
      });
    });

    it('should show loading component during mutation then hide after completion', async () => {
      const loadingMocks = [
        {
          request: {
            query: CustomizableTemplatesDocument,
            variables: {
              paginationOptions: {
                type: "CURSOR",
                limit: 5,
              },
            },
          },
          result: {
            data: {
              customizableTemplates: {
                items: [
                  {
                    __typename: 'CustomizableTemplateSearchResult',
                    customizationId: null,
                    customizationIsDirty: false,
                    customizationLastCustomized: null,
                    customizationLastCustomizedById: null,
                    customizationLastCustomizedByName: null,
                    customizationMigrationStatus: null,
                    versionedTemplateDescription: 'Test Template',
                    versionedTemplateAffiliationId: "https://ror.org/test",
                    versionedTemplateAffiliationName: 'Test Funder',
                    versionedTemplateId: 999,
                    versionedTemplateName: 'Test Template',
                    versionedTemplateBestPractice: false,
                    customizationStatus: null,
                    versionedTemplateLastModified: '2023-12-01T00:00:00Z',
                  },
                ],
                nextCursor: null,
                totalCount: 1,
              },
            },
          },
        },
        {
          request: {
            query: AddTemplateCustomizationDocument,
            variables: {
              input: {
                versionedTemplateId: 999,
                status: TemplateCustomizationStatus.Draft,
              }
            }
          },
          delay: 100, // Small delay to ensure we can capture loading state
          result: {
            data: {
              addTemplateCustomization: {
                customizationId: 19,
                errors: {
                  general: null,
                  __typename: "TemplateErrors"
                },
                customizationIsDirty: false,
                customizationMigrationStatus: "OK",
                customizationStatus: "DRAFT",
                versionedTemplateAffiliationId: "https://ror.org/test",
                versionedTemplateId: 945,
                __typename: "TemplateCustomization"
              }
            }
          }
        }
      ];

      renderPage(loadingMocks);

      await screen.findAllByTestId('template-list-item');

      const customizeButton = screen.getAllByLabelText("links.update Test Template");

      // Click the button to trigger mutation
      await act(async () => {
        fireEvent.click(customizeButton[1]);
      });


      // Loading component should appear
      await waitFor(() => {
        expect(screen.getByTestId('loading-component')).toBeInTheDocument();
      });

      // Verify the redirect happened (mutation succeeded)
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en-US/template/customizations/19'); // ← Fixed path
      });

    });

    it('should hide loading component after error', async () => {
      const errorLoadingMocks = [
        {
          request: {
            query: CustomizableTemplatesDocument,
            variables: {
              paginationOptions: {
                type: "CURSOR",
                limit: 5,
              },
            },
          },
          result: {
            data: {
              customizableTemplates: {
                items: [
                  {
                    __typename: 'CustomizableTemplateSearchResult',
                    customizationId: null,
                    customizationIsDirty: false,
                    customizationLastCustomized: null,
                    customizationLastCustomizedById: null,
                    customizationLastCustomizedByName: null,
                    customizationMigrationStatus: null,
                    versionedTemplateDescription: 'Test Template',
                    versionedTemplateAffiliationId: "https://ror.org/test",
                    versionedTemplateAffiliationName: 'Test Funder',
                    versionedTemplateId: 999,
                    versionedTemplateName: 'Test Template',
                    versionedTemplateBestPractice: false,
                    customizationStatus: null,
                    versionedTemplateLastModified: '2023-12-01T00:00:00Z',
                  },
                ],
                nextCursor: null,
                totalCount: 1,
              },
            },
          },
        },
        {
          request: {
            query: AddTemplateCustomizationDocument,
            variables: {
              input: {
                versionedTemplateId: 999,
                status: TemplateCustomizationStatus.Draft,
              }
            }
          },
          delay: 100,
          error: new Error('Network error'),
        }
      ];

      renderPage(errorLoadingMocks);

      await screen.findAllByTestId('template-list-item');

      // Initially, loading should not be visible
      expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();

      const customizeButton = screen.getAllByLabelText("links.update Test Template");

      // Click the button to trigger mutation
      await act(async () => {
        fireEvent.click(customizeButton[1]);
      });

      // Loading component should appear
      await waitFor(() => {
        expect(screen.getByTestId('loading-component')).toBeInTheDocument();
      });

      // Loading should disappear
      await waitFor(() => {
        expect(screen.getByText('messaging.somethingWentWrong')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
      });
    });
  });
});

