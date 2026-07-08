'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client/react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Checkbox,
  FieldError,
  Input,
  Label,
  Link,
  SearchField,
  Text,
} from "react-aria-components";

// Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer } from '@/components/Container';
import TemplateList from '@/components/TemplateList';
import ErrorMessages from '@/components/ErrorMessages';
import Loading from '@/components/Loading';
import { CheckboxGroupComponent } from '@/components/Form';
import Pagination from '@/components/Pagination';

// GraphQL
import {
  AddPlanDocument,
  PlanErrors,
  MeDocument,
  AddPlanFundingDocument,
  ProjectFundingsDocument,
  PublishedTemplatesMetaDataDocument,
  PublishedTemplatesDocument,
} from '@/generated/graphql';

// Other
import { scrollToTop } from '@/utils/general';
import logECS from '@/utils/clientLogger';
import { routePath } from '@/utils/routes';
import { useToast } from '@/context/ToastContext';
import { useFormatDate } from '@/hooks/useFormatDate';
import { TemplateItemProps } from '@/app/types';
import { checkErrors } from '@/utils/errorHandler';
import { handleApolloError } from '@/utils/apolloErrorHandler';
import styles from './planCreate.module.scss';

// # of templates displayed per page
const LIMIT = 5;

interface ProjectFundersInterface {
  name: string;
  uri: string;
}

interface PublicTemplatesInterface {
  bestPractice?: boolean | null;
  id?: number | null;
  name?: string | null;
  description?: string | null;
  modified?: string | null;
  modifiedByName?: string | null;
  modifiedById?: number | null;
  visibility?: string | null;
  ownerDisplayName?: string | null;
  ownerURI?: string | null;
  versionedTemplateCustomizationId?: number | null;
}

const PlanCreate: React.FC = () => {
  const formatDate = useFormatDate();
  const params = useParams();
  const router = useRouter();
  const toastState = useToast(); // Access the toast state from context

  // Get projectId from the URL
  const projectId = String(params.projectId);

  // Set ref for error messages
  const errorRef = useRef<HTMLDivElement | null>(null);
  // Scrolling to top
  const topRef = useRef<HTMLDivElement>(null);

  //states
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [bestPractice, setBestPractice] = useState<boolean>(false);
  const [selectedFunders, setSelectedFunders] = useState<string[]>([]);
  const [publicTemplatesList, setPublicTemplatesList] = useState<TemplateItemProps[]>([]);
  const [funders, setFunders] = useState<ProjectFundersInterface[]>([]);
  const [selectedBestPracticeItems, setSelectedBestPracticeItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean | null>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean | null>(false);
  const [initialSelectionApplied, setInitialSelectionApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Localization keys
  const PlanCreate = useTranslations('PlanCreate');
  const Global = useTranslations('Global');


  // Published templates lazy query
  const [fetchPublishedTemplates, { data: publishedTemplates, loading, error: publishedTemplatesError }] = useLazyQuery(PublishedTemplatesDocument);

  // Get Project Funders data
  const { data: projectFundings, loading: projectFundingsLoading, error: projectFundingsError } = useQuery(ProjectFundingsDocument, {
    variables: { projectId: Number(projectId) },
  });

  // User's data for user's affiliation
  const { data: userData, loading: userLoading, error: userError } = useQuery(MeDocument);

  const userAffiliation = userData?.me?.affiliation;

  // Get meta data about the available published templates
  const { data: templateMetaData, loading: templatesMetaDataLoading, error: templatesMetaDataError } = useQuery(PublishedTemplatesMetaDataDocument, {
    variables: {
      paginationOptions: {
        offset: 0,
        limit: LIMIT,
        type: "OFFSET",
        sortDir: "DESC",
        selectOwnerURIs: [],
        bestPractice: false
      },
      term: ""
    }
  });

  // Initialize the addPlan mutation
  const [addPlanMutation] = useMutation(AddPlanDocument, {
    notifyOnNetworkStatusChange: true,
  });

  // Initialize the addPlanFunding mutation
  const [addPlanFundingMutation] = useMutation(AddPlanFundingDocument, {});

  const fetchTemplatesForCurrentFilters = useCallback(async () => {
    // After clearing, fetch templates for current filters
    if (bestPractice) { // If best practice is checked, then filter on that
      // Need to keep catch to avoid unhandled promise rejection - known limitation of Apollo Client 4 handling lazy queries
      // This silent catch is acceptable here because errors are handled in the useEffect monitoring publishedTemplatesError
      fetchTemplates({ page: currentPage, bestPractice: true, selectedOwnerURIs: [], searchTerm: '' });
    } else if (selectedFunders.length > 0) { // If funders are checked, then filter on those
      fetchTemplates({ page: currentPage, selectedOwnerURIs: selectedFunders, searchTerm: '' });
    } else {
      fetchTemplates({ page: currentPage, searchTerm: '' });
    }
  }, [bestPractice, selectedFunders, currentPage, searchTerm]);

  // Reset search term to empty and fetch all templates
  const resetSearch = useCallback(() => {
    setSearchTerm('');
    fetchTemplatesForCurrentFilters();
    scrollToTop(topRef);
  }, [scrollToTop, fetchTemplatesForCurrentFilters]);

  // Function to transform the templates data into more useable format
  const transformTemplates = (templates: (PublicTemplatesInterface | null)[]) => {
    const transformedTemplates =
      templates.map((template: PublicTemplatesInterface | null) => ({
        id: template?.id,
        title: template?.name || "",
        description: template?.description || "",
        link: `/template/${template?.id ? template.id : ''}`,
        content: template?.description || template?.modified ? (
          <div>
            <p>{template?.description}</p>
            <p>
              {Global('lastUpdated')}: {template?.modified ? formatDate(template?.modified) : null}
            </p>
          </div>
        ) : null,
        funder: template?.ownerDisplayName || "",
        funderUri: template?.ownerURI || "",
        lastUpdated: template?.modified ? formatDate(template?.modified) : null,
        lastRevisedBy: template?.modifiedByName || null,
        // Only show customization message if there is a versionedTemplateCustomizationId, which indicates that there is a customized version of the template for the user
        hasAdditionalGuidance: template?.versionedTemplateCustomizationId != null,
        defaultExpanded: false,
        visibility: template?.visibility,
        bestPractices: template?.bestPractice || false,
        publishStatus: Global('published') // All publishedTemplates returned are marked as 'Published'
      }));
    return transformedTemplates;
  };

  // Handle search input change
  const handleSearchInput = async (value: string) => {
    setSearchTerm(value);
  };

  // Handle funder/best practice filter checkbox change
  const handleCheckboxChange = async (value: string[], typ: string) => {

    // Mark that user has interacted with checkboxes
    setUserHasInteracted(true);

    // Determine which templates to show based on selected filters
    if (value.length === 0) { // When checkbox is unchecked and there is no value, then fetch all templates
      setBestPractice(false);
      setSelectedFunders([]);
      setSelectedBestPracticeItems([]);
      // Default to all templates when no criteria selected, or templates matching search term
      await fetchTemplates({ page: currentPage, searchTerm });

    } else if (typ === 'funders') {
      // Always set selected filter items (whether empty or not)
      setSelectedFunders(value);
      setBestPractice(false);
      // Fetch templates for selected funders
      await fetchTemplates({ selectedOwnerURIs: value, searchTerm });
    } else if (typ === 'bestPractice') {
      setSelectedBestPracticeItems(value);
      setBestPractice(true);
      // Fetch best practice templates
      await fetchTemplates({ bestPractice: true, selectedOwnerURIs: [], searchTerm });
    }
  };

  // Handle pagination page click
  const handlePageClick = async (page: number) => {
    setUserHasInteracted(true);
    await fetchTemplates({
      page,
      bestPractice,
      selectedOwnerURIs: selectedFunders,
      searchTerm
    });
  };

  // Handle filtering when user clicks search button
  const handleSearchButton = async (term: string) => {
    setErrors([]); // Clear previous errors
    setSearchTerm(term);
    setUserHasInteracted(true);

    // Reset to first page on new search
    setCurrentPage(1);

    // Fetch templates based on currently checked filters and search term
    if (bestPractice) {
      await fetchTemplates({ searchTerm: term, bestPractice: true, selectedOwnerURIs: [] });
    } else if (selectedFunders.length > 0) {
      await fetchTemplates({ searchTerm: term, selectedOwnerURIs: selectedFunders });
    } else {
      await fetchTemplates({ searchTerm: term });
    }
  };

  // When user selects a template, we create a plan and redirect
  const onSelect = async (versionedTemplateId: number) => {
    if (isSubmitting) return; // Prevent multiple submissions

    setIsSubmitting(true);
    setErrors([]);  // Clear previous errors

    const fundingIds: number[] = projectFundings
      ?.projectFundings
      ?.filter((item): item is { id: number } => !!item?.id)
      .map(item => item.id) ?? [];

    try {
      const planResp = await addPlanMutation({
        variables: {
          projectId: Number(projectId),
          versionedTemplateId
        },
      });

      // Check for errors in the response
      const [hasErrors, errs] = checkErrors(
        planResp?.data?.addPlan?.errors as PlanErrors,
        ['general', 'versionedTemplateId', 'projectId']
      );

      if (hasErrors) {
        setErrors([String(errs.general)]);
        toastState.add(Global("messaging.somethingWentWrong"), { type: 'error' });
        logECS('error', 'addPlanMutation', {
          error: errs,
          url: {
            path: routePath('projects.dmp.create', { projectId }),
          }
        });
        return; //Exit early
      }

      const newPlanId = planResp?.data?.addPlan?.id;
      if (!newPlanId) {
        setErrors([Global("messaging.somethingWentWrong")]);
        toastState.add(Global("messaging.somethingWentWrong"), { type: 'error' });
        logECS('error', 'addPlanMutation', {
          error: "Invalid plan response data",
          url: {
            path: routePath('projects.dmp.create', { projectId }),
          }
        });
        return;
      }

      await addPlanFundingMutation({
        variables: {
          planId: newPlanId,
          projectFundingIds: fundingIds,
        },
      });

      // NOTE:: We need to redirect to the plan index page regardless of potential
      // errors returned by the AddPlanFundingMutation. This is because we already
      // created the plan at this point, and it will cause confusion if we now
      // deal with errors without redirecting to the newly created plan.
      router.push(routePath('projects.dmp.show', {
        projectId,
        dmpId: newPlanId,  // newPlanId was set in the preceding promise
      }));
    } catch (err) {
      logECS('error', 'addPlanMutation', {
        error: err,
        url: {
          path: routePath('projects.dmp.create', { projectId }),
        }
      });
      toastState.add(Global("messaging.somethingWentWrong"), { type: 'error' });
      setErrors([(err as Error).message])
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch published templates based on page, filters and search term criteria
  const fetchTemplates = async ({
    page,
    bestPractice = false,
    selectedOwnerURIs = [],
    searchTerm = ''
  }: {
    page?: number;
    bestPractice?: boolean;
    selectedOwnerURIs?: string[];
    searchTerm?: string;
  }): Promise<void> => {
    let offsetLimit = 0;
    if (page) {
      setCurrentPage(page);
      offsetLimit = (page - 1) * LIMIT;
    }

    try {
      await fetchPublishedTemplates({
        variables: {
          paginationOptions: {
            offset: offsetLimit,
            limit: LIMIT,
            type: "OFFSET",
            sortDir: "DESC",
            selectOwnerURIs: selectedOwnerURIs,
            bestPractice
          },
          term: searchTerm,
        }
      });
    } catch (err) {
      handleApolloError(err, 'PlanCreate.fetchTemplates');
    }
  };

  // Process templates when publishedTemplates changes
  useEffect(() => {
    // If user navigates away while request is in flight, and the network response arrives,
    // can't perform state update on unmounted component. So we track if component is mounted.
    let isMounted = true; // Track if component is still mounted

    const processTemplates = () => {
      if (publishedTemplates?.publishedTemplates?.items) {
        const transformedTemplates = transformTemplates(publishedTemplates.publishedTemplates.items);
        setPublicTemplatesList(transformedTemplates);
        const totalCount = publishedTemplates?.publishedTemplates?.totalCount ?? 0;
        const totalPages = Math.ceil(totalCount / LIMIT);
        setTotalPages(totalPages);
        const hasNextPage = publishedTemplates?.publishedTemplates?.hasNextPage ?? false;
        setHasNextPage(hasNextPage);
        const hasPreviousPage = publishedTemplates?.publishedTemplates?.hasPreviousPage ?? false;
        setHasPreviousPage(hasPreviousPage);
      } else {
        if (isMounted) {
          setPublicTemplatesList([]);
        }
      }
    };
    processTemplates();

    return () => {
      isMounted = false; // Mark as unmounted
    };

  }, [publishedTemplates]);

  // Compute funders data based on project fundings and template affiliations
  const fundersData = useMemo(() => {
    // Return empty if data isn't ready yet
    if (
      loading ||
      projectFundingsLoading ||
      userLoading ||
      templatesMetaDataLoading ||
      !projectFundings?.projectFundings ||
      !templateMetaData?.publishedTemplatesMetaData?.availableAffiliations
    ) {
      return [];
    }

    const uniqueAffiliations = templateMetaData.publishedTemplatesMetaData.availableAffiliations.filter(
      (affiliation): affiliation is string => affiliation !== null
    );

    // No affiliations available in templates
    if (uniqueAffiliations.length === 0) return [];

    // Matching project funders to available template affiliations
    const matchingAffiliations = projectFundings.projectFundings.filter(
      (item) => item?.affiliation && uniqueAffiliations.includes(item.affiliation.uri)
    );

    let result: { name: string; uri: string }[] = [];

    // Add matching affiliations from project fundings
    if (matchingAffiliations.length > 0) {
      result = matchingAffiliations
        .map((funder) => ({
          name: funder?.affiliation?.displayName ?? null,
          uri: funder?.affiliation?.uri ?? null,
        }))
        .filter((funder): funder is { name: string; uri: string } => funder.name !== null);
    }

    if (userAffiliation?.uri && uniqueAffiliations.includes(userAffiliation.uri)) {
      const funderURIs = result.map(f => f.uri);
      if (!funderURIs.includes(userAffiliation.uri)) {
        result.push({
          name: userAffiliation.name ?? userAffiliation.uri,
          uri: userAffiliation.uri,
        });
      }
    }

    return result;
  }, [
    loading,
    projectFundingsLoading,
    templatesMetaDataLoading,
    projectFundings,
    templateMetaData,
    userData
  ]);

  const hasBestPracticeTemplates = useMemo(() => {
    return templateMetaData?.publishedTemplatesMetaData?.hasBestPracticeTemplates ?? false;
  }, [templateMetaData]);

  // Whether the page is still performing its initial template load. Used to show a
  // spinner (instead of the "no items found" message) before the first fetch has been
  // applied, so the empty state doesn't flash on initial load. Once the user interacts
  // (search/filter), we no longer suppress the empty state — an empty result should
  // surface immediately as "no items found".
  const isLoadingTemplates =
    !userHasInteracted &&
    (loading ||
      projectFundingsLoading ||
      userLoading ||
      templatesMetaDataLoading ||
      !initialSelectionApplied);

  const initialFilterConfig = useMemo(() => {
    // Don't calculate if user has interacted or data isn't ready
    if (
      userHasInteracted ||
      loading ||
      projectFundingsLoading ||
      templatesMetaDataLoading
    ) {
      return null;
    }

    const funderURIs = fundersData.map(f => f.uri);

    // Funders exist (excluding user affiliation)
    if (funderURIs.length > 0) {
      return {
        type: 'funders' as const,
        fundersData,
        funderURIs
      }
    }

    // Best practice templates exist
    if (hasBestPracticeTemplates) {
      return {
        type: 'bestPractice' as const,
      };
    }

    // Show all templates
    return {
      type: 'all' as const,
    };
  }, [
    fundersData,
    hasBestPracticeTemplates,
    userHasInteracted,
    loading,
    projectFundingsLoading,
    templatesMetaDataLoading,
    userData
  ]);

  // Only for initial data fetching
  // In your PlanCreate component
  useEffect(() => {
    // CRITICAL: Don't run if no config or already applied
    if (!initialFilterConfig || initialSelectionApplied) return;

    let isCancelled = false; // Add cancellation flag

    const applyInitialFilters = async () => {
      if (isCancelled) return; // Check before state updates

      if (initialFilterConfig.type === 'funders') {
        if (!isCancelled) setFunders(initialFilterConfig.fundersData);
        if (!isCancelled) setSelectedFunders(initialFilterConfig.funderURIs);
        if (!isCancelled) setBestPractice(false);
        await fetchTemplates({ selectedOwnerURIs: initialFilterConfig.funderURIs });
      } else if (initialFilterConfig.type === 'bestPractice') {
        if (!isCancelled) setSelectedBestPracticeItems(["DMP Best Practice"]);
        if (!isCancelled) setBestPractice(true);
        await fetchTemplates({ bestPractice: true });
      } else {
        await fetchTemplates({ page: currentPage });
      }

      if (!isCancelled) {
        setInitialSelectionApplied(true);
      }
    };

    applyInitialFilters();

    return () => {
      isCancelled = true; // Cleanup: prevent state updates after unmount
    };
  }, [initialFilterConfig, initialSelectionApplied]);

  // Handle errors from various queries
  useEffect(() => {
    if (publishedTemplatesError || projectFundingsError || userError || templatesMetaDataError) {
      logECS('error', 'Plan Create queries', {
        error: publishedTemplatesError || projectFundingsError || userError || templatesMetaDataError,
        url: {
          path: routePath('projects.dmp.create', { projectId })
        }
      });
      toastState.add(Global("messaging.somethingWentWrong"), { type: 'error' });
      router.push(routePath('projects.show', { projectId }));
    }
  }, [publishedTemplatesError, projectFundingsError, userError, templatesMetaDataError]);


  // trigger fetching all templates when searchTerm is manually cleared (place after all state/effect declarations)
  useEffect(() => {
    if (searchTerm === '') {
      fetchTemplatesForCurrentFilters();
    }
  }, [searchTerm]);

  return (
    <>
      <PageHeader
        title={PlanCreate('title')}
        description={PlanCreate('description')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.show', { projectId })}>{Global('breadcrumbs.projectOverview')}</Link></Breadcrumb>
            <Breadcrumb>{PlanCreate('title')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={<></>}
        className="page-template-list"
      />

      <ErrorMessages errors={errors} ref={errorRef} />

      <LayoutContainer>
        <ContentContainer className={"layout-content-container-full"}>
          <div role="search" ref={topRef}>
            <div className={styles.searchFieldWrapper}>
              <SearchField aria-label="Template search">
                <Label>{Global('labels.searchByKeyword')}</Label>
                <Text slot="description" className="help">
                  {Global('helpText.searchHelpText')}
                </Text>
                <Input
                  aria-describedby="search-help"
                  value={searchTerm}
                  onChange={e => handleSearchInput(e.target.value)}
                />
                <Button
                  onPress={() => handleSearchButton(searchTerm)}
                >{Global('buttons.search')}</Button>
                <FieldError />
              </SearchField>
            </div>

            {/**Only show filters if there are funders. If no funders, then show best practice filter if the results include them  */}
            <div className={styles.filterColumnsWrapper}>
              {funders.length > 0 && (
                <CheckboxGroupComponent
                  name="funders"
                  value={selectedFunders}
                  onChange={(value) => handleCheckboxChange(value, 'funders')}
                  checkboxGroupLabel={PlanCreate('checkbox.filterByFunderLabel')}
                  checkboxGroupDescription={PlanCreate('checkbox.filterByFunderDescription')}
                >
                  {funders.map((funder, index) => (
                    <div key={index}>
                      <Checkbox value={funder.uri}>
                        <div className="checkbox">
                          <svg viewBox="0 0 18 18" aria-hidden="true">
                            <polyline points="1 9 7 14 15 4" />
                          </svg>
                        </div>
                        <div className="">
                          <span>
                            {funder.name}
                          </span>
                        </div>
                      </Checkbox>
                    </div>
                  ))}
                </CheckboxGroupComponent>
              )}
            </div>

            {funders.length === 0 && hasBestPracticeTemplates && (
              <CheckboxGroupComponent
                name="bestPractices"
                value={selectedBestPracticeItems}
                onChange={(value) => handleCheckboxChange(value, 'bestPractice')}
                checkboxGroupLabel={PlanCreate('checkbox.filterByBestPracticesLabel')}
                checkboxGroupDescription={PlanCreate('checkbox.filterByBestPracticesDescription')}
              >
                <Checkbox value="DMP Best Practice" aria-label="best practices">
                  <div className="checkbox">
                    <svg viewBox="0 0 18 18" aria-hidden="true">
                      <polyline points="1 9 7 14 15 4" />
                    </svg>
                  </div>
                  <div className="">
                    <span>
                      {PlanCreate('labels.dmpBestPractice')}
                    </span>
                  </div>
                </Checkbox>
              </CheckboxGroupComponent>
            )}
          </div>

          {searchTerm.length > 0 && (
            <div>
              <div><Button data-testid="clear-filter" onPress={resetSearch} className={`${styles.clearFilter} search-match-text link`}>{Global('links.clearFilter')}</Button></div>
            </div>
          )}

          {(publicTemplatesList?.length > 0) ? (
            <>
              {/**Display list of published templates */}
              <section className={`${styles.templatesList} mb-8`} aria-labelledby="public-templates">
                <div className="template-list" role="list" aria-label="Public templates">
                  <TemplateList
                    key={publicTemplatesList.length}
                    templates={publicTemplatesList}
                    onSelect={onSelect}
                  />

                </div>
              </section>

              {/**Only display pagination if there is more than one page */}
              {publicTemplatesList?.length && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  hasPreviousPage={hasPreviousPage}
                  hasNextPage={hasNextPage}
                  handlePageClick={handlePageClick}
                />)}
            </>
          ) : isLoadingTemplates ? (
            <Loading variant="inline" message={Global('messaging.loading')} />
          ) : (
            <p>{Global('messaging.noItemsFound')}</p>
          )}

        </ContentContainer>
      </LayoutContainer >
    </>
  );
};

export default PlanCreate;
