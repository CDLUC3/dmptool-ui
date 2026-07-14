import { useCallback, useRef, useState } from "react";
import { useTranslations } from 'next-intl';

// GraphQL
import { useLazyQuery } from '@apollo/client/react';
import { AffiliationsDocument } from '@/generated/graphql';

// Utils and other
import { debounce } from '@/hooks/debounce';
import { SuggestionInterface } from '@/app/types';
import { handleApolloError } from '@/utils/apolloErrorHandler';

export function useAffiliationSearch() {
  const t = useTranslations('Global');
  const [suggestions, setSuggestions] = useState<SuggestionInterface[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [fetchAffiliations] = useLazyQuery(AffiliationsDocument);
  const latestSearchIdRef = useRef(0);

  const handleSearch = useCallback(
    debounce(async (term: string) => {
      const searchId = ++latestSearchIdRef.current;

      if (!term) {
        setSuggestions([]);
        setIsSearching(false);
        setSearchError('');
        return;
      }

      setIsSearching(true);
      setSearchError('');

      try {
        const result = await fetchAffiliations({
          variables: { name: term.toLowerCase() },
        });

        if (searchId !== latestSearchIdRef.current) {
          return;
        }

        if (result.error) {
          throw result.error;
        }

        if (result.data?.affiliations?.items) {
          const affiliations = result.data.affiliations.items
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .map((item) => ({
              id: item.id != null ? String(item.id) : '',
              displayName: item.displayName,
              uri: item.uri,
            }));
          setSuggestions(affiliations);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        if (searchId !== latestSearchIdRef.current) {
          return;
        }

        const { wasRealError, message } = handleApolloError(error, 'useAffiliationSearch.fetchAffiliations');
        if (wasRealError) {
          setSuggestions([]);
          setSearchError(message || t('messaging.errors.institutionSuggestionsLoadError'));
        }
      } finally {
        if (searchId === latestSearchIdRef.current) {
          setIsSearching(false);
        }
      }
    }, 300),
    [fetchAffiliations, t]
  );

  return { suggestions, handleSearch, isSearching, searchError };
}
