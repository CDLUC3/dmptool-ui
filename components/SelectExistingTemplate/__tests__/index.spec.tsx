import React, { ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor, within } from '@/utils/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { RichTranslationValues } from 'next-intl';
import TemplateSelectTemplatePage from '../index';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import {
  AddTemplateDocument,
  PublishedTemplatesDocument,
  TemplatesDocument
} from '@/generated/graphql';
import { useRouter } from '@/i18n/routing';
import logECS from '@/utils/clientLogger';
import mockMyTemplates from '../__mocks__/mockTemplates.json';
import mockPublishedTemplates from '../__mocks__/mockPublishedTemplates.json';

expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/'),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(() => ({
    add: jest.fn(),
  })),
}));

type MockUseTranslations = {
  (key: string, ...args: unknown[]): string;
  rich: (key: string, values?: RichTranslationValues) => ReactNode;
};

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    const mockUseTranslations: MockUseTranslations = ((key: string) => key) as MockUseTranslations;

    mockUseTranslations.rich = (key, values) => {
      const p = values?.p;
      if (typeof p === 'function') {
        return p(key); // Can return JSX
      }
      return key; // fallback
    };

    return mockUseTranslations;
  }),
}));

jest.mock('@/utils/clientLogger', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('@/components/PageHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-page-header" />
}));

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useMutation: jest.fn(),
  useLazyQuery: jest.fn(),
}));

// Mock useFormatter from next-intl
jest.mock('next-intl', () => ({
  useFormatter: jest.fn(() => ({
    dateTime: jest.fn(() => '01-01-2023'),
  })),
  useTranslations: jest.fn(() => jest.fn((key) => key)), // Mock `useTranslations`,
}));


// Cast with jest.mocked utility
const mockUseMutation = jest.mocked(useMutation);
const mockUseLazyQuery = jest.mocked(useLazyQuery);

let mockAddTemplateFn: jest.Mock;
const mockFetchPublished = jest.fn().mockResolvedValue({
  data: mockPublishedTemplates
});

const mockFetchMyTemplates = jest.fn().mockResolvedValue({
  data: mockMyTemplates
});

const setupMocks = () => {

  // Lazy query mocks
  const stablePublishedTemplatesReturn = [
    mockFetchPublished,
    {
      data: mockPublishedTemplates,
      loading: false,
      error: null
    }
  ];

  const stableTemplatesReturn = [
    mockFetchMyTemplates,
    { data: mockMyTemplates, loading: false, error: null }
  ]

  mockUseLazyQuery.mockImplementation((document) => {
    if (document === PublishedTemplatesDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return stablePublishedTemplatesReturn as any;
    }

    if (document === TemplatesDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return stableTemplatesReturn as any;
    }

    return {
      data: null,
      loading: false,
      error: undefined
    };
  });

  mockAddTemplateFn = jest.fn().mockResolvedValue({
    data: { key: 'value' }
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === AddTemplateDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [mockAddTemplateFn, { loading: false, error: undefined }] as any;
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return [jest.fn(), { loading: false, error: undefined }] as any;
  });
};

describe('TemplateSelectTemplatePage', () => {
  let pushMock: jest.Mock;
  beforeEach(() => {
    setupMocks();
    pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    window.scrollTo = jest.fn();
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  })

  it('should render the main content templates', async () => {
    await act(async () => {
      render(
        <TemplateSelectTemplatePage templateName="test" />
      );
    });

    const searchInput = screen.getByLabelText('labels.searchByKeyword');
    expect(searchInput).toBeInTheDocument();
    expect(screen.getByText('helpText.searchHelpText')).toBeInTheDocument();
    expect(screen.getByTestId('mock-page-header')).toBeInTheDocument();

    //Expect the template sections to be in the document
    // My organization templates
    const myOrgTemplates = screen.getByTestId('my-org-templates');
    expect(myOrgTemplates).toBeInTheDocument();
    expect(within(myOrgTemplates).getByRole('heading', { name: /headings.myOrgTemplates/i, level: 2 })).toBeInTheDocument();
    expect(within(myOrgTemplates).getByRole('heading', { name: /Juliet's Test Template 3/i, level: 2 })).toBeInTheDocument();
    expect(within(myOrgTemplates).getByRole('heading', { name: /Juliet's Test Template 1/i, level: 2 })).toBeInTheDocument();
    expect(within(myOrgTemplates).getByRole('heading', { name: /Computer and Information Science and Engineering/i, level: 2 })).toBeInTheDocument();
    expect(within(myOrgTemplates).getByRole('heading', { name: /Astronomical Sciences/i, level: 2 })).toBeInTheDocument();
    expect(within(myOrgTemplates).getByRole('heading', { name: /Engineering Template/i, level: 2 })).toBeInTheDocument();
    const templateData = within(myOrgTemplates).getAllByTestId('template-list-item');
    const lastRevisedBy = within(templateData[0]).getByText(/lastRevisedBy.*NSF Admin/);
    const lastUpdated = within(templateData[0]).getByText(/lastUpdated.*01-01-2023/);
    const publishStatus = within(templateData[0]).getByText('notPublished');
    const visibility = within(templateData[0]).getByText(/visibility\s*:\s*Organization/i);
    expect(lastRevisedBy).toBeInTheDocument();
    expect(lastUpdated).toBeInTheDocument();
    expect(publishStatus).toBeInTheDocument();
    expect(visibility).toBeInTheDocument();
    const lastRevisedBy1 = within(templateData[1]).getByText(/lastRevisedBy.*NSF Admin/);
    const lastUpdated1 = within(templateData[1]).getByText(/lastUpdated.*01-01-2023/);
    const publishStatus1 = within(templateData[1]).getByText('published');
    const visibility1 = within(templateData[1]).getByText(/visibility\s*:\s*Public/i);
    expect(lastRevisedBy1).toBeInTheDocument();
    expect(lastUpdated1).toBeInTheDocument();
    expect(publishStatus1).toBeInTheDocument();
    expect(visibility1).toBeInTheDocument();

    // Public templates
    const publishedTemplates = screen.getByTestId('published-templates');
    expect(publishedTemplates).toBeInTheDocument();
    expect(within(publishedTemplates).getByRole('heading', { name: /headings.publicTemplates/i, level: 2 })).toBeInTheDocument();
    expect(within(publishedTemplates).getByRole('heading', { name: /Juliet's Best Practice Template/i, level: 2 })).toBeInTheDocument();
    expect(within(publishedTemplates).getByRole('heading', { name: /Juliet's Test Template 1/i, level: 2 })).toBeInTheDocument();
    expect(within(publishedTemplates).getByRole('heading', { name: /Test Template Bravo/i, level: 2 })).toBeInTheDocument();
    expect(within(publishedTemplates).getByRole('heading', { name: /Test Template 2/i, level: 2 })).toBeInTheDocument();
    expect(within(publishedTemplates).getByRole('heading', { name: /Test Template 3/i, level: 2 })).toBeInTheDocument();
    const publicTemplateData = within(publishedTemplates).getAllByTestId('template-list-item');
    const lastRevisedBy2 = within(publicTemplateData[0]).getByText(/lastRevisedBy.*NIH Admin/);
    const lastUpdated2 = within(publicTemplateData[0]).getByText(/lastUpdated.*01-01-2023/);
    const publishStatus2 = within(publicTemplateData[0]).getByText('published');
    const visibility2 = within(publicTemplateData[0]).getByText(/visibility\s*:\s*Public/i);
    expect(lastRevisedBy2).toBeInTheDocument();
    expect(lastUpdated2).toBeInTheDocument();
    expect(publishStatus2).toBeInTheDocument();
    expect(visibility2).toBeInTheDocument();
  });


  it('should not have any problems if template title or description is empty', async () => {

    const mockPublishedTemplatesWithEmptyFields = {
      publishedTemplates: {
        __typename: "PublishedTemplateSearchResults",
        limit: 5,
        nextCursor: null,
        totalCount: 32,
        availableSortFields: [
          "vt.name",
          "vt.created",
          "vt.visibility",
          "vt.bestPractice",
          "vt.modified"
        ],
        currentOffset: 0,
        hasNextPage: true,
        hasPreviousPage: false,
        items: [
          {
            __typename: "VersionedTemplateSearchResult",
            id: 32,
            templateId: 32,
            name: null,
            description: null,
            visibility: "PUBLIC",
            bestPractice: false,
            version: "v1",
            modified: "1758239580000",
            modifiedById: 15,
            modifiedByName: null,
            ownerId: 118,
            ownerURI: "https://ror.org/021123462",
            ownerDisplayName: null,
            ownerSearchName: "National Science Foundation | nsf.gov | NSF "
          }
        ]
      }
    };

    const mockTemplatesWithEmptyFields = {
      myTemplates: {
        __typename: "TemplateSearchResults",
        totalCount: 11,
        nextCursor: null,
        limit: 5,
        availableSortFields: [
          "t.name",
          "t.created",
          "t.latestPublishVisibility",
          "t.bestPractice",
          "t.latestPublishDate"
        ],
        currentOffset: 0,
        hasNextPage: true,
        hasPreviousPage: false,
        items: [
          {
            __typename: "TemplateSearchResult",
            id: 33,
            name: null,
            description: null,
            latestPublishVisibility: "ORGANIZATION",
            isDirty: true,
            latestPublishVersion: "",
            latestPublishDate: null,
            ownerId: "https://ror.org/021678962",
            ownerDisplayName: "National Science Foundation (nsf.gov)",
            modified: "1758241119000",
            modifiedById: 15,
            modifiedByName: "NSF Admin",
            bestPractice: false
          },
        ]
      }
    };

    const stablePublishedTemplatesReturn = [
      mockFetchPublished,
      {
        data: mockPublishedTemplatesWithEmptyFields,
        loading: false,
        error: null
      }
    ];

    const stableTemplatesReturn = [
      mockFetchMyTemplates,
      {
        data: mockTemplatesWithEmptyFields,
        loading: false,
        error: null
      }
    ]

    mockUseLazyQuery.mockImplementation((document) => {
      if (document === PublishedTemplatesDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return stablePublishedTemplatesReturn as any;
      }

      if (document === TemplatesDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return stableTemplatesReturn as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => {
      render(
        <TemplateSelectTemplatePage templateName="test" />
      );
    });

    const searchInput = screen.getByLabelText('labels.searchByKeyword');
    expect(searchInput).toBeInTheDocument();
    expect(screen.getByText('helpText.searchHelpText')).toBeInTheDocument();
    expect(screen.getByTestId('mock-page-header')).toBeInTheDocument();

    //Expect the template sections to be in the document
    // My organization templates
    const myOrgTemplates = screen.getByTestId('my-org-templates');
    expect(myOrgTemplates).toBeInTheDocument();
    expect(within(myOrgTemplates).getByRole('heading', { name: /headings.myOrgTemplates/i, level: 2 })).toBeInTheDocument();
    const templateData = within(myOrgTemplates).getAllByTestId('template-list-item');
    const lastRevisedBy = within(templateData[0]).getByText(/lastRevisedBy.*NSF Admin/);
    const lastUpdated = within(templateData[0]).getByText(/lastUpdated.*01-01-2023/);
    const publishStatus = within(templateData[0]).getByText('notPublished');
    const visibility = within(templateData[0]).getByText(/visibility\s*:\s*Organization/i);
    expect(lastRevisedBy).toBeInTheDocument();
    expect(lastUpdated).toBeInTheDocument();
    expect(publishStatus).toBeInTheDocument();
    expect(visibility).toBeInTheDocument();

    const publishedTemplates = screen.getByTestId('published-templates');
    expect(publishedTemplates).toBeInTheDocument();
    expect(within(publishedTemplates).getByRole('heading', { name: /headings.publicTemplates/i, level: 2 })).toBeInTheDocument();

    const publicTemplateData = within(publishedTemplates).getAllByTestId('template-list-item');
    const lastRevisedBy2 = within(publicTemplateData[0]).getByText(/lastRevisedBy:/);
    const lastUpdated2 = within(publicTemplateData[0]).getByText(/lastUpdated.*01-01-2023/);
    const publishStatus2 = within(publicTemplateData[0]).getByText('published');
    const visibility2 = within(publicTemplateData[0]).getByText(/visibility\s*:\s*Public/i);
    expect(lastRevisedBy2).toBeInTheDocument();
    expect(lastUpdated2).toBeInTheDocument();
    expect(publishStatus2).toBeInTheDocument();
    expect(visibility2).toBeInTheDocument();
  });

  it('should render text loading text if templates are still loading', async () => {
    const stablePublishedTemplatesReturn = [
      mockFetchPublished,
      {
        data: undefined,
        loading: true,
        error: null
      }
    ];

    const stableTemplatesReturn = [
      mockFetchMyTemplates,
      { data: mockMyTemplates, loading: false, error: null }
    ]

    mockUseLazyQuery.mockImplementation((document) => {
      if (document === PublishedTemplatesDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return stablePublishedTemplatesReturn as any;
      }

      if (document === TemplatesDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return stableTemplatesReturn as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => {
      render(
        <TemplateSelectTemplatePage templateName="test" />
      );
    });
    const loading = screen.getByText(/messaging.loading/i);
    expect(loading).toBeInTheDocument();
  });

  it('should display correct pagination', async () => {
    await act(async () => {
      render(
        <TemplateSelectTemplatePage templateName="test" />
      );
    });
    // Find all pagination navs by role and aria-label
    const paginationNavs = screen.getAllByRole('navigation', { name: 'pagination' });
    expect(paginationNavs).toHaveLength(2); // One for each list

    // Check for the ordered lists inside each nav
    paginationNavs.forEach(nav => {
      expect(nav.querySelector('ol')).toBeInTheDocument();
    });

    // My Org Templates pagination: totalCount=11, limit=5 => 3 pages
    const orgTemplatePageLinks = within(paginationNavs[0]).getAllByRole('link', { name: /Page \d+/ });
    expect(orgTemplatePageLinks).toHaveLength(3);

    // Public Templates pagination: totalCount=32, limit=5 => 7 pages
    const publicTemplatePageLinks = within(paginationNavs[1]).getAllByRole('link', { name: /Page \d+/ });
    expect(publicTemplatePageLinks).toHaveLength(7);
  });

  it('should handle click of pagination links for org section', async () => {
    await act(async () => {
      render(
        <TemplateSelectTemplatePage templateName="test" />
      );
    });

    const paginationNavs = screen.getAllByRole('navigation', { name: 'pagination' });

    // Check org templates pagination
    const page1Link = within(paginationNavs[0]).getByRole('link', { name: 'Page 1' });
    expect(page1Link).toHaveClass('current');
    const page2Link = within(paginationNavs[0]).getByRole('link', { name: 'Page 2' });
    expect(page2Link).not.toHaveClass('current');
    fireEvent.click(page2Link);

    await waitFor(() => {
      expect(page2Link).toHaveClass('current');
    });

    // Check public templates pagination
    const page1Link2 = within(paginationNavs[1]).getByRole('link', { name: 'Page 1' });
    expect(page1Link2).toHaveClass('current');
    const page2Link2 = within(paginationNavs[1]).getByRole('link', { name: 'Page 2' });
    expect(page2Link2).not.toHaveClass('current');
    fireEvent.click(page2Link2);

    await waitFor(() => {
      expect(page2Link2).toHaveClass('current');
    });
  });

  it('should match only one item when a user enters text \'Bravo\'', async () => {
    await act(async () => {
      render(
        <TemplateSelectTemplatePage templateName="test" />
      );
    });
    //Search input field
    const input = screen.getByLabelText('labels.searchByKeyword');
    const searchButton = screen.getByRole('button', { name: /search/i });

    expect(searchButton).toBeInTheDocument();
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Bravo' } });
      fireEvent.click(searchButton);
    });

    expect(screen.getByRole('heading', { name: /Test Template Bravo/i })).toBeInTheDocument();
  });

  it("Should show message when no templates were found", async () => {
    const stablePublishedTemplatesReturn = [
      mockFetchPublished,
      {
        data: { publishedTemplates: [] },
        loading: false,
        error: null
      }
    ];

    const stableTemplatesReturn = [
      mockFetchMyTemplates,
      {
        data: { myTemplates: [] },
        loading: false,
        error: null
      }
    ]

    mockUseLazyQuery.mockImplementation((document) => {
      if (document === PublishedTemplatesDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return stablePublishedTemplatesReturn as any;
      }

      if (document === TemplatesDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return stableTemplatesReturn as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    render(<TemplateSelectTemplatePage templateName="test" />);

    // Search input field
    const input = screen.getByLabelText('labels.searchByKeyword');
    const searchButton = screen.getByRole('button', { name: /search/i });

    expect(searchButton).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'none' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getAllByText('messaging.noItemsFound').length).toBeGreaterThan(0);
    });
  });

  it('should call useAddTemplateMutation when a user clicks a \'Select\' button', async () => {
    mockAddTemplateFn = jest.fn().mockResolvedValue({
      data: {
        addTemplate: {
          id: 1,
          errors: null
        }
      }
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === AddTemplateDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockAddTemplateFn, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <TemplateSelectTemplatePage templateName="test" />
      );
    });

    const selectButton = screen.getAllByRole('button', { name: /select/i });
    fireEvent.click(selectButton[0]);

    await waitFor(() => {
      expect(mockUseMutation).toHaveBeenCalled();
    });
  });

  it('should handle response errors when user clicks a \'Select\' button', async () => {
    mockAddTemplateFn = jest.fn().mockResolvedValue({
      data: {
        addTemplate: {
          id: 1,
          errors: {
            global: 'New Template, something went wrong...',
          },
        }
      }
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === AddTemplateDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockAddTemplateFn, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <TemplateSelectTemplatePage templateName="test" />
      );
    });

    const selectButton = screen.getAllByRole('button', { name: /select/i });
    fireEvent.click(selectButton[0]);

    // Wait for the mutation to be called
    await waitFor(() => {
      expect(mockUseMutation).toHaveBeenCalled();
    });
  });

  it('should log error when useAddTemplateMutation rejects with an error', async () => {
    mockAddTemplateFn = jest.fn(() => Promise.reject(new Error('Mutation failed')));

    mockUseMutation.mockImplementation((document) => {
      if (document === AddTemplateDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockAddTemplateFn, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <TemplateSelectTemplatePage templateName="test" />
      );
    });
    //Search input field
    const selectButton = screen.getAllByRole('button', { name: /Select Astronomical Sciences/i });

    await act(async () => {
      fireEvent.click(selectButton[0]);
    });

    expect(logECS).toHaveBeenCalledWith(
      'error',
      'handleClick',
      expect.objectContaining({
        error: expect.anything(),
        url: { path: '/template/create' },
      })
    )
  });

  it('should call useAddTemplateMuration when user clicks to start a new template', async () => {
    mockAddTemplateFn = jest.fn().mockResolvedValue({
      data: {
        addTemplate: {
          id: 1,
          errors: null
        }
      }
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === AddTemplateDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockAddTemplateFn, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <TemplateSelectTemplatePage templateName="test" />
      );
    });

    const selectButton = screen.getByTestId('startNewButton');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(mockUseMutation).toHaveBeenCalled();
    });
  });

  it('should handle response errors when user clicks start a new template', async () => {
    mockAddTemplateFn = jest.fn().mockResolvedValue({
      data: {
        addTemplate: {
          id: 1,
          errors: {
            global: 'New Template, something went wrong...',
          },
        },
      },
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === AddTemplateDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockAddTemplateFn, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <TemplateSelectTemplatePage templateName="test" />
      );
    });

    const selectButton = screen.getByTestId('startNewButton');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(mockUseMutation).toHaveBeenCalled();
    });
  });

  it('should handle errors when a user clicks on start a new template', async () => {
    mockAddTemplateFn = jest.fn(() => Promise.reject(new Error('Mutation failed')));

    mockUseMutation.mockImplementation((document) => {
      if (document === AddTemplateDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockAddTemplateFn, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    await act(async () => {
      render(
        <TemplateSelectTemplatePage templateName="test" />
      );
    });

    const selectButton = screen.getByTestId('startNewButton');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(mockUseMutation).toHaveBeenCalled();
    });

    expect(logECS).toHaveBeenCalledWith(
      'error',
      'handleStartNew',
      expect.objectContaining({
        error: expect.anything(),
        url: { path: '/template/create' },
      })
    )
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(<TemplateSelectTemplatePage templateName="test" />);

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
