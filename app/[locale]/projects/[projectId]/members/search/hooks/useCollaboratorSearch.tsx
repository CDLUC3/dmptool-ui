'use client';

import { useState, useEffect } from 'react';
import { FindCollaboratorDocument, CollaboratorSearchResult } from '@/generated/graphql';
import { useTranslations } from 'next-intl';

// GraphQL
import { useLazyQuery } from '@apollo/client/react';

// Utils
import { extractOrcid } from '@/lib/identifierUtils';
import { handleApolloError } from '@/utils/apolloErrorHandler';


type SearchState = {
  term: string;
  results: CollaboratorSearchResult[];
  isSearching: boolean;
  errors: string[];
  loading: boolean;
};

export const useCollaboratorSearch = () => {
  const t = useTranslations('ProjectsProjectMembersSearch');
  const [searchState, setSearchState] = useState<SearchState>({
    term: '',
    results: [],
    isSearching: false,
    errors: [],
    loading: false,
  });

  const [fetchCollaborator, { data, loading, error: queryError }] = useLazyQuery(FindCollaboratorDocument,);

  // Set search state on input change
  const handleSearchInput = (value: string) => {
    const trimmed = value.trim();
    setSearchState({
      term: trimmed,
      results: [],
      isSearching: false,
      errors: [],
      loading: false,
    });
  };

  // Execute search
  const handleMemberSearch = async () => {
    const trimmed = searchState.term.trim();

    if (!trimmed) {
      setSearchState((prev) => ({
        ...prev,
        errors: [t('messaging.errors.searchTermRequired')],
      }));
      return;
    }

    setSearchState((prev) => ({
      ...prev,
      results: [],
      isSearching: true,
      errors: [],
      loading: true,
    }));

    try {
      await fetchCollaborator({ variables: { term: trimmed.toLowerCase() } });
    } catch (err) {
      const { wasRealError } = handleApolloError(err, 'useCollaboratorSearch.handleMemberSearch');
      if (!wasRealError) {
        return;
      }

      setSearchState((prev) => ({
        ...prev,
        results: [],
        isSearching: false,
        loading: false,
        errors: [t('messaging.errors.searchLookupFailed')],
      }));
    }
  };

  const clearSearch = () => {
    setSearchState({
      term: '',
      results: [],
      isSearching: false,
      errors: [],
      loading: false,
    });
  };

  // Update search results when data changes
  useEffect(() => {
    if (queryError) {
      const { wasRealError } = handleApolloError(queryError, 'useCollaboratorSearch.handleMemberSearch');
      if (!wasRealError) {
        return;
      }

      setSearchState((prev) => ({
        ...prev,
        results: [],
        isSearching: false,
        loading: false,
        errors: [t('messaging.errors.searchLookupFailed')],
      }));
      return;
    }

    if (!data?.findCollaborator) return;
    const items = (data.findCollaborator.items || []).filter(
      (i): i is CollaboratorSearchResult => i !== null
    );

    if (items.length === 0) {
      setSearchState((prev) => ({
        ...prev,
        errors: [t('messaging.noSearchResultsFound')],
        results: [],
        isSearching: false,
        loading: false,
      }));
    } else {
      setSearchState((prev) => ({
        ...prev,
        results: items.map((item) => ({
          ...item,
          orcid: item.orcid?.trim() || extractOrcid(prev.term) || item.orcid,
        })),
        isSearching: true,
        loading: false,
        errors: [],
      }));
    }
  }, [data, loading, queryError, t]);

  return {
    ...searchState,
    setSearchTerm: handleSearchInput,
    handleMemberSearch,
    clearSearch,
  };
};
