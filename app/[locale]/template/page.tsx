'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/routing';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  FieldError,
  Input,
  Label,
  SearchField,
  Text
} from 'react-aria-components';
import { useTranslations } from 'next-intl';

//GraphQL
import { useLazyQuery } from '@apollo/client/react';
import { TemplatesDocument, TemplatesQuery } from '@/generated/graphql';

import {
  TemplateSearchResultInterface,
  TemplateItemProps,
  PaginatedTemplateSearchResultsInterface
} from '@/app/types';

// Components
import PageHeader from '@/components/PageHeader';
import TemplateSelectListItem from '@/components/TemplateSelectListItem';
import { ContentContainer, LayoutContainer, } from '@/components/Container';
import ErrorMessages from '@/components/ErrorMessages';
import Loading from '@/components/Loading';
import { TransitionButton, TransitionLink } from "@/components/Form";

// Hooks
import { useScrollToTop } from '@/hooks/scrollToTop';
import { useFormatDate } from '@/hooks/useFormatDate';
import { useTemplateStatus } from './hooks/useTemplateStatus';

// Utils and other
import { toSentenceCase } from '@/utils/general';
import { logECS, routePath } from '@/utils/index';

import styles from './orgTemplates.module.scss';

// # of templates displayed per section type
const LIMIT = 5;


const TemplateListPage: React.FC = () => {
  const formatDate = useFormatDate();
  const { scrollToTop } = useScrollToTop();

  const errorRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchButtonClicked, setSearchButtonClicked] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [totalCount, setTotalCount] = useState<number | null>(0);
  const [searchResults, setSearchResults] = useState<TemplateItemProps[]>([]);
  const [isSearchFetch, setIsSearchFetch] = useState(false);
  const [firstNewIndex, setFirstNewIndex] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Add separate state for search pagination
  const [searchNextCursor, setSearchNextCursor] = useState<string | null>(null);
  const [searchTotalCount, setSearchTotalCount] = useState<number | null>(0);


  const [templates, setTemplates] = useState<(TemplateItemProps)[]>([]);

  // For translations
  const t = useTranslations('OrganizationTemplates');
  const Global = useTranslations('Global');
  const SelectTemplate = useTranslations('TemplateSelectTemplatePage');

  // Template status hook
  const { getPublishStatusText } = useTemplateStatus();

  // Set URLs
  const TEMPLATE_CREATE_URL = routePath('template.create');

  // Lazy query for organization templates
  const [fetchTemplates, { data: templateData, loading, error: queryError }] = useLazyQuery<TemplatesQuery>(TemplatesDocument);

  // zero out search and filters
  const resetSearch = async () => {
    setSearchTerm('');
    setSearchButtonClicked(false);
    setSearchTotalCount(null);
    setSearchResults([]);
    setSearchNextCursor(null); // Reset search cursor
    setIsSearchFetch(false);

    //Reset templates
    setTemplates([]);
    setNextCursor(null); // Reset cursor
    setTotalCount(0);
    await fetchTemplates({
      variables: {
        paginationOptions: {
          limit: LIMIT,
        },
      },
    });
    scrollToTop(topRef);
  }

  // Handle search input
  const handleSearchInput = (term: string) => {
    setSearchTerm(term);
    if (term === '') {
      resetSearch();
      return;
    }
    setErrors([]);
  };

  // Run search for search term
  const handleSearch = async () => {

    if (!searchTerm.trim()) {
      return;
    }

    setSearchButtonClicked(true);
    setErrors([]);
    setIsSearchFetch(true);
    setSearchResults([]); // Clear previous search results
    setSearchNextCursor(null); // Reset search cursor

    await fetchTemplates({
      variables: {
        paginationOptions: {
          type: "CURSOR",
          limit: LIMIT,
        },
        term: searchTerm.toLowerCase(),
      },
    });
  }

  // Handler for search "Load more"
  const handleSearchLoadMore = async () => {
    if (!searchNextCursor) return;
    setFirstNewIndex(searchResults.length);

    await fetchTemplates({
      variables: {
        paginationOptions: {
          type: "CURSOR",
          cursor: searchNextCursor,
          limit: LIMIT,
        },
        term: searchTerm.toLowerCase(),
      },
    });
  };


  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setFirstNewIndex(templates.length);

    await fetchTemplates({
      variables: {
        paginationOptions: {
          type: "CURSOR",
          cursor: nextCursor,
          limit: LIMIT,
        },
      },
    });
  };

  // If page-level errors, scroll them into view
  useEffect(() => {
    if (errors.length > 0 && errorRef.current) {
      errorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [errors]);

  // Scroll to the next set of items when user clicks "Load more"
  useEffect(() => {
    if (firstNewIndex !== null) {
      const timeoutId = setTimeout(() => {
        const element = document.querySelector(`[data-index="${firstNewIndex}"]`);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
        setFirstNewIndex(null); // reset after scroll
      }, 150); // allow time for DOM update

      return () => clearTimeout(timeoutId);
    }
  }, [templates, searchResults, firstNewIndex]);

  useEffect(() => {
    if (!templateData || !templateData.myTemplates) return;
    // Transform templates into format expected by TemplateSelectListItem component
    const processTemplates = async (templates: PaginatedTemplateSearchResultsInterface | null) => {
      const items = templates?.items ?? [];
      const transformedTemplates = await Promise.all(
        items.map(async (template: TemplateSearchResultInterface | null) => {
          return {
            id: template?.id,
            title: template?.name || "",
            link: routePath('template.show', { templateId: Number(template?.id) }),
            funder: template?.ownerDisplayName,
            lastUpdated: (template?.modified) ? formatDate(template?.modified) : null,
            lastRevisedBy: template?.modifiedByName,
            publishStatus: getPublishStatusText(template?.isDirty ?? false, template?.latestPublishDate),
            publishDate: (template?.latestPublishDate) ? formatDate(template?.latestPublishDate) : null,
            defaultExpanded: false,
            latestPublishVisibility: toSentenceCase(template?.latestPublishVisibility ? template?.latestPublishVisibility?.toString() : '')
          }
        }));

      if (isSearchFetch) {
        // Handle search results - backend returns only new items for cursor pagination
        if (searchResults.length === 0) {
          // First search request - set all results
          setSearchResults(transformedTemplates);
        } else {
          // Subsequent search requests - append new items
          setSearchResults(prev => [...prev, ...transformedTemplates]);
        }
        setSearchNextCursor(templateData?.myTemplates?.nextCursor ?? null);
        setSearchTotalCount(templateData?.myTemplates?.totalCount ?? null);
      } else {
        // Handle regular pagination - backend returns only new items for cursor pagination
        if (items.length === 0) {
          // First load - set all results
          setTemplates(transformedTemplates);
        } else {
          // Subsequent loads - append new items (backend sends only new items)
          setTemplates(prev => [...prev, ...transformedTemplates]);
        }

        setNextCursor(templateData?.myTemplates?.nextCursor ?? null);
        setTotalCount(templateData?.myTemplates?.totalCount ?? null);
      }
    }
    processTemplates({
      ...templateData.myTemplates,
      items: (templateData.myTemplates.items ?? []).filter((item): item is TemplateSearchResultInterface => item !== null),
    });

    // Mark initial load as done
    setIsInitialLoading(false);
  }, [templateData, isSearchFetch]);

  // Load templates when page loads
  useEffect(() => {
    fetchTemplates({
      variables: {
        paginationOptions: {
          limit: LIMIT,
        },
      },
    });
  }, [fetchTemplates]);


  useEffect(() => {
    // Log query errors and avoid duplicates
    if (queryError && !errors.includes(queryError.message)) {
      setErrors(prev => [...prev, queryError.message]);
      setIsInitialLoading(false);

      logECS('error', 'fetchTemplates', {
        errors: queryError,
        url: { path: routePath('template.index') }
      });
    }
  }, [queryError]);

  if (isInitialLoading) {
    return <Loading message={Global('messaging.loading')} />;
  }
  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('template.index')}>{Global('breadcrumbs.templates')}</Link></Breadcrumb>
            <Breadcrumb>{t('title')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={
          <>
            <TransitionLink
              href={TEMPLATE_CREATE_URL}
              className="button-link button--primary">{t('actionCreate')}
            </TransitionLink>
          </>
        }
        className="page-template-list"
      />
      <ErrorMessages errors={errors} ref={errorRef} />

      <LayoutContainer>
        <ContentContainer>
          <div className="searchSection" role="search" ref={topRef}>
            <SearchField>
              <Label>{t('searchLabel')}</Label>
              <Input value={searchTerm} onChange={e => handleSearchInput(e.target.value)} />
              <TransitionButton
                onPress={async () => {
                  await handleSearch();
                }}
                loadingLabel={Global('buttons.searching')}
                showLoading={false}
              >
                {Global('buttons.search')}
              </TransitionButton>
              <FieldError />
              <Text slot="description" className="help">
                {t('searchHelpText')}
              </Text>
            </SearchField>
          </div >

          {loading && <p>{Global('messaging.loading')}</p>}

          {isSearchFetch && (
            <Button
              onPress={resetSearch}
              className={`${styles.searchMatchText} link`}
            >
              {Global('links.clearFilter')}
            </Button>
          )}
          {isSearchFetch && searchResults.length > 0 ? (
            <div className="template-list" role="list" aria-label={t('templateList')}>
              {searchResults.map((template, index) => (
                <div
                  key={`${template.id}-${index}`}
                  role="listitem"
                  data-index={index}
                >
                  <TemplateSelectListItem
                    item={template} />
                </div>
              ))}

              {searchNextCursor && (
                <div className={styles.loadBtnContainer}>
                  <TransitionButton
                    type="button"
                    data-testid="search-load-more-btn"
                    onPress={async () => await handleSearchLoadMore()}
                    loadingLabel={Global('buttons.loading')}
                    showLoading={false}
                    aria-label={SelectTemplate('loadMoreSearchResults')}
                  >
                    {Global('buttons.loadMore')}
                  </TransitionButton>
                  <div>
                    {Global('messaging.numDisplaying', { num: searchResults.length, total: searchTotalCount || '' })}
                  </div>
                  <Button onPress={resetSearch} className={`${styles.searchMatchText} link`}> {Global('links.clearFilter')}</Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className='template-list' role="list" aria-label={t('templateList')}>
                {searchTerm && searchButtonClicked ? (
                  <p>{Global('messaging.noItemsFound')}</p>
                ) : (
                  <>
                    {templates.map((template, index) => (
                      <div
                        key={`${template.id}-${index}`}
                        data-index={index}
                      >
                        <TemplateSelectListItem
                          item={template} />
                      </div>
                    ))}
                    {nextCursor && (
                      <div className={styles.loadBtnContainer}>
                        <TransitionButton
                          type="button"
                          data-testid="load-more-btn"
                          isDisabled={!nextCursor}
                          onPress={async () => await handleLoadMore()}
                          loadingLabel={Global('buttons.loading')}
                          showLoading={false}
                          aria-label={SelectTemplate('loadMoreTemplates')}
                        >
                          {Global('buttons.loadMore')}
                        </TransitionButton>
                        <div className={styles.remainingText}>
                          {Global('messaging.numDisplaying', { num: templates.length, total: totalCount || '' })}
                        </div>
                        {isSearchFetch && (
                          <Button onPress={resetSearch} className={`${styles.searchMatchText} link`}> {Global('links.clearFilter')}</Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

        </ContentContainer>
      </LayoutContainer >
    </>
  );
}

export default TemplateListPage;