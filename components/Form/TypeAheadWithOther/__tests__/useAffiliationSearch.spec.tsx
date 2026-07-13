import { renderHook, act } from '@testing-library/react';
import { useAffiliationSearch } from '@/components/Form/TypeAheadWithOther';
import { useLazyQuery } from '@apollo/client/react';
import { AffiliationsDocument } from '@/generated/graphql';

jest.mock('@/utils/clientLogger', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock debounce to run immediately instead of waiting 300ms
jest.mock('@/hooks/debounce', () => ({
  /* eslint-disable @typescript-eslint/no-explicit-any */
  debounce: (fn: any) => fn,
}));

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useLazyQuery: jest.fn(),
}));

// Cast with jest.mocked utility
const mockUseLazyQuery = jest.mocked(useLazyQuery);
const mockFetchAffiliations = jest.fn();


const setupMocks = () => {
  // Lazy query mocks
  const stableAffiliationsReturn = [
    mockFetchAffiliations,
    {
      data: {},
      loading: false,
      error: null
    }
  ];

  mockUseLazyQuery.mockImplementation((document) => {
    if (document === AffiliationsDocument) {
      return stableAffiliationsReturn as any;
    }

    return {
      data: null,
      loading: false,
      error: undefined
    };
  });
};

describe('useAffiliationSearch', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should clear suggestions when term is empty', async () => {
    const { result } = renderHook(() => useAffiliationSearch());

    await act(async () => {
      result.current.handleSearch('');
    });

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(mockFetchAffiliations).not.toHaveBeenCalled();
  });

  it('should set isSearching to true while a fetch is in flight and false when it resolves', async () => {
    let resolveFetch!: (value: unknown) => void;
    mockFetchAffiliations.mockImplementationOnce(
      () => new Promise((resolve) => { resolveFetch = resolve; })
    );

    const { result } = renderHook(() => useAffiliationSearch());

    expect(result.current.isSearching).toBe(false);

    act(() => {
      result.current.handleSearch('Test');
    });

    expect(result.current.isSearching).toBe(true);

    await act(async () => {
      resolveFetch({ data: { affiliations: { items: [] } } });
    });

    expect(result.current.isSearching).toBe(false);
  });

  it('should call fetchAffiliations and set suggestions when data is returned', async () => {
    mockFetchAffiliations.mockResolvedValueOnce({
      data: {
        affiliations: {
          items: [
            { id: 1, displayName: 'Test Org', uri: 'http://example.com' },
            null,
          ],
        },
      },
    });
    const stableAffiliationsReturn = [
      mockFetchAffiliations,
      {
        data: {},
        loading: false,
        error: null
      }
    ];

    mockUseLazyQuery.mockImplementation((document) => {
      if (document === AffiliationsDocument) {
        return stableAffiliationsReturn as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    const { result } = renderHook(() => useAffiliationSearch());

    await act(async () => {
      result.current.handleSearch('Test');
    });

    expect(mockFetchAffiliations).toHaveBeenCalledWith({
      variables: { name: 'test' },
    });

    expect(result.current.suggestions).toEqual([
      { id: '1', displayName: 'Test Org', uri: 'http://example.com' },
    ]);
  });

  it('should set affiliation id to empty string if no id is passed in', async () => {
    mockFetchAffiliations.mockResolvedValueOnce({
      data: {
        affiliations: {
          items: [
            { id: null, displayName: 'Test Org', uri: 'http://example.com' },
            null,
          ],
        },
      },
    });

    const stableAffiliationsReturn = [
      mockFetchAffiliations,
      {
        data: {},
        loading: false,
        error: null
      }
    ];

    mockUseLazyQuery.mockImplementation((document) => {
      if (document === AffiliationsDocument) {
        return stableAffiliationsReturn as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    const { result } = renderHook(() => useAffiliationSearch());

    await act(async () => {
      result.current.handleSearch('Test');
    });

    expect(mockFetchAffiliations).toHaveBeenCalledWith({
      variables: { name: 'test' },
    });

    expect(result.current.suggestions).toEqual([
      { id: '', displayName: 'Test Org', uri: 'http://example.com' },
    ]);
  });

  it('should not update suggestions if data has no items', async () => {
    mockFetchAffiliations.mockResolvedValueOnce({
      data: { affiliations: { items: [] } },
    });

    const stableAffiliationsReturn = [
      mockFetchAffiliations,
      {
        data: {},
        loading: false,
        error: null
      }
    ];

    mockUseLazyQuery.mockImplementation((document) => {
      if (document === AffiliationsDocument) {
        return stableAffiliationsReturn as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    const { result } = renderHook(() => useAffiliationSearch());

    await act(async () => {
      result.current.handleSearch('Another');
    });

    expect(result.current.suggestions).toEqual([]);
  });

  it('should ignore aborted searches without setting an error', async () => {
    mockFetchAffiliations.mockRejectedValueOnce(
      new DOMException('The operation was aborted.', 'AbortError')
    );

    const { result } = renderHook(() => useAffiliationSearch());

    await act(async () => {
      result.current.handleSearch('Test');
    });

    expect(result.current.searchError).toBe('');
    expect(result.current.isSearching).toBe(false);
  });

  it('should set a clear search error when a real fetch failure occurs', async () => {
    mockFetchAffiliations.mockRejectedValueOnce(new Error('Network request failed'));

    const { result } = renderHook(() => useAffiliationSearch());

    await act(async () => {
      result.current.handleSearch('Test');
    });

    expect(result.current.searchError).toBe('Network request failed');
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it('should ignore stale search results when a newer search has started', async () => {
    let resolveFirst!: (value: unknown) => void;
    mockFetchAffiliations
      .mockImplementationOnce(
        () => new Promise((resolve) => { resolveFirst = resolve; })
      )
      .mockResolvedValueOnce({
        data: {
          affiliations: {
            items: [{ id: 2, displayName: 'Newer Org', uri: 'http://new.example.com' }],
          },
        },
      });

    const { result } = renderHook(() => useAffiliationSearch());

    act(() => {
      result.current.handleSearch('Old');
    });

    await act(async () => {
      result.current.handleSearch('New');
    });

    await act(async () => {
      resolveFirst({
        data: {
          affiliations: {
            items: [{ id: 1, displayName: 'Stale Org', uri: 'http://stale.example.com' }],
          },
        },
      });
    });

    expect(result.current.suggestions).toEqual([
      { id: '2', displayName: 'Newer Org', uri: 'http://new.example.com' },
    ]);
  });
});