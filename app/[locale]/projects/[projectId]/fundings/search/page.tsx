'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Link,
} from "react-aria-components";

// GraphQL
import { useMutation, useLazyQuery } from '@apollo/client/react';
import {
  AffiliationSearch,
  FunderPopularityResult,
  PopularFundersDocument,
  AddProjectFundingDocument,
  ProjectFundingErrors,
} from '@/generated/graphql';

// Components
import PageHeader from "@/components/PageHeader";
import {
  ContentContainer,
  LayoutContainer,
} from "@/components/Container";
import FunderSearch from '@/components/FunderSearch';
import ErrorMessages from "@/components/ErrorMessages";
import Loading from "@/components/Loading";

// Utils and other
import { routePath } from '@/utils/routes';
import { FunderSearchResults } from '@/app/types';
import logECS from "@/utils/clientLogger";
import { useToast } from '@/context/ToastContext';
import styles from './ProjectsProjectFundingSearch.module.scss';
import { handleApolloError } from '@/utils/apolloErrorHandler';


type SelectableFunder = AffiliationSearch | FunderPopularityResult;

interface FunderListProps {
  funders: readonly SelectableFunder[];
  onSelect: (funder: SelectableFunder) => void;
  funderLabel: string;
  selectLabel: string;
}

function FunderList({
  funders,
  onSelect,
  funderLabel,
  selectLabel,
}: FunderListProps) {
  return (
    <div className={styles.funderList}>
      {funders.map((funder) => (
        <div
          key={funder.uri}
          className={styles.fundingResultsListItem}
          role="group"
          aria-label={`${funderLabel}: ${funder.displayName}`}
        >
          <p className="funder-name">{funder.displayName}</p>
          <Button
            className="secondary select-button"
            data-funder-uri={funder.uri}
            onPress={() => onSelect(funder)}
            aria-label={`${selectLabel} ${funder.displayName}`}
          >
            {selectLabel}
          </Button>
        </div>
      ))}
    </div>
  );
}


const ProjectsProjectFundingSearch = () => {
  const Global = useTranslations('Global');
  const t = useTranslations('FunderSearch');
  const toastState = useToast();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [moreCounter, setMoreCounter] = useState<number>(0);
  const [funders, setFunders] = useState<AffiliationSearch[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [addProjectFunding] = useMutation(AddProjectFundingDocument);
  const [errors, setErrors] = useState<string[]>([]);
  const errorRef = useRef<HTMLDivElement>(null);

  const [popularFunders, setPopularFunders] = useState<FunderPopularityResult[]>([]);
  const [popularFundersLoading, setPopularFundersLoading] = useState(true);
  const [popularFundersQuery] = useLazyQuery(PopularFundersDocument);

  useEffect(() => {
    // Manually calling the effect because the query specifies that some items
    // can be null, and we need to filter those potential null results out.
    popularFundersQuery()
      .then(({ data }) => {
        if (data?.popularFunders && data.popularFunders.length > 0) {
          const cleaned = data.popularFunders.filter((item) => item !== null)
          setPopularFunders(cleaned);
        }
      })
      .catch((err) => {
        handleApolloError(err, 'ProjectsProjectFundingSearch.popularFundersQuery');
      })
      .finally(() => {
        setPopularFundersLoading(false);
      });
  }, [popularFundersQuery]);


  /**
   * Handle specific errors that we care about in this component.
   * @param {ProjectFunderErrors} errs - The errors from the graphql response
   */
  function checkErrors(errs: ProjectFundingErrors): string[] {
    const noErrors = Object.values(errs).every(val => val === null);
    if (noErrors) return [];

    const typedKeys: (keyof ProjectFundingErrors)[] = [
      "affiliationId",
      "general",
      "projectId",
      "status",
    ];
    const newErrors: string[] = [];

    for (const k of typedKeys) {
      const errVal = errs[k];
      if (errVal) {
        newErrors.push(errVal);
      }
    }

    return newErrors
  }

  async function handleSelectFunder(funder: AffiliationSearch | FunderPopularityResult) {
    const input = {
      projectId: Number(projectId),
      affiliationId: funder.uri
    }

    addProjectFunding({ variables: { input } })
      .then((result) => {
        const errs = checkErrors(result?.data?.addProjectFunding?.errors as ProjectFundingErrors);
        if (errs.length > 0) {
          setErrors(errs);
        } else {
          const projectFundingId = result?.data?.addProjectFunding?.id;
          if (projectFundingId) {
            const NEXT_URL = routePath('projects.fundings.edit', { projectId, projectFundingId })
            const successMessage = t('messages.success.addProjectFunding');
            toastState.add(successMessage, { type: 'success', timeout: 3000 });
            router.push(NEXT_URL);
          } else {
            logECS(
              'error',
              'ProjectsProjectFundingSearch.addProjectFunding',
              { error: 'projectFundingId not returned in result' }
            );
            setErrors([Global('messaging.somethingWentWrong')])
          }
        }
      })
      .catch((err) => {
        handleApolloError(err, 'ProjectsProjectFundingSearch.addProjectFunding');
        setErrors([...errors, err.message])
      });
  };

  async function handleAddFunderManually() {
    const projectId = params.projectId as string;
    router.push(routePath('projects.fundings.add', {
      projectId,
    }));
  };

  function onResults(results: FunderSearchResults, isNew: boolean) {
    let validResults: AffiliationSearch[];
    if (results.items && results.items.length > 0) {
      validResults = results.items.filter((r): r is AffiliationSearch => r !== null)
    } else {
      validResults = [];
    }

    if (isNew) {
      setFunders(validResults);
    } else {
      setFunders(funders.concat(validResults));
    }

    setTotalCount(results.totalCount as number);

    if (results.nextCursor) {
      setNextCursor(results.nextCursor);
    }
    if (!hasSearched) setHasSearched(true);
  }

  /**
   * Checks if the useMore button should display or not.
   */
  function hasMore() {
    if (!nextCursor) return false;
    return (funders.length < totalCount);
  }

  return (
    <>
      <PageHeader
        title={t('headerTitle')}
        description=""
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.index', { projectId })}>{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.show', { projectId })}>{Global('breadcrumbs.projectOverview')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.fundings.index', { projectId })}>{Global('breadcrumbs.projectFunding')}</Link></Breadcrumb>
            <Breadcrumb>{Global('breadcrumbs.projectFundingSearch')}</Breadcrumb>
          </Breadcrumbs>
        }
        className="page-project-create-project-funding"
      />

      <LayoutContainer>
        <ContentContainer>
          <ErrorMessages errors={errors} ref={errorRef} />
          <FunderSearch
            onResults={onResults}
            moreTrigger={moreCounter}
          />

          {!hasSearched && (
            <section
              aria-labelledby="popular-funders"
              className={styles.funderSection}
            >
              <h3 id="popular-funders">{t('popularTitle')}</h3>
              {popularFundersLoading ? (
                <>
                  <p className={styles.popularDescription}>
                    {t('popularDescription')}
                  </p>
                  <Loading
                    variant="inline"
                    message={t('popularLoading')}
                    className={styles.popularFundersLoading}
                  />
                </>
              ) : popularFunders.length > 0 ? (
                <>
                  <p className={styles.popularDescription}>
                    {t('popularDescription')}
                  </p>
                  <FunderList
                    funders={popularFunders}
                    onSelect={handleSelectFunder}
                    funderLabel={t('funder')}
                    selectLabel={Global('buttons.select')}
                  />
                </>
              ) : (
                <div
                  className={styles.funderMessage}
                  role="status"
                  aria-labelledby="popular-funders-fallback"
                >
                  <p
                    id="popular-funders-fallback"
                    className={styles.funderMessageTitle}
                  >
                    {t('popularFallbackTitle')}
                  </p>
                  <p className={styles.funderMessageDescription}>
                    {t('popularFallbackDescription')}
                  </p>
                </div>
              )}
            </section>
          )}

          {funders.length > 0 && (
            <section
              aria-labelledby="funders-section"
              className={styles.funderSection}
            >
              <h3 id="funders-section">{t('found', { count: totalCount })}</h3>
              <FunderList
                funders={funders}
                onSelect={handleSelectFunder}
                funderLabel={t('funder')}
                selectLabel={Global('buttons.select')}
              />

              {(hasMore()) && (
                <div className={styles.fundingResultsListMore}>
                  <Button
                    data-testid="load-more-btn"
                    onPress={() => setMoreCounter(moreCounter + 1)}
                    aria-label={Global('buttons.loadMore')}
                  >
                    {Global('buttons.loadMore')}
                  </Button>
                  <p>
                    {t('showCount', {
                      count: funders.length,
                      total: totalCount,
                    })}
                  </p>
                </div>
              )}
            </section>
          )}

          {funders.length === 0 && hasSearched && (
            <section className={styles.funderSection}>
              <div
                className={styles.funderMessage}
                role="status"
                aria-labelledby="funders-empty"
              >
                <p id="funders-empty" className={styles.funderMessageTitle}>
                  {t('noResults')}
                </p>
                <p className={styles.funderMessageDescription}>
                  {t('noResultsDescription')}
                </p>
              </div>
            </section>
          )}

          {hasSearched && (
            <section
              aria-labelledby="manual-section"
              className={styles.manualSection}
            >
              <h3 id="manual-section">{t('addManuallyHeading')}</h3>
              <p>{t('addManuallyText')}</p>
              <Button
                className="add-funder-button"
                onPress={() => handleAddFunderManually()}
                aria-label={t('addManuallyLabel')}
              >
                {t('addManuallyLabel')}
              </Button>
            </section>
          )}

        </ContentContainer>
      </LayoutContainer >
    </>
  );
};

export default ProjectsProjectFundingSearch;
