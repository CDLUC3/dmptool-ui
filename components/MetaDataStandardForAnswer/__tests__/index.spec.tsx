import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import MetaDataStandardForAnswer from '../index';
import { MetaDataStandardInterface } from '@/app/types';
import mockMetadataStandardsData from '../__mocks__/mockMetadataStandardsData.json';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import {
  MetadataStandardsDocument,
} from '@/generated/graphql';
import mockPreferredMetadataStandardsData from '../__mocks__/mockPreferredMetadataStandardsData.json';
import { MetadataStandardsByUrIsDocument } from '@/generated/graphql';


// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ templateId: '123' })),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
  usePathname: jest.fn(() => '/'),
}));

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useLazyQuery: jest.fn(),
}));

// Mock the server action
const mockAddMetaDataStandardsAction = jest.fn();
jest.mock('@/app/actions', () => ({
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
  addMetaDataStandardsAction: (...args: any[]) => mockAddMetaDataStandardsAction(...args),
}));

// Mock ErrorMessages component
jest.mock('@/components/ErrorMessages', () => {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
  const MockErrorMessages = React.forwardRef(({ errors }: any, ref: any) => {
    if (!errors || errors.length === 0) return null;
    return (
      <div data-testid="error-messages" ref={ref}>
        {errors.map((error: string, index: number) => (
          <div key={index} data-testid="error-message">
            {error}
          </div>
        ))}
      </div>
    );
  });
  MockErrorMessages.displayName = 'MockErrorMessages';
  return MockErrorMessages;
});

// Mock Pagination component
jest.mock('@/components/Pagination', () => {
  return function MockPagination({
    currentPage,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    handlePageClick,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
  }: any) {
    return (
      <div data-testid="pagination">
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={!hasPreviousPage}
          data-testid="prev-page"
        >
          Previous
        </button>
        <span data-testid="current-page">{currentPage}</span>
        <span data-testid="total-pages">{totalPages}</span>
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={!hasNextPage}
          data-testid="next-page"
        >
          Next
        </button>
      </div>
    );
  };
});

// Mock FormInput
jest.mock('@/components/Form', () => ({
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
  FormInput: ({ label, value, onChange, isRequired, helpMessage, ...props }: any) => (
    <div data-testid={`form-input-${props.name}`}>
      <label>{label}</label>
      <input
        value={value || ''}
        onChange={onChange}
        required={isRequired}
        aria-label={label}
        {...props}
      />
      {helpMessage && <span className="help-text">{helpMessage}</span>}
    </div>
  ),
}));

// Mock Toast Context
const mockToastAdd = jest.fn();
jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(() => ({
    add: mockToastAdd,
  })),
}));

// Mock logger
jest.mock('@/utils/clientLogger', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock translations
const messages = {
  Global: {
    buttons: {
      removeAll: 'Remove All',
      remove: 'Remove',
      select: 'Select',
      closeModal: 'Close Modal',
      applyFilter: 'Apply Filter',
      cancel: 'Cancel',
    },
    labels: {
      searchTerm: 'Search Term',
      name: 'Name',
      url: 'URL',
      description: 'Description',
    },
    messaging: {
      somethingWentWrong: 'Something went wrong',
    },
  },
  QuestionAdd: {
    'researchOutput.metaDataStandards.singleMetaData': 'metadata standard',
    'researchOutput.metaDataStandards.multipleMetaData': 'metadata standards',
    'researchOutput.metaDataStandards.buttons.add': 'Add Metadata Standard',
    'researchOutput.metaDataStandards.buttons.addToTemplate': 'Add to Template',
    'researchOutput.metaDataStandards.headings.dialogHeading': 'Select Metadata Standards',
    'researchOutput.metaDataStandards.headings.addCustomHeading': 'Add Custom Metadata Standard',
    'researchOutput.metaDataStandards.selectedCount': '{count} selected',
    'researchOutput.metaDataStandards.messages.confirmRemovalAll':
      'Are you sure you want to remove all selected metadata standards?',
    'researchOutput.metaDataStandards.messages.allRemoved': 'All metadata standards removed',
    'researchOutput.metaDataStandards.messages.fillInAllFields': 'Please fill in all fields',
    'researchOutput.metaDataStandards.messages.addedSuccessfully': '{name} added successfully',
    'researchOutput.metaDataStandards.help.uri': 'Enter the URL for the metadata standard',
    "labels.preferredRepositories": "Preferred repositories only",
    "labels.preferredMetadataStandards": "Preferred metadata standards only",
    "helpText.preferredRepositories": "These repositories were set by the template creator as preferred repositories to use.",
    "helpText.preferredMetadataStandards": "These metadata standards were set by the template creator as preferred metadata standards to use."
  },
};

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider messages={messages} locale="en">
      {component}
    </NextIntlClientProvider>
  );
};

// Cast with jest.mocked utility
const mockUseLazyQuery = jest.mocked(useLazyQuery);
const mockUseQuery = jest.mocked(useQuery);

let mockFetchMetaDataStandards: jest.Mock;

const setupMocks = () => {
  // Create stable references OUTSIDE mockImplementation
  const stableMetaDataStandardURIsReturn = {
    data: mockPreferredMetadataStandardsData,
    loading: false,
    error: null,
  };

  mockUseQuery.mockImplementation((document) => {
    if (document === MetadataStandardsByUrIsDocument) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
      return stableMetaDataStandardURIsReturn as any;
    }

    return {
      data: null,
      loading: false,
      error: undefined
    };
  });

  mockFetchMetaDataStandards = jest.fn().mockResolvedValue({
    data: mockMetadataStandardsData,
  });

  const stableMetadataStandardsReturn = [
    mockFetchMetaDataStandards,
    {
      data: mockMetadataStandardsData,
      loading: false,
      error: null,
    }
  ];

  mockUseLazyQuery.mockImplementation((document) => {
    if (document === MetadataStandardsDocument) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
      return stableMetadataStandardsReturn as any;
    }

    return [
      jest.fn(),
      {
        data: null,
        loading: false,
        error: undefined
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
    ] as any;
  });
};



describe('MetaDataStandardForAnswer', () => {
  let mockOnMetaDataStandardsChange: jest.Mock;
  const user = userEvent.setup();

  beforeEach(() => {
    setupMocks(); // Call setupMocks to initialize the mocks

    mockOnMetaDataStandardsChange = jest.fn();

    mockAddMetaDataStandardsAction.mockResolvedValue({
      success: true,
      data: { errors: null },
    });

    window.confirm = jest.fn(() => true);
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render with no selected standards', async () => {
      renderWithProviders(
        <MetaDataStandardForAnswer
          value={[]}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      const span = screen.getByText(/0\s+researchOutput\.metaDataStandards\.multipleMetaData\s+selected/i);

      await waitFor(() => {
        expect(span).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /remove all/i })).not.toBeInTheDocument();
      })

    });

    it('should render with selected standards', async () => {
      const selectedStandards: MetaDataStandardInterface[] = [
        {
          id: 28,
          name: 'Terminal RI Unicamp',
          uri: 'https://repositorio.unicamp.br/',
          description: 'Institutional Repository from Unicamp',
        },
      ];

      renderWithProviders(
        <MetaDataStandardForAnswer
          value={selectedStandards}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      const span = screen.getByText(/1\s+researchOutput\.metaDataStandards\.singleMetaData\s+selected/i);
      await waitFor(() => {
        expect(span).toBeInTheDocument();
        expect(screen.getByText('Terminal RI Unicamp')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'buttons.remove' })).toBeInTheDocument();
      })

    });

    it('should render add button', async () => {
      renderWithProviders(
        <MetaDataStandardForAnswer
          value={[]}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'researchOutput.metaDataStandards.buttons.add' })).toBeInTheDocument();
      })
    });

    it('should load metadata standards when modal opens', async () => {
      renderWithProviders(
        <MetaDataStandardForAnswer
          value={[]}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      // Open the modal
      const addButton = screen.getByTestId('open-standard-modal-btn');
      await user.click(addButton);

      // Wait for modal and standards to load
      await waitFor(() => {
        expect(screen.getByText('Terminal RI Unicamp')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Interaction', () => {
    it('should open modal when add button is clicked', async () => {
      renderWithProviders(
        <MetaDataStandardForAnswer
          value={[]}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      const addLink = screen.getByText('researchOutput.metaDataStandards.buttons.add');
      await user.click(addLink);

      await waitFor(() => {
        expect(screen.getByText('researchOutput.metaDataStandards.headings.dialogHeading')).toBeInTheDocument();
      });
    });

    it('should display the preferred standards in the modal', async () => {
      render(<MetaDataStandardForAnswer onMetaDataStandardsChange={mockOnMetaDataStandardsChange} preferredMetaDataURIs={["https://repositorio.unicamp.br/"]} />);

      const addLink = screen.getByText('researchOutput.metaDataStandards.buttons.add');
      fireEvent.click(addLink);

      await waitFor(() => {
        expect(screen.getByText('researchOutput.metaDataStandards.headings.dialogHeading')).toBeInTheDocument();
      });

      // Count the number of "buttons.select" to test # of preferred metadata standards that display
      const moreInfoButtons = screen.getAllByText('buttons.select');
      expect(moreInfoButtons).toHaveLength(1);
      expect(screen.getByText('Terminal RI Unicamp')).toBeInTheDocument();

      // Check that the preferredOnly checkbox is present and checked
      const preferredOnlyCheckbox = screen.getByTestId('preferredOnlyCheckbox') as HTMLInputElement;
      expect(preferredOnlyCheckbox).toBeInTheDocument();
      expect(preferredOnlyCheckbox).toHaveAttribute('data-selected', 'true');
    });

    it('should close modal when close button is clicked', async () => {
      renderWithProviders(
        <MetaDataStandardForAnswer
          value={[]}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      const addLink = screen.getByText('researchOutput.metaDataStandards.buttons.add');
      await user.click(addLink);

      await waitFor(() => {
        expect(screen.getByText('researchOutput.metaDataStandards.headings.dialogHeading')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: 'buttons.closeModal' });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('researchOutput.metaDataStandards.headings.dialogHeading')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should update search term input', async () => {
      renderWithProviders(
        <MetaDataStandardForAnswer
          value={[]}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      const addButton = screen.getByRole('button', { name: 'researchOutput.metaDataStandards.buttons.add' });
      await user.click(addButton);

      const searchInput = screen.getByLabelText('labels.searchTerm');
      await user.type(searchInput, 'Dublin');

      expect(searchInput).toHaveValue('Dublin');
    });

    it('should trigger search when apply filter is clicked', async () => {
      renderWithProviders(
        <MetaDataStandardForAnswer
          value={[]}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      const addLink = screen.getByText('researchOutput.metaDataStandards.buttons.add');
      await user.click(addLink);

      const searchInput = screen.getByLabelText('labels.searchTerm');
      await user.type(searchInput, 'Dublin');

      const applyButton = screen.getByRole('button', { name: 'buttons.search' });
      await user.click(applyButton);

      await waitFor(() => {
        expect(mockFetchMetaDataStandards).toHaveBeenCalledWith({
          variables: {
            paginationOptions: {
              offset: 0,
              limit: 5,
              type: 'OFFSET',
              sortDir: 'DESC',
            },
            term: 'Dublin',
          },
        });
      });
    });
  });

  describe('Select/Deselect Standards', () => {
    it('should select a metadata standard', async () => {
      renderWithProviders(
        <MetaDataStandardForAnswer
          value={[]}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      const addLink = screen.getByText('researchOutput.metaDataStandards.buttons.add');
      await user.click(addLink);

      await waitFor(() => {
        expect(screen.getByText('Terminal RI Unicamp')).toBeInTheDocument();
      });

      const selectButtons = screen.getAllByRole('button', { name: 'buttons.select' });
      await user.click(selectButtons[0]);

      await waitFor(() => {
        expect(mockOnMetaDataStandardsChange).toHaveBeenCalledWith([
          {
            id: 'https://repositorio.unicamp.br/',
            name: 'Terminal RI Unicamp',
            uri: 'https://repositorio.unicamp.br/',
            description: 'Institutional Repository from Unicamp',
          },
        ]);
      });

      expect(mockToastAdd).toHaveBeenCalledWith("researchOutput.repoSelector.messages.addedItem", { type: "success" });
    });

    it('should deselect a metadata standard', async () => {
      const selectedStandards: MetaDataStandardInterface[] = [
        {
          id: 'https://repositorio.unicamp.br/',
          name: 'Terminal RI Unicamp',
          uri: 'https://repositorio.unicamp.br/',
          description: 'Institutional Repository from Unicamp',
        },
      ];

      renderWithProviders(
        <MetaDataStandardForAnswer
          value={selectedStandards}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      const addLink = screen.getByText('researchOutput.metaDataStandards.buttons.add');
      await user.click(addLink);

      await waitFor(() => {
        const terminalRI = screen.getAllByText('Terminal RI Unicamp');
        expect(terminalRI[0]).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByRole('button', { name: 'buttons.remove' });
      // Find the remove button in the search results (not in the selected list)
      const searchResultRemoveBtn = removeButtons.find(btn =>
        btn.closest('.searchResultItem') !== null
      );

      if (searchResultRemoveBtn) {
        await user.click(searchResultRemoveBtn);
      }

      await waitFor(() => {
        expect(mockOnMetaDataStandardsChange).toHaveBeenCalledWith([]);
      });

      expect(mockToastAdd).toHaveBeenCalledWith("researchOutput.repoSelector.messages.removedItem", { type: "success" });
    });
  });

  describe('Remove Standards', () => {
    it('should remove single standard from selected list', async () => {
      const selectedStandards: MetaDataStandardInterface[] = [
        {
          id: 'https://repositorio.unicamp.br/',
          name: 'Terminal RI Unicamp',
          uri: 'https://repositorio.unicamp.br/',
          description: 'Institutional Repository from Unicamp',
        },
        {
          id: 'https://stac-extensions.github.io/version/v1.2.0/schema.json',
          name: 'STAC 1.2.0',
          uri: 'https://stac-extensions.github.io/version/v1.2.0/schema.json',
          description: 'STAC Versioning Indicators Extension',
        },
      ];

      renderWithProviders(
        <MetaDataStandardForAnswer
          value={selectedStandards}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      expect(screen.getByText('Terminal RI Unicamp')).toBeInTheDocument();
      expect(screen.getByText('STAC 1.2.0')).toBeInTheDocument();

      const removeButtons = screen.getAllByRole('button', { name: 'buttons.remove' });
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(mockOnMetaDataStandardsChange).toHaveBeenCalledWith([
          {
            id: 'https://stac-extensions.github.io/version/v1.2.0/schema.json',
            name: 'STAC 1.2.0',
            uri: 'https://stac-extensions.github.io/version/v1.2.0/schema.json',
            description: 'STAC Versioning Indicators Extension',
          },
        ]);
      });

      expect(mockToastAdd).toHaveBeenCalledWith('Terminal RI Unicamp removed', { type: 'success' });
    });

    it('should remove all standards when remove all is clicked', async () => {
      const selectedStandards: MetaDataStandardInterface[] = [
        {
          id: 28,
          name: 'Terminal RI Unicamp',
          uri: 'https://repositorio.unicamp.br/',
          description: 'Institutional Repository from Unicamp',
        },
        {
          id: 18,
          name: 'STAC 1.2.0',
          uri: 'https://stac-extensions.github.io/version/v1.2.0/schema.json',
          description: 'STAC Versioning Indicators Extension',
        },
      ];

      renderWithProviders(
        <MetaDataStandardForAnswer
          value={selectedStandards}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      const removeAllButton = screen.getByRole('button', { name: 'buttons.removeAll' });
      await user.click(removeAllButton);

      await waitFor(() => {
        expect(mockOnMetaDataStandardsChange).toHaveBeenCalledWith([]);
      });

      expect(mockToastAdd).toHaveBeenCalledWith('researchOutput.metaDataStandards.messages.allRemoved', {
        type: 'success',
      });
    });
  });

  describe('Add Custom Standard', () => {
    it('should show custom form when add button in modal is clicked', async () => {
      renderWithProviders(
        <MetaDataStandardForAnswer
          value={[]}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      const addButton = screen.getByTestId('open-standard-modal-btn');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('researchOutput.metaDataStandards.headings.dialogHeading')).toBeInTheDocument();
      });

      // Wait for the link to be available
      const modal = screen.getByTestId('modal');
      const addLinkInModal = await waitFor(() => within(modal).getByText('researchOutput.metaDataStandards.buttons.add'));

      await user.click(addLinkInModal);

      await waitFor(() => {
        expect(screen.getByText('researchOutput.metaDataStandards.headings.addCustomHeading')).toBeInTheDocument();
      });
    });

    it('should add custom standard successfully', async () => {
      renderWithProviders(
        <MetaDataStandardForAnswer
          value={[]}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      const addButton = screen.getByTestId('open-standard-modal-btn');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('researchOutput.metaDataStandards.headings.dialogHeading')).toBeInTheDocument();
      });

      // Wait for the link to be available
      const modal = screen.getByTestId('modal');
      const addLinkInModal = await waitFor(() => within(modal).getByText('researchOutput.metaDataStandards.buttons.add'));

      await user.click(addLinkInModal);
      await waitFor(() => {
        expect(screen.getByText('researchOutput.metaDataStandards.headings.addCustomHeading')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('labels.name');
      const urlInput = screen.getByLabelText('labels.url');
      const descInput = screen.getByLabelText('labels.description');

      await user.type(nameInput, 'Custom Standard');
      await user.type(urlInput, 'https://custom.org');
      await user.type(descInput, 'Custom description');

      const addToTemplateButton = screen.getByTestId('add-custom-std-btn');
      await user.click(addToTemplateButton);

      await waitFor(() => {
        expect(mockAddMetaDataStandardsAction).toHaveBeenCalledWith({
          name: 'Custom Standard',
          description: 'Custom description',
          uri: 'https://custom.org',
        });
      });

      await waitFor(() => {
        expect(mockOnMetaDataStandardsChange).toHaveBeenCalledWith([
          {
            id: 'https://custom.org',
            name: 'Custom Standard',
            uri: 'https://custom.org',
            description: 'Custom description',
          },
        ]);
      });

      expect(mockToastAdd).toHaveBeenCalledWith('researchOutput.metaDataStandards.messages.addedSuccessfully', {
        type: 'success',
      });
    });

    it('should show error when required fields are missing', async () => {
      renderWithProviders(
        <MetaDataStandardForAnswer
          value={[]}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      const addButton = screen.getByTestId('open-standard-modal-btn');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('researchOutput.metaDataStandards.headings.dialogHeading')).toBeInTheDocument();
      });


      // Wait for the link to be available
      const modal = screen.getByTestId('modal');
      const addLinkInModal = await waitFor(() => within(modal).getByText('researchOutput.metaDataStandards.buttons.add'));
      await user.click(addLinkInModal);
      await waitFor(() => {
        expect(screen.getByText('researchOutput.metaDataStandards.headings.addCustomHeading')).toBeInTheDocument();
      });

      const addToTemplateButton = screen.getByTestId('add-custom-std-btn');
      await user.click(addToTemplateButton);

      await waitFor(() => {
        expect(mockToastAdd).toHaveBeenCalledWith('researchOutput.metaDataStandards.messages.fillInAllFields', { type: 'error' });
      });

      expect(mockAddMetaDataStandardsAction).not.toHaveBeenCalled();
    });

    it('should cancel custom form', async () => {
      renderWithProviders(
        <MetaDataStandardForAnswer
          value={[]}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      const addButton = screen.getByTestId('open-standard-modal-btn');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('researchOutput.metaDataStandards.headings.dialogHeading')).toBeInTheDocument();
      });


      // Wait for the link to be available
      const modal = screen.getByTestId('modal');
      const addLinkInModal = await waitFor(() => within(modal).getByText('researchOutput.metaDataStandards.buttons.add'));
      await user.click(addLinkInModal);

      await waitFor(() => {
        expect(screen.getByText('researchOutput.metaDataStandards.headings.addCustomHeading')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: 'buttons.cancel' });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('researchOutput.metaDataStandards.headings.addCustomHeading')).not.toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should handle page navigation', async () => {
      renderWithProviders(
        <MetaDataStandardForAnswer
          value={[]}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      const addButton = screen.getByTestId('open-standard-modal-btn');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId('next-page');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockFetchMetaDataStandards).toHaveBeenCalledWith({
          variables: {
            paginationOptions: {
              offset: 5,
              limit: 5,
              type: 'OFFSET',
              sortDir: 'DESC',
            },
            term: '',
          },
        });
      });
    });

    it('should display pagination info', async () => {

      const stableMetadataStandardsReturn = [
        mockFetchMetaDataStandards,
        {
          data: {
            metadataStandards: {
              __typename: 'MetadataStandardSearchResults',
              items: mockMetadataStandardsData.metadataStandards.items,
              totalCount: 1,
              hasNextPage: true,
              hasPreviousPage: false,
              currentOffset: 0,
              limit: 5,
              nextCursor: null,
              availableSortFields: ['m.name', 'm.created'],
            },
          },
          loading: false,
          error: null,
        }
      ];

      mockUseLazyQuery.mockImplementation((document) => {
        if (document === MetadataStandardsDocument) {
          return stableMetadataStandardsReturn as any;
        }

        return {
          data: null,
          loading: false,
          error: undefined
        };
      });

      renderWithProviders(
        <MetaDataStandardForAnswer
          value={[]}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      const addButton = screen.getByTestId('open-standard-modal-btn');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('labels.displayPaginationCount')).toBeInTheDocument();
      });
    });
  });

  describe('Selected Count Display', () => {
    it('should display correct count for single standard', async () => {
      const selectedStandards: MetaDataStandardInterface[] = [
        {
          id: 28,
          name: 'Terminal RI Unicamp',
          uri: 'https://repositorio.unicamp.br/',
          description: 'Institutional Repository from Unicamp',
        },
      ];

      renderWithProviders(
        <MetaDataStandardForAnswer
          value={selectedStandards}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/1 researchOutput.metaDataStandards.singleMetaData selected/i)).toBeInTheDocument();
      })
    });

    it('should display correct count for multiple standards', async () => {
      const selectedStandards: MetaDataStandardInterface[] = [
        {
          id: 28,
          name: 'Terminal RI Unicamp',
          uri: 'https://repositorio.unicamp.br/',
          description: 'Institutional Repository from Unicamp',
        },
        {
          id: 18,
          name: 'STAC 1.2.0',
          uri: 'https://stac-extensions.github.io/version/v1.2.0/schema.json',
          description: 'STAC Versioning Indicators Extension',
        },
      ];

      renderWithProviders(
        <MetaDataStandardForAnswer
          value={selectedStandards}
          onMetaDataStandardsChange={mockOnMetaDataStandardsChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/2 researchOutput.metaDataStandards.multipleMetaData selected/i)).toBeInTheDocument();
      });
    });
  });
});