import { renderHook, act } from '@testing-library/react';
import { useAffiliationSearch } from '@/components/Form/TypeAheadWithOther';
import { useLazyQuery } from '@apollo/client/react';
import { AffiliationsDocument } from '@/generated/graphql';

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
});