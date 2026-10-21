import React from 'react';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import RepoSelectorForAnswer from '../index';
import { useToast } from '@/context/ToastContext';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import {
  Re3RepositoryTypesListDocument,
  Re3SubjectListDocument,
  Re3byUrIsDocument,
  RepositoriesDocument,
} from '@/generated/graphql';
import { addRepositoryAction } from '@/app/actions/addRepositoryAction';
import mockRepositoriesData from '../__mocks__/mockRepositoriesData.json';
import mockSubjectAreasData from '../__mocks__/mockRepoSubjectAreasData.json';
import mockPreferredRepositoriesData from '../__mocks__/mockPreferredRepositoriesData.json';
import mockRepositoryTypesData from '../__mocks__/mockRepositoryTypesData.json';
import mockValue from '../__mocks__/mockValue.json';

// Mocks
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/'),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => jest.fn((key) => key)),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/generated/graphql', () => ({
  ...jest.requireActual("@/generated/graphql"),
  RepositoryType: {
    INSTITUTIONAL: 'INSTITUTIONAL',
    DISCIPLINARY: 'DISCIPLINARY',
    OTHER: 'OTHER',
  },
}));

jest.mock('@/app/actions/addRepositoryAction', () => ({
  addRepositoryAction: jest.fn(),
}));

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useLazyQuery: jest.fn(),
}));

jest.mock('@/utils/clientLogger', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/utils/routes', () => ({
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
  routePath: jest.fn((path: string, params: any) => `/template/${params.templateId}/question/new`),
}));

// Cast with jest.mocked utility
const mockUseQuery = jest.mocked(useQuery);
const mockUseLazyQuery = jest.mocked(useLazyQuery);
const mockFetchRepositories = jest.fn().mockResolvedValue({
  data: mockRepositoriesData
});

const setupMocks = () => {
  const stableRepositoriesSubjectAreasReturn = {
    data: mockSubjectAreasData,
    loading: false,
    error: null,
  };

  const stableRepositoriesURIsReturn = {
    data: mockPreferredRepositoriesData,
    loading: false,
    error: null,
  };

  const stableRepositoryTypesReturn = {
    data: mockRepositoryTypesData,
    loading: false,
    error: null,
  };
  mockUseQuery.mockImplementation((document) => {
    if (document === Re3SubjectListDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return stableRepositoriesSubjectAreasReturn as any;
    }

    if (document === Re3byUrIsDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return stableRepositoriesURIsReturn as any;
    }

    if (document === Re3RepositoryTypesListDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return stableRepositoryTypesReturn as any;
    }
    return {
      data: null,
      loading: false,
      error: undefined
    };
  });

  // Lazy query mocks
  const stableRepositoriesReturn = [
    mockFetchRepositories,
    { data: mockRepositoriesData, loading: false, error: null }
  ]

  mockUseLazyQuery.mockImplementation((document) => {
    if (document === RepositoriesDocument) {
      return stableRepositoriesReturn as any;
    }

    return {
      data: null,
      loading: false,
      error: undefined
    };
  });
};

describe('RepoSelectorForAnswer', () => {
  const mockOnRepositoriesChange = jest.fn();
  const mockAddToast = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    setupMocks();
    jest.clearAllMocks();
    cleanup();

    // Mock scrollIntoView globally for all elements
    window.HTMLElement.prototype.scrollIntoView = jest.fn();

    (useParams as jest.Mock).mockReturnValue({ templateId: '123' });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useToast as jest.Mock).mockReturnValue({ add: mockAddToast });
  });

  afterEach(() => {
    cleanup();
  })

  describe('Initial Rendering', () => {
    it('should render the "Add Repository" button', async () => {
      render(<RepoSelectorForAnswer onRepositoriesChange={mockOnRepositoriesChange} />);

      // Wait for the initial data fetch to complete
      await waitFor(() => {
        expect(screen.getByText('researchOutput.repoSelector.buttons.addRepo')).toBeInTheDocument();

      })
    });

    it('should not display selected repositories initially when value is empty', async () => {
      render(<RepoSelectorForAnswer value={[]} onRepositoriesChange={mockOnRepositoriesChange} />);

      await waitFor(() => {
        expect(screen.queryByText('buttons.removeAll')).not.toBeInTheDocument();
      })
    });

    it('should display selected repositories when value prop is provided', async () => {
      render(<RepoSelectorForAnswer value={mockValue} onRepositoriesChange={mockOnRepositoriesChange} />);

      await waitFor(() => {
        expect(screen.getByText('Zenodo')).toBeInTheDocument();
        expect(screen.getByText('buttons.removeAll')).toBeInTheDocument();
      })
    });

    it('should fetch repositories on initial load', async () => {
      render(<RepoSelectorForAnswer onRepositoriesChange={mockOnRepositoriesChange} />);

      await waitFor(() => {
        expect(mockFetchRepositories).toHaveBeenCalledWith({
          variables: {
            input: {
              paginationOptions: {
                offset: 0,
                limit: 5,
                type: "OFFSET",
                sortDir: "DESC",
              },
              term: '',
              repositoryType: null,
              subjects: null,
            }
          }
        });
      });
    })
  });

  describe('Modal Interaction', () => {
    it('should open modal when "Add Repository" button is clicked', async () => {
      render(<RepoSelectorForAnswer onRepositoriesChange={mockOnRepositoriesChange} />);

      const addButton = screen.getByText('researchOutput.repoSelector.buttons.addRepo');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('researchOutput.repoSelector.headings.repoSearch')).toBeInTheDocument();
      });
    });

    it('should display the preferred repositories in the modal', async () => {
      render(<RepoSelectorForAnswer onRepositoriesChange={mockOnRepositoriesChange} preferredReposURIs={["https://www.re3data.org/repository/https://www.re3data.org/api/v1/repository/r3d100010468"]} />);

      const addButton = screen.getByText('researchOutput.repoSelector.buttons.addRepo');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('researchOutput.repoSelector.headings.repoSearch')).toBeInTheDocument();
      });

      // Count the number of "buttons.moreInfo" to test # of preferred repositories that display
      const moreInfoButtons = screen.getAllByText('buttons.moreInfo');
      expect(moreInfoButtons).toHaveLength(2);
      expect(screen.getByText('Zenodo')).toBeInTheDocument();

      // Check that the preferredOnly checkbox is present and checked
      const preferredOnlyCheckbox = screen.getByTestId('preferredOnlyCheckbox') as HTMLInputElement;
      expect(preferredOnlyCheckbox).toBeInTheDocument();
      expect(preferredOnlyCheckbox).toHaveAttribute('data-selected', 'true');
    });

    it('should close modal when close button is clicked', async () => {
      render(<RepoSelectorForAnswer onRepositoriesChange={mockOnRepositoriesChange} />);

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addRepo'));

      await waitFor(() => {
        expect(screen.getByText('researchOutput.repoSelector.headings.repoSearch')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('buttons.closeModal');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('researchOutput.repoSelector.headings.repoSearch')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should update search term when typing in search field', async () => {
      const user = userEvent.setup();
      render(<RepoSelectorForAnswer onRepositoriesChange={mockOnRepositoriesChange} />);

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addRepo'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g. DNA, titanium, FAIR, etc.')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('e.g. DNA, titanium, FAIR, etc.');
      await user.type(searchInput, 'FAIR');

      expect(searchInput).toHaveValue('FAIR');
    });

    it('should fetch repositories when Apply Filter is clicked', async () => {
      render(<RepoSelectorForAnswer onRepositoriesChange={mockOnRepositoriesChange} />);

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addRepo'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g. DNA, titanium, FAIR, etc.')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('e.g. DNA, titanium, FAIR, etc.');
      fireEvent.change(searchInput, { target: { value: 'FAIR' } });

      const applyButton = screen.getByText('buttons.applyFilter');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(mockFetchRepositories).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                term: 'FAIR',
              })
            })
          })
        );
      });
    });
  });

  describe('Repository Selection', () => {
    it('should call onRepositoriesChange when selecting a repository', async () => {
      render(<RepoSelectorForAnswer value={[]} onRepositoriesChange={mockOnRepositoriesChange} />);

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addRepo'));

      await waitFor(() => {
        const selectButtons = screen.getAllByText('buttons.select');
        expect(selectButtons.length).toBeGreaterThan(0);
      });

      const selectButtons = screen.getAllByText('buttons.select');
      fireEvent.click(selectButtons[0]);

      expect(mockOnRepositoriesChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Zenodo',
            uri: 'https://www.re3data.org/repository/https://www.re3data.org/api/v1/repository/r3d100010468'
          })
        ])
      );
    });

    it('should call onRepositoriesChange when deselecting a repository', async () => {
      // Render with Zenodo already selected
      render(<RepoSelectorForAnswer value={mockValue} onRepositoriesChange={mockOnRepositoriesChange} />);

      // Open the modal
      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addRepo'));

      // Wait for modal to open and find the remove button
      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
      });

      // Since Zenodo is already selected, it should show "buttons.remove"
      // Get all remove buttons in the modal
      const modal = screen.getByRole('dialog');
      const removeButtons = within(modal).getAllByText('buttons.remove');

      // Click the first remove button (should be Zenodo's)
      fireEvent.click(removeButtons[0]);

      // Verify the callback was called with an empty array (repository removed)
      expect(mockOnRepositoriesChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Remove Functionality', () => {
    it('should remove a single repository and show toast', async () => {
      render(<RepoSelectorForAnswer value={mockValue} onRepositoriesChange={mockOnRepositoriesChange} />);

      const removeButton = screen.getByText('buttons.remove');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(mockOnRepositoriesChange).toHaveBeenCalledWith([]);
        expect(mockAddToast).toHaveBeenCalled();
      })

    });

    it('should remove all repositories with confirmation', async () => {

      render(<RepoSelectorForAnswer value={mockValue} onRepositoriesChange={mockOnRepositoriesChange} />);

      const removeAllButton = screen.getByText('buttons.removeAll');
      fireEvent.click(removeAllButton);

      await waitFor(() => {
        expect(mockOnRepositoriesChange).toHaveBeenCalledWith([]);
        expect(mockAddToast).toHaveBeenCalled();
      })

    });
  });

  describe('Custom Repository Form', () => {
    it('should show custom repository form when "Add Custom Repository" is clicked', async () => {
      render(<RepoSelectorForAnswer onRepositoriesChange={mockOnRepositoriesChange} />);

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addRepo'));

      await waitFor(() => {
        expect(screen.getByText('researchOutput.repoSelector.buttons.addCustomRepo')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addCustomRepo'));

      await waitFor(() => {
        expect(screen.getByText('researchOutput.repoSelector.headings.addNewRepo')).toBeInTheDocument();
      });
    });

    it('should hide custom repository form when Cancel is clicked', async () => {
      render(<RepoSelectorForAnswer onRepositoriesChange={mockOnRepositoriesChange} />);

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addRepo'));

      await waitFor(() => {
        expect(screen.getByText('researchOutput.repoSelector.buttons.addCustomRepo')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addCustomRepo'));

      await waitFor(() => {
        expect(screen.getByText('researchOutput.repoSelector.headings.addNewRepo')).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByText('buttons.cancel');
      fireEvent.click(cancelButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('researchOutput.repoSelector.headings.addNewRepo')).not.toBeInTheDocument();
      });
    });

    it('should show error if custom repository fields are empty', async () => {
      render(<RepoSelectorForAnswer onRepositoriesChange={mockOnRepositoriesChange} />);

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addRepo'));

      await waitFor(() => {
        expect(screen.getByText('researchOutput.repoSelector.buttons.addCustomRepo')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addCustomRepo'));

      await waitFor(() => {
        expect(screen.getByText('researchOutput.repoSelector.headings.addNewRepo')).toBeInTheDocument();
      });

      // Find all "Add Repository" buttons and click the one in the form
      const addRepoButtons = screen.getAllByText('researchOutput.repoSelector.buttons.addRepository');
      const formAddButton = addRepoButtons[addRepoButtons.length - 1];

      fireEvent.click(formAddButton);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          'researchOutput.repoSelector.errors.customRepoError',
          { type: 'error' }
        );
      });
    });

    it('should successfully add custom repository', async () => {
      (addRepositoryAction as jest.Mock).mockResolvedValue({
        success: true,
        data: { uri: 'https://custom-repo.com' },
      });

      render(<RepoSelectorForAnswer value={[]} onRepositoriesChange={mockOnRepositoriesChange} />);

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addRepo'));

      await waitFor(() => {
        expect(screen.getByText('researchOutput.repoSelector.buttons.addCustomRepo')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addCustomRepo'));

      await waitFor(() => {
        expect(screen.getByText('researchOutput.repoSelector.headings.addNewRepo')).toBeInTheDocument();
      });

      // Fill in the form
      const nameInput = screen.getByTestId('form-input-repo-name');
      const urlInput = screen.getByTestId('form-input-repo-url');
      const descInput = screen.getByTestId('form-input-repo-description');

      fireEvent.change(nameInput, { target: { value: 'My Custom Repo' } });
      fireEvent.change(urlInput, { target: { value: 'https://custom-repo.com' } });
      fireEvent.change(descInput, { target: { value: 'Custom repository description' } });

      // Submit the form
      const addRepoButtons = screen.getAllByText('researchOutput.repoSelector.buttons.addRepository');
      const formAddButton = addRepoButtons[addRepoButtons.length - 1];
      fireEvent.click(formAddButton);

      await waitFor(() => {
        expect(addRepositoryAction).toHaveBeenCalledWith({
          name: 'My Custom Repo',
          description: 'Custom repository description',
          website: 'https://custom-repo.com',
        });
      });

      await waitFor(() => {
        expect(mockOnRepositoriesChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'My Custom Repo',
              uri: 'https://custom-repo.com',
            })
          ])
        );
      });

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalled();
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination information', async () => {
      render(<RepoSelectorForAnswer onRepositoriesChange={mockOnRepositoriesChange} />);

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addRepo'));

      await waitFor(() => {
        expect(screen.getByText(/headings.displayingRepositoriesStatus/i)).toBeInTheDocument();
      });
    });
  });

  describe('Repository Details', () => {
    it('should expand repository details when "More Info" is clicked', async () => {
      render(<RepoSelectorForAnswer onRepositoriesChange={mockOnRepositoriesChange} />);

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addRepo'));

      await waitFor(() => {
        const moreInfoButtons = screen.getAllByText('buttons.moreInfo');
        expect(moreInfoButtons.length).toBeGreaterThan(0);
      });

      const moreInfoButtons = screen.getAllByText('buttons.moreInfo');
      fireEvent.click(moreInfoButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('researchOutput.repoSelector.descriptions.repoTitle')).toBeInTheDocument();
      });
    });

    it('should collapse repository details when "Less Info" is clicked', async () => {
      render(<RepoSelectorForAnswer onRepositoriesChange={mockOnRepositoriesChange} />);

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addRepo'));

      await waitFor(() => {
        const moreInfoButtons = screen.getAllByText('buttons.moreInfo');
        expect(moreInfoButtons.length).toBeGreaterThan(0);
      });

      const moreInfoButtons = screen.getAllByText('buttons.moreInfo');
      fireEvent.click(moreInfoButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('buttons.lessInfo')).toBeInTheDocument();
      });

      const lessInfoButton = screen.getByText('buttons.lessInfo');
      fireEvent.click(lessInfoButton);

      await waitFor(() => {
        expect(screen.queryByText('researchOutput.repoSelector.descriptions.repoTitle')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle custom repository creation errors', async () => {
      (addRepositoryAction as jest.Mock).mockResolvedValue({
        success: false,
        errors: ['Failed to create repository'],
      });

      render(<RepoSelectorForAnswer onRepositoriesChange={mockOnRepositoriesChange} />);

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addRepo'));

      await waitFor(() => {
        expect(screen.getByText('researchOutput.repoSelector.buttons.addCustomRepo')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('researchOutput.repoSelector.buttons.addCustomRepo'));

      await waitFor(() => {
        expect(screen.getByText('researchOutput.repoSelector.headings.addNewRepo')).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId('form-input-repo-name');
      const urlInput = screen.getByTestId('form-input-repo-url');
      const descInput = screen.getByTestId('form-input-repo-description');

      fireEvent.change(nameInput, { target: { value: 'My Custom Repo' } });
      fireEvent.change(urlInput, { target: { value: 'https://custom-repo.com' } });
      fireEvent.change(descInput, { target: { value: 'Custom repository description' } });

      const addRepoButtons = screen.getAllByText('researchOutput.repoSelector.buttons.addRepository');
      const formAddButton = addRepoButtons[addRepoButtons.length - 1];
      fireEvent.click(formAddButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create repository')).toBeInTheDocument();
      });
    });
  });
});