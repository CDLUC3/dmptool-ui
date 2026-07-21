'use client'

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Button,
  Form,
  Input,
  Label,
  SearchField,
  Text,
} from "react-aria-components";

// GraphQL
import { useLazyQuery } from '@apollo/client/react';
import { AffiliationFundersDocument } from '@/generated/graphql';

// Utils and other
import { FunderSearchResults } from '@/app/types';

interface FunderSearchProps extends React.HTMLAttributes<HTMLDivElement> {
  // Call back to return the results
  onResults(results: FunderSearchResults, newSearch: boolean): void;

  // A simple counter to trigger fetching more results
  moreTrigger: number;

  // Specifies result limit to paginate by
  limit?: number,
}

const FunderSearch = ({
  limit = 5,
  onResults,
  moreTrigger,
}: FunderSearchProps) => {

  const t = useTranslations('Global');
  const [moreCounter, setMoreCounter] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [fetchAffiliations, { data, error }] = useLazyQuery(AffiliationFundersDocument, {});
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [newSearch, setNewSearch] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Don't perform any lookup if the search term is empty.
    if (!searchTerm.trim()) return;
    setNewSearch(true);
    setIsSearching(true);

    fetchAffiliations({
      variables: {
        paginationOptions: {
          type: "CURSOR",
          limit,
        },
        name: searchTerm.toLowerCase(),
        funderOnly: true,
      },
    });
  };

  useEffect(() => {
    if (data?.affiliations) {
      setNextCursor(data.affiliations.nextCursor ?? null);
      onResults(data.affiliations as FunderSearchResults, newSearch);
      setIsSearching(false);
    }
  }, [data]);

  useEffect(() => {
    if (error) setIsSearching(false);
  }, [error]);

  useEffect(() => {
    if (moreTrigger > moreCounter) {
      setNewSearch(false);
      fetchAffiliations({
        variables: {
          paginationOptions: {
            type: "CURSOR",
            cursor: nextCursor,
            limit,
          },
          name: searchTerm.toLowerCase(),
          funderOnly: true,
        },
      });
      setMoreCounter(moreTrigger);
    }
  }, [moreTrigger]);

  return (
    <>
      <Form onSubmit={handleSubmit} aria-labelledby="search-section">
        <section id="search-section">
          <SearchField
            data-testid="search-field"
            aria-label="Search funders"
          >
            <Label>{t('labels.funderSearch')}</Label>
            <Input
              aria-describedby="search-help"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('placeholders.funderSearch')}
            />
            <Button
              slot={null}
              data-testid="search-btn"
              type="submit"
              isDisabled={isSearching}
            >
              {t('buttons.search')}
            </Button>
            <Text slot="description" className="help" id="search-help">
              {t('helpText.funderSearch')}
            </Text>
          </SearchField>
        </section>
      </Form>
    </>
  );
};

export default FunderSearch;
