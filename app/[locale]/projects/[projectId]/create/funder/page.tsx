'use client';

import React, { useEffect, useState, useRef, type TransitionStartFunction } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { routePath } from '@/utils/routes';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Checkbox,
  Link,
  Radio,
} from "react-aria-components";

// GraphQL
import {
  AffiliationSearch,
  FunderPopularityResult,
  PopularFundersDocument,
  AddProjectFundingDocument,
  ProjectFundingErrors,
  ProjectFundingsApiDocument,
} from '@/generated/graphql';

// Components
import PageHeader from "@/components/PageHeader";
import CreateProjectFlowLayout, {
  FlowActions,
  flowPath,
  fundingFlowPath,
  useCreateProjectFlow,
} from '@/components/CreateProjectFlow';
import FunderSearch from '@/components/FunderSearch';
import ErrorMessages from "@/components/ErrorMessages";
import Loading from "@/components/Loading";

// Utils and other
import { FunderSearchResults } from '@/app/types';
import { checkErrors } from '@/utils/errorHandler';
import { handleApolloError } from '@/utils/apolloErrorHandler';
import styles from './ProjectsCreateProjectFundingSearch.module.scss';
import { RadioGroupComponent, TransitionButton } from '@/components/Form';

type FunderOption = AffiliationSearch | FunderPopularityResult;

const CreateProjectSearchFunder = () => {
  const Global = useTranslations('Global');
  const t = useTranslations('FunderSearch');
  const Flow = useTranslations('CreateProjectFlow');
  const router = useRouter();
  const params = useParams();
  const { flow } = useCreateProjectFlow();
  const [projectFundingsQuery] = useLazyQuery(ProjectFundingsApiDocument, { fetchPolicy: 'network-only' });

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
  const [popularFundersFailed, setPopularFundersFailed] = useState(false);
  const [popularFundersQuery] = useLazyQuery(PopularFundersDocument, {});

  const [selectedUri, setSelectedUri] = useState<string>('');
  const [noFunder, setNoFunder] = useState<boolean>(false);

  const visibleFunders: FunderOption[] = hasSearched ? funders : popularFunders;
  const selectedFunder = visibleFunders.find((f) => f.uri === selectedUri);
  const canContinue = noFunder || !!selectedFunder;

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
        setPopularFundersFailed(true);
      })
      .finally(() => {
        setPopularFundersLoading(false);
      });
  }, []);

  function handleFunderChange(uri: string) {
    setSelectedUri(uri);
    setNoFunder(false);
  }

  function handleNoFunderChange(isSelected: boolean) {
    setNoFunder(isSelected);
    if (isSelected) setSelectedUri('');
  }

  async function handleSelectFunder(
    funder: FunderOption,
    { startTransition }: { startTransition: TransitionStartFunction }
  ): Promise<void> {
    const projectId = params.projectId as string;

    try {
      const { data: existing } = await projectFundingsQuery({
        variables: { projectId: Number(projectId) }
      });
      const existingFunding = existing?.project?.fundings?.find(
        (f) => f?.affiliation?.uri === funder.uri
      );

      // Apollo allows one funding per funder on a project, so an existing one is reused
      const existingFundingId = existingFunding?.id;
      if (existingFundingId) {
        startTransition(() => {
          router.push(fundingFlowPath('fundingStatus', flow, projectId, existingFundingId));
        });
        return;
      }

      const result = await addProjectFunding({
        variables: {
          input: {
            projectId: Number(projectId),
            affiliationId: funder.uri
          }
        }
      });

      const [hasErrors, errs] = checkErrors(
        (result?.data?.addProjectFunding?.errors ?? {}) as ProjectFundingErrors,
        ['general']
      );

      if (hasErrors) {
        setErrors([errs.general || Flow('funder.errors.addFailed')]);
        return;
      }

      const newFundingId = result?.data?.addProjectFunding?.id;
      if (!newFundingId) {
        setErrors([Flow('funder.errors.addFailed')]);
        return;
      }

      startTransition(() => {
        router.push(fundingFlowPath('fundingStatus', flow, projectId, newFundingId, { newFunding: true }));
      });
    } catch (err) {
      handleApolloError(err, 'createProjectSearchFunder.handleSelectFunder');
      setErrors([Flow('funder.errors.addFailed')]);
    }
  }

  async function handleNext(
    { startTransition }: { startTransition: TransitionStartFunction }
  ): Promise<void> {
    setErrors([]);
    if (noFunder) {
      const projectId = params.projectId as string;
      startTransition(() => {
        router.push(flowPath('projectDetails', flow, projectId));
      });
      return;
    }
    if (selectedFunder) {
      await handleSelectFunder(selectedFunder, { startTransition });
    }
  }

  async function handleAddFunderManually(
    { startTransition }: { startTransition: TransitionStartFunction }
  ): Promise<void> {
    const projectId = params.projectId as string;
    startTransition(() => {
      router.push(routePath('projects.fundings.add', { projectId }, { intent: flow.intent }));
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
      setSelectedUri('');
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

  function renderFunderRadios(label: string, description?: string) {
    return (
      <RadioGroupComponent
        name="funder"
        value={selectedUri}
        classes={styles.funderRadioGroup}
        radioGroupLabel={label}
        description={description}
        onChange={handleFunderChange}
      >
        {visibleFunders.map((funder, index) => (
          <Radio
            key={`${funder.uri}-${index}`}
            value={funder.uri}
            data-funder-uri={funder.uri}
          >
            {funder.displayName}
          </Radio>
        ))}
      </RadioGroupComponent>
    );
  }

  return (
    <>
      <PageHeader
        title={Flow('funder.title')}
        description={Flow('funder.description')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href="/">{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href="/projects">{Global('breadcrumbs.projects')}</Link></Breadcrumb>
          </Breadcrumbs>
        }
        className="page-project-create-project-funding"
      />

      <CreateProjectFlowLayout screen="funder" flow={flow}>
          <ErrorMessages errors={errors} ref={errorRef} />
          <FunderSearch
            onResults={onResults}
            moreTrigger={moreCounter}
          />

          {!hasSearched && (
            <section className={styles.popularFundersSection}>
              {popularFundersLoading ? (
                <>
                  <h3>{t('popularTitle')}</h3>
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
                renderFunderRadios(t('popularTitle'), t('popularDescription'))
              ) : (
                <>
                  <h3 id="popular-funders">{t('popularTitle')}</h3>
                  {popularFundersFailed && (
                    <ErrorMessages errors={[Flow('funder.errors.popularFailed')]} noScroll />
                  )}
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
                </>
              )}
            </section>
          )}

          {funders.length > 0 && (
            <section>
              {renderFunderRadios(t('found', { count: totalCount }))}

              {(hasMore()) && (
                <div className={styles.fundingResultsListMore}>
                  <Button
                    data-testid="load-more-btn"
                    className="secondary"
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
                className="secondary add-funder-button"
                onPress={handleAddFunderManually}
                loadingLabel={Global('buttons.loading')}
                showLoading={true}
                aria-label={t('addManuallyLabel')}
              >
                {t('addManuallyLabel')}
              </TransitionButton>
            </section>
          )}

          <section aria-labelledby="no-funder-section" className={styles.noFunderSection}>
            <h3 id="no-funder-section">{t('noFunderHeading')}</h3>
            <p>{Flow('funder.noFunderText')}</p>
            <Checkbox
              isSelected={noFunder}
              onChange={handleNoFunderChange}
              data-testid="no-funder-checkbox"
            >
              <div className="checkbox">
                <svg viewBox="0 0 18 18" aria-hidden="true">
                  <polyline points="1 9 7 14 15 4" />
                </svg>
              </div>
              <span>{Flow('funder.noFunderLabel')}</span>
            </Checkbox>
          </section>

          {!canContinue && (
            <p id="funder-next-hint" className={styles.nextHint}>
              {Flow('funder.selectToContinue')}
            </p>
          )}

          <FlowActions>
            <TransitionButton
              type="button"
              onPress={handleNext}
              isDisabled={!canContinue}
              loadingLabel={Global('buttons.loading')}
              aria-describedby={canContinue ? undefined : 'funder-next-hint'}
              data-testid="funder-next"
            >
              {Flow('buttons.next')}
            </TransitionButton>
          </FlowActions>

      </CreateProjectFlowLayout>
    </>
  );
};

export default CreateProjectSearchFunder;
