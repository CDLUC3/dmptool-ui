'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { routePath } from '@/utils/routes';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Link,
} from "react-aria-components";

// GraphQL
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
import { FunderSearchResults } from '@/app/types';
import { checkErrors } from '@/utils/errorHandler';
import { handleApolloError } from '@/utils/apolloErrorHandler';
import styles from './ProjectsCreateProjectFundingSearch.module.scss';
import { TransitionButton } from '@/components/Form';


const CreateProjectSearchFunder = () => {
  const Global = useTranslations('Global');
  const t = useTranslations('FunderSearch');
  const router = useRouter();
  const params = useParams();

  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [moreCounter, setMoreCounter] = useState<number>(0);
  const [funders, setFunders] = useState<AffiliationSearch[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [addProjectFunding] = useMutation(AddProjectFundingDocument, {});
  const [errors, setErrors] = useState<string[]>([]);
  const errorRef = useRef<HTMLDivElement>(null);

  const [popularFunders, setPopularFunders] = useState<FunderPopularityResult[]>([]);
  const [popularFundersLoading, setPopularFundersLoading] = useState(true);
  const [popularFundersQuery] = useLazyQuery(PopularFundersDocument, {});

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
        handleApolloError(err, 'createProjectSearchFunder.popularFundersQuery');
      })
      .finally(() => {
        setPopularFundersLoading(false);
      });
  }, []);

  function handleSelectFunder(funder: AffiliationSearch | FunderPopularityResult): Promise<void> {
    const projectId = params.projectId as string;

    return new Promise(async (resolve, reject) => {
      try {
        const result = await addProjectFunding({
          variables: {
            input: {
              projectId: Number(projectId),
              affiliationId: funder.uri
            }
          }
        });

        const [hasErrors, errs] = checkErrors(
          result?.data?.addProjectFunding?.errors as ProjectFundingErrors,
          ['general']
        );

        if (hasErrors) {
          setErrors([String(errs.general)]);
          resolve(); // Stop loading on error
        } else {
          // Never resolve — keep loading until page navigates away
          if (funder.apiTarget) {
            router.push(routePath('projects.create.funding.check', { projectId }));
          } else {
            router.push(routePath('projects.project.info', { projectId }));
          }
        }
      } catch (err) {
        handleApolloError(err, 'createProjectSearchFunder.handleSelectFunder');
        setErrors(prev => [...prev, (err as Error).message]);
        reject(err); // Stop loading on exception
      }
    });
  }


  async function handleAddFunderManually(): Promise<void> {
    const projectId = params.projectId as string;
    return new Promise(() => {
      router.push(routePath('projects.fundings.add', {
        projectId,
      }));
    })
  };

  async function handleNoFundingSource(): Promise<void> {
    const projectId = params.projectId as string;
    return new Promise(() => {
      router.push(routePath('projects.project.info', { projectId }));
    });
  }

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
        description={t('headerDescription')}
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href="/">{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href="/projects">{Global('breadcrumbs.projects')}</Link></Breadcrumb>
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
              className={styles.popularFundersSection}
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
                  <div className={styles.popularFunders}>
                    {popularFunders.map((funder) => (
                      <div
                        key={funder.id}
                        className={styles.fundingResultsListItem}
                        role="group"
                        aria-label={`${t('funder')}: ${funder.displayName}`}
                      >
                        <p className="funder-name">{funder.displayName}</p>
                        <TransitionButton
                          type="button"
                          className="secondary select-button"
                          data-funder-uri={funder.uri}
                          loadingLabel={Global('buttons.loading')}
                          showLoading={true}
                          onPress={() => handleSelectFunder(funder)}
                          aria-label={`${Global('buttons.select')} ${funder.displayName}`}
                        >
                          {Global('buttons.select')}
                        </TransitionButton>
                      </div>
                    ))}
                  </div>
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
            <section aria-labelledby="funders-section">
              <h3 id="funders-section">{t('found', { count: totalCount })}</h3>
              <div className={styles.fundingResultsList}>
                {funders.map((funder, index) => (
                  <div
                    key={index}
                    className={styles.fundingResultsListItem}
                    role="group"
                    aria-label={`${t('funder')}: ${funder.displayName}`}
                  >
                    <p className="funder-name">{funder.displayName}</p>
                    <Button
                      className="secondary select-button"
                      data-funder-uri={funder.uri}
                      onPress={() => handleSelectFunder(funder)}
                      aria-label={`${Global('buttons.select')} ${funder.displayName}`}
                    >
                      {Global('buttons.select')}
                    </Button>
                  </div>
                ))}

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
              </div>
            </section>
          )}

          {funders.length === 0 && hasSearched && (
            <section className={styles.resultMessageSection}>
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
            <section aria-labelledby="manual-section" className="mt-8">
              <h3 id="manual-section">{t('addManuallyHeading')}</h3>
              <p>{t('addManuallyText')}</p>
              <TransitionButton
                type="button"
                className="add-funder-button"
                onPress={() => handleAddFunderManually()}
                loadingLabel={Global('buttons.loading')}
                showLoading={true}
                aria-label={t('addManuallyLabel')}
              >
                {t('addManuallyLabel')}
              </TransitionButton>
            </section>
          )}

          <section aria-labelledby="no-funder-section" className="mt-8">
            <h3>{t('noFunderHeading')}</h3>
            <p>{t('noFunderText')}</p>
            <TransitionButton
              type="button"
              className="no-funder-button"
              onPress={() => handleNoFundingSource()}
              loadingLabel={Global('buttons.loading')}
              showLoading={true}
              aria-label={t('noFunderButtonLabel')}
            >
              {t('noFunderButtonLabel')}
            </TransitionButton>
          </section>

        </ContentContainer>
      </LayoutContainer>
    </>
  );
};

export default CreateProjectSearchFunder;
