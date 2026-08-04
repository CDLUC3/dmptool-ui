import { renderHook, act, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { ReactNode } from 'react';
import { useCollaboratorSearch } from '../useCollaboratorSearch';
import { FindCollaboratorDocument, CollaboratorSearchResult } from '@/generated/graphql';

// Mock translations
const mockTranslation = jest.fn((key: string) => key);

jest.mock('next-intl', () => ({
  useTranslations: () => mockTranslation,
}));

// Test data
const mockCollaboratorResults: CollaboratorSearchResult[] = [
  {
    id: 1,
    givenName: 'John',
    surName: 'Doe',
    email: 'john.doe@example.com',
    affiliationId: '123',
    affiliationName: 'Example University',
    affiliationRORId: 'https://ror.org/123456789',
    affiliationURL: null,
    orcid: 'https://orcid.org/0000-0000-0000-0000',
  },
  {
    id: 2,
    givenName: 'Jane',
    surName: 'Smith',
    email: 'jane.smith@example.com',
    affiliationId: '123',
    affiliationName: 'Another University',
    affiliationRORId: 'https://ror.org/987654321',
    affiliationURL: null,
    orcid: null,
  },
];

// Mock GraphQL responses
const successMocks = [
  {
    request: {
      query: FindCollaboratorDocument,
      variables: {
        term: 'john',
      },
    },
    result: {
      data: {
        findCollaborator: {
          __typename: 'CollaboratorSearchResults',
          limit: 5,
          items: mockCollaboratorResults,
          availableSortFields: [],
          nextCursor: null,
          totalCount: 2,
        },
      },
    },
  },
];

const emptyResultsMocks = [
  {
    request: {
      query: FindCollaboratorDocument,
      variables: {
        term: 'nonexistent',
      },
    },
    result: {
      data: {
        findCollaborator: {
          __typename: 'CollaboratorSearchResults',
          limit: 5,
          items: [],
          availableSortFields: [],
          nextCursor: null,
          totalCount: 0,
        },
      },
    },
  },
];

const errorMocks = [
  {
    request: {
      query: FindCollaboratorDocument,
      variables: {
        term: 'error',
      },
    },
    error: new Error('Network error'),
  },
];

const loadingMocks = [
  {
    request: {
      query: FindCollaboratorDocument,
      variables: {
        term: 'loading',
      },
    },
    delay: 1000, // Simulate network delay
    result: {
      data: {
        findCollaborator: {
          __typename: 'CollaboratorSearchResults',
          limit: 5,
          items: mockCollaboratorResults,
          availableSortFields: [],
          nextCursor: null,
          totalCount: 2,
        },
      },
    },
  },
];

// Test wrapper component
interface WrapperProps {
  children: ReactNode;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  mocks?: any[];
}

const createWrapper = (mocks: any[] = []) => {
  const Wrapper = ({ children }: WrapperProps) => (
    <MockedProvider mocks={mocks}>
      {children}
    </MockedProvider>
  );
  return Wrapper;
};

describe('useCollaboratorSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTranslation.mockImplementation((key: string) => key);
  });

  describe('Initial State', () => {
    it('should return initial state correctly', () => {
      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(),
      });

      expect(result.current.term).toBe('');
      expect(result.current.results).toEqual([]);
      expect(result.current.isSearching).toBe(false);
      expect(result.current.errors).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('should provide expected function signatures', () => {
      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.setSearchTerm).toBe('function');
      expect(typeof result.current.handleMemberSearch).toBe('function');
      expect(typeof result.current.clearSearch).toBe('function');
    });
  });

  describe('setSearchTerm', () => {
    it('should update search term and reset other state', () => {
      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSearchTerm('john doe');
      });

      expect(result.current.term).toBe('john doe');
      expect(result.current.results).toEqual([]);
      expect(result.current.isSearching).toBe(false);
      expect(result.current.errors).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('should trim whitespace from search term', () => {
      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSearchTerm('  john doe  ');
      });

      expect(result.current.term).toBe('john doe');
    });

    it('should handle empty string', () => {
      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSearchTerm('');
      });

      expect(result.current.term).toBe('');
    });
  });

  describe('handleMemberSearch', () => {
    it('should show error when search term is empty', async () => {
      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.handleMemberSearch();
      });

      expect(result.current.errors).toContain('messaging.errors.searchTermRequired');
      expect(mockTranslation).toHaveBeenCalledWith('messaging.errors.searchTermRequired');
    });

    it('should show error when search term is only whitespace', async () => {
      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSearchTerm('   ');
      });

      await act(async () => {
        await result.current.handleMemberSearch();
      });

      expect(result.current.errors).toContain('messaging.errors.searchTermRequired');
    });

    it('should set loading state during search', async () => {
      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(loadingMocks),
      });

      act(() => {
        result.current.setSearchTerm('loading');
      });

      act(() => {
        result.current.handleMemberSearch();
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.isSearching).toBe(true);
      expect(result.current.errors).toEqual([]);
    });

    it('should perform successful search and update results', async () => {
      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(successMocks),
      });

      act(() => {
        result.current.setSearchTerm('john');
      });

      await act(async () => {
        await result.current.handleMemberSearch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isSearching).toBe(true);
        expect(result.current.results).toEqual(mockCollaboratorResults);
        expect(result.current.errors).toEqual([]);
      });
    });

    it('should fall back to the search term when results omit ORCID', async () => {
      const orcidMocks = [
        {
          request: {
            query: FindCollaboratorDocument,
            variables: {
              term: '0000-0002-1825-0097',
            },
          },
          result: {
            data: {
              findCollaborator: {
                __typename: 'CollaboratorSearchResults',
                limit: 5,
                items: [{
                  ...mockCollaboratorResults[0],
                  orcid: null,
                }],
                availableSortFields: [],
                nextCursor: null,
                totalCount: 1,
              },
            },
          },
        },
      ];

      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(orcidMocks),
      });

      act(() => {
        result.current.setSearchTerm('0000-0002-1825-0097');
      });

      await act(async () => {
        await result.current.handleMemberSearch();
      });

      await waitFor(() => {
        expect(result.current.results[0]?.orcid).toBe('0000-0002-1825-0097');
      });
    });

    it('should convert search term to lowercase when making API call', async () => {
      const upperCaseMocks = [
        {
          request: {
            query: FindCollaboratorDocument,
            variables: {
              term: 'john', // Expected lowercase
            },
          },
          result: {
            data: {
              findCollaborator: {
                __typename: 'CollaboratorSearchResults',
                limit: 5,
                items: mockCollaboratorResults,
                availableSortFields: [],
                nextCursor: null,
                totalCount: 2,
              },
            },
          },
        },
      ];

      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(upperCaseMocks),
      });

      act(() => {
        result.current.setSearchTerm('JOHN'); // Uppercase input
      });

      await act(async () => {
        await result.current.handleMemberSearch();
      });

      await waitFor(() => {
        expect(result.current.results).toEqual(mockCollaboratorResults);
      });
    });

    it('should handle empty search results', async () => {
      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(emptyResultsMocks),
      });

      act(() => {
        result.current.setSearchTerm('nonexistent');
      });

      await act(async () => {
        await result.current.handleMemberSearch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isSearching).toBe(false);
        expect(result.current.results).toEqual([]);
        expect(result.current.errors).toContain('messaging.noSearchResultsFound');
        expect(mockTranslation).toHaveBeenCalledWith('messaging.noSearchResultsFound');
      });
    });

    it('should filter out null items from results', async () => {
      const mocksWithNulls = [
        {
          request: {
            query: FindCollaboratorDocument,
            variables: {
              term: 'john',
            },
          },
          result: {
            data: {
              findCollaborator: {
                __typename: 'CollaboratorSearchResults',
                limit: 5,
                items: [mockCollaboratorResults[0], null, mockCollaboratorResults[1], null],
                availableSortFields: [],
                nextCursor: null,
                totalCount: 2,
              },
            },
          },
        },
      ];

      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(mocksWithNulls),
      });

      act(() => {
        result.current.setSearchTerm('john');
      });

      await act(async () => {
        await result.current.handleMemberSearch();
      });

      await waitFor(() => {
        expect(result.current.results).toEqual(mockCollaboratorResults);
        expect(result.current.results).toHaveLength(2);
      });
    });
  });

  describe('clearSearch', () => {
    it('should reset all state to initial values', async () => {
      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(successMocks),
      });

      // First perform a search to populate state
      act(() => {
        result.current.setSearchTerm('john');
      });

      await act(async () => {
        await result.current.handleMemberSearch();
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(2);
      });

      // Now clear the search
      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.term).toBe('');
      expect(result.current.results).toEqual([]);
      expect(result.current.isSearching).toBe(false);
      expect(result.current.errors).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(errorMocks),
      });

      act(() => {
        result.current.setSearchTerm('error');
      });

      await act(async () => {
        await result.current.handleMemberSearch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isSearching).toBe(false);
        expect(result.current.errors).toContain('messaging.errors.searchLookupFailed');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete search workflow', async () => {
      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(successMocks),
      });

      // Initial state
      expect(result.current.term).toBe('');
      expect(result.current.results).toEqual([]);

      // Set search term
      act(() => {
        result.current.setSearchTerm('john');
      });
      expect(result.current.term).toBe('john');

      // Perform search
      await act(async () => {
        await result.current.handleMemberSearch();
      });

      await waitFor(() => {
        expect(result.current.results).toEqual(mockCollaboratorResults);
        expect(result.current.isSearching).toBe(true);
        expect(result.current.loading).toBe(false);
      });

      // Clear search
      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.term).toBe('');
      expect(result.current.results).toEqual([]);
      expect(result.current.isSearching).toBe(false);
    });

    it('should handle multiple consecutive searches', async () => {
      const multipleMocks = [...successMocks, ...emptyResultsMocks];
      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(multipleMocks),
      });

      // First search with results
      act(() => {
        result.current.setSearchTerm('john');
      });

      await act(async () => {
        await result.current.handleMemberSearch();
      });

      await waitFor(() => {
        expect(result.current.results).toEqual(mockCollaboratorResults);
      });

      // Second search with no results
      act(() => {
        result.current.setSearchTerm('nonexistent');
      });

      await act(async () => {
        await result.current.handleMemberSearch();
      });

      await waitFor(() => {
        expect(result.current.results).toEqual([]);
        expect(result.current.errors).toContain('messaging.noSearchResultsFound');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined data response', async () => {
      const undefinedDataMocks = [
        {
          request: {
            query: FindCollaboratorDocument,
            variables: {
              term: 'undefined',
            },
          },
          result: {
            data: {
              findCollaborator: null,
            },
          },
        },
      ];

      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(undefinedDataMocks),
      });

      act(() => {
        result.current.setSearchTerm('undefined');
      });

      await act(async () => {
        await result.current.handleMemberSearch();
      });

      // Should not crash and maintain loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.isSearching).toBe(true);
    });

    it('should handle missing items array', async () => {
      const missingItemsMocks = [
        {
          request: {
            query: FindCollaboratorDocument,
            variables: {
              term: 'missing',
            },
          },
          result: {
            data: {
              findCollaborator: {
                __typename: 'CollaboratorSearchResults',
                limit: 5,
                items: null,
                availableSortFields: [],
                nextCursor: null,
                totalCount: 0,
              },
            },
          },
        },
      ];

      const { result } = renderHook(() => useCollaboratorSearch(), {
        wrapper: createWrapper(missingItemsMocks),
      });

      act(() => {
        result.current.setSearchTerm('missing');
      });

      await act(async () => {
        await result.current.handleMemberSearch();
      });

      await waitFor(() => {
        expect(result.current.results).toEqual([]);
        expect(result.current.errors).toContain('messaging.noSearchResultsFound');
      });
    });
  });
});