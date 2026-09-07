'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { useLazyQuery } from '@apollo/client/react';

// Components
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  FieldError,
  Input,
  Label,
  Link,
  SearchField,
  Text
} from "react-aria-components";
import PageHeader from "@/components/PageHeader";
import ProjectListItem from "@/components/ProjectListItem";
import { ContentContainer, LayoutContainer } from '@/components/Container';
import ErrorMessages from '@/components/ErrorMessages';
import SkeletonListLoading from '@/components/SkeletonListLoading';
import { TransitionLink } from "@/components/Form";

//GraphQL
import { MyProjectsDocument, MyProjectsQuery } from '@/generated/graphql';

import {
  ProjectItemPlanProps,
  ProjectItemProps,
} from '@/app/types';

// Hooks
import { useScrollToTop } from '@/hooks/scrollToTop';
import { logECS, routePath } from '@/utils/index';

import styles from './ProjectsListPage.module.scss';

const LIMIT = 3;
const LIST_LOAD_TIMEOUT_MS = 30000;

type DashboardProject = NonNullable<
  NonNullable<NonNullable<MyProjectsQuery['myProjects']>['items']>[number]
>;

const ProjectsListPage: React.FC = () => {
  const formatter = useFormatter();
  const errorRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const { scrollToTop } = useScrollToTop();
  const [projects, setProjects] = useState<(ProjectItemProps)[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchButtonClicked, setSearchButtonClicked] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [totalCount, setTotalCount] = useState<number | null>(0);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [fetchProjects, { data: projectData, loading: projectsLoading, error: projectsError }] = useLazyQuery(MyProjectsDocument, {
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'no-cache',
  });
  const [searchResults, setSearchResults] = useState<ProjectItemProps[]>([]);
  const [isSearchFetch, setIsSearchFetch] = useState(false);
  const [firstNewIndex, setFirstNewIndex] = useState<number | null>(null);

  const [searchNextCursor, setSearchNextCursor] = useState<string | null>(null);
  const [searchTotalCount, setSearchTotalCount] = useState<number | null>(0);
  const isSearchFetchRef = useRef(false);

  const Global = useTranslations('Global');
  const Project = useTranslations('ProjectsListPage');
  const ProjectOverview = useTranslations('ProjectOverview');

  const recordProjectsFetchFailure = (context: string, err?: unknown) => {
    setIsPageLoading(false);
    setFetchFailed(true);
    const message = Project('messages.errors.errorRetrievingProjects');
    setErrors(prev => prev.includes(message) ? prev : [...prev, message]);
    logECS('error', context, {
      errors: err,
      url: { path: routePath('projects.index') },
    });
  };

  const resetSearch = async () => {
    setSearchTerm('');
    setIsSearchFetch(false);
    isSearchFetchRef.current = false;
    setFetchFailed(false);
    setProjects([]);
    setSearchResults([]);
    setSearchButtonClicked(false);
    setNextCursor(null);
    setSearchNextCursor(null);
    try {
      await fetchProjects({
        variables: {
          paginationOptions: {
            limit: LIMIT,
          },
          // Distinct from the mount query (no term key) so Apollo does not reuse that result.
          term: '',
        },
      });
    } catch (err) {
      recordProjectsFetchFailure('resetSearch', err);
    }
    scrollToTop(topRef);
  }

  //Update searchTerm state whenever entry in the search field changes
  const handleSearchInput = (value: string) => {
    setSearchTerm(value);
  }

  /* Make new request when search term entered and user clicks "Search" button.*/
  const handleSearch = async () => {

    if (!searchTerm.trim()) {
      return;
    }

    setSearchButtonClicked(true);
    setErrors([]);
    setFetchFailed(false);
    setIsSearchFetch(true);
    isSearchFetchRef.current = true;
    setSearchResults([]);
    setSearchNextCursor(null);

    try {
      await fetchProjects({
        variables: {
          paginationOptions: {
            type: "CURSOR",
            limit: LIMIT,
          },
          term: searchTerm.toLowerCase(),
        },
      });
    } catch (err) {
      recordProjectsFetchFailure('handleSearch', err);
    }
  };

  // Handler for search "Load more"
  const handleSearchLoadMore = async () => {

    if (!searchNextCursor) return;
    setFirstNewIndex(searchResults.length);

    try {
      await fetchProjects({
        variables: {
          paginationOptions: {
            type: "CURSOR",
            cursor: searchNextCursor,
            limit: LIMIT,
          },
          term: searchTerm.toLowerCase(),
        },
      });
    } catch (err) {
      logECS('error', 'handleSearchLoadMore', {
        errors: err,
        url: { path: routePath('projects.index') }
      });
      setErrors(prev => [...prev, Project('messages.errors.failedToLoadMore')]);
    }
  };


  const handleLoadMore = async () => {
    if (!nextCursor) return;

    setFirstNewIndex(projects.length);

    try {
      await fetchProjects({
        variables: {
          paginationOptions: {
            type: "CURSOR",
            cursor: nextCursor,
            limit: LIMIT,
          },
        },
      });

    } catch (err) {
      logECS('error', 'handleLoadMore', {
        errors: err,
        url: { path: routePath('projects.index') }
      });
      setErrors(prev => [...prev, Project('messages.errors.failedToLoadMore')]);
    }
  };

  const parseApiDate = (value: string | number | null | undefined): Date | null => {
    if (value == null || value === '') return null;

    // API often returns epoch millis as a string, e.g. "1785236348000"
    if (typeof value === 'number' || /^\d+$/.test(String(value).trim())) {
      const fromEpoch = new Date(Number(value));
      return Number.isNaN(fromEpoch.getTime()) ? null : fromEpoch;
    }

    const fromString = new Date(String(value).replace(/-/g, '/'));
    return Number.isNaN(fromString.getTime()) ? null : fromString;
  };

  const formatDate = (date: string | number) => {
    const parsedDate = parseApiDate(date);
    if (!parsedDate) return '';

    return formatter.dateTime(parsedDate, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatSummaryDate = (date: string | number | null | undefined) => {
    const parsedDate = parseApiDate(date);
    if (!parsedDate) return '';

    return formatter.dateTime(parsedDate, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPlanUpdatedDate = (date: string | number | null | undefined) => {
    const parsedDate = parseApiDate(date);
    if (!parsedDate) return '';

    return formatter.dateTime(parsedDate, {
      month: 'short',
      day: 'numeric',
    });
  };

  const transformProject = (project: DashboardProject): ProjectItemProps => {
    const funderNames = (project.fundings ?? [])
      .map((fund) => fund?.name?.trim())
      .filter((name): name is string => Boolean(name));
    const grantIds = (project.fundings ?? [])
      .map((fund) => fund?.grantId?.trim())
      .filter((grantId): grantId is string => Boolean(grantId));

    const plans: ProjectItemPlanProps[] = (project.plans ?? []).flatMap((plan) => {
      if (!plan?.id) return [];
      return [{
        name: plan.title || ProjectOverview('plan'),
        dmpId: plan.dmpId,
        link: routePath('projects.dmp.show', {
          projectId: String(project.id),
          dmpId: String(plan.id),
        }),
        status: plan.status ?? null,
        // TODO(api): PlanSearchResult has no current-user role. Request myAccessLevel (or similar) on plans in myProjects.
        role: null,
        modified: formatPlanUpdatedDate(plan.modified) || null,
      }];
    });

    return {
      id: project.id,
      title: project.title || '',
      link: `/projects/${project.id}`,
      funding: funderNames.join(', '),
      defaultExpanded: false,
      startDate: project.startDate ? formatDate(project.startDate) : '',
      endDate: project.endDate ? formatDate(project.endDate) : '',
      members: project.members?.map((member) => ({
        name: member.name || '',
        roles: member.role || '',
        orcid: member.orcid || '',
      })) ?? [],
      grantId: grantIds.join(', ') || null,
      modified: formatSummaryDate(project.modified) || undefined,
      // Prefer collaborator count from the API; empty array becomes 0 ("None").
      // If collaborators is omitted, leave null so the list item can fall back to members.
      collaboratorCount: Array.isArray(project.collaborators)
        ? project.collaborators.length
        : null,
      plans,
      // relatedWorksCount omitted until the list API exposes it
    };
  };

  // Load projects when page loads
  useEffect(() => {
    fetchProjects({
      variables: {
        paginationOptions: {
          limit: LIMIT,
        },
      },
    }).catch((err) => {
      recordProjectsFetchFailure('fetchProjects', err);
    });
  }, []);

  useEffect(() => {
    if (!projectsError) return;
    recordProjectsFetchFailure('fetchProjects', projectsError);
  }, [projectsError]);

  useEffect(() => {
    if (fetchFailed) return;
    const waiting =
      isPageLoading ||
      (isSearchFetch && searchResults.length === 0 && projectsLoading);
    if (!waiting) return;

    const timeoutId = window.setTimeout(() => {
      recordProjectsFetchFailure('fetchProjectsTimeout');
    }, LIST_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [fetchFailed, isPageLoading, isSearchFetch, searchResults.length, projectsLoading]);

  // Transform project data when projectData updates
  useEffect(() => {
    if (!projectData || !projectData.myProjects) return;

    setIsPageLoading(false);
    setFetchFailed(false);

    const items = (projectData.myProjects.items ?? [])
      .filter((item): item is DashboardProject => item != null);
    const transformed = items.map(transformProject);
    const searching = isSearchFetchRef.current;

    if (searching) {
      if (searchResults.length === 0) {
        setSearchResults(transformed);
      } else {
        setSearchResults(prev => [...prev, ...transformed]);
      }
      setSearchNextCursor(projectData.myProjects?.nextCursor ?? null);
      setSearchTotalCount(projectData?.myProjects?.totalCount ?? null);
    } else {
      if (projects.length === 0) {
        setProjects(transformed);
      } else {
        setProjects(prev => [...prev, ...transformed]);
      }

      setNextCursor(projectData.myProjects?.nextCursor ?? null);
      setTotalCount(projectData?.myProjects?.totalCount ?? null);
    }

    // Check for errors
    const projectErrors = items
      .filter((project) => project?.errors?.general || project?.errors?.title)
      .map((project) => project?.errors?.general || Project('messages.errors.errorRetrievingProjects'));

    if (projectErrors.length > 0) {
      setErrors(prev => [...prev, ...projectErrors]);
    }
  }, [projectData]);

  useEffect(() => {
    // Need this to set list of projects back to original, full list after filtering
    if (searchTerm === '') {
      setSearchButtonClicked(false);
    }
  }, [searchTerm])

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
  }, [projects, searchResults, firstNewIndex]);

  // Empty list once GraphQL has responded; totalCount may be omitted (null) when there are no items.
  const showEmptyProjectsState =
    Boolean(projectData?.myProjects) &&
    !searchButtonClicked &&
    projects.length === 0 &&
    (totalCount === 0 || totalCount == null);

  const showListSkeleton =
    !fetchFailed &&
    (isPageLoading ||
      (isSearchFetch && searchResults.length === 0 && projectsLoading));

  return (
    <>
      <PageHeader
        title={Project('title')}
        description={Project('intro')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href="/">{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href="/projects">{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb>{Project('title')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={
          <>
            <TransitionLink
              href={routePath('projects.create')}
              className="button-link button--primary"
            >
              {Global('buttons.createNewPlan')}
            </TransitionLink>
          </>
        }
        className="page-project-list"
      />

      <ErrorMessages errors={errors} ref={errorRef} />

      <LayoutContainer>
        <ContentContainer>
          <div className="searchSection" role="search" ref={topRef}>
            <SearchField>
              <Label>{Global('labels.searchByKeyword')}</Label>
              <Input value={searchTerm} onChange={e => handleSearchInput(e.target.value)} />
              <Button
                onPress={() => {
                  handleSearch();
                }}
              >
                {Global('buttons.search')}
              </Button>
              <FieldError />
              <Text slot="description" className="help">
                {Global('helpText.searchHelpText')}
              </Text>
            </SearchField>
          </div>

          {isSearchFetch && (
            <Button onPress={resetSearch} className={`${styles.searchMatchText} link`}> {Global('links.clearFilter')}</Button>
          )}
          {showListSkeleton ? (
            <SkeletonListLoading count={5} ariaLabel={Global('messaging.loadingList')} />
          ) : searchResults.length > 0 ? (
            <>
              <div className="project-list" role="list" aria-label={Project('projectsList')}>
                {searchResults.map((project, index) => (
                  <ProjectListItem
                    key={project.id ?? `search-${index}`}
                    item={project}
                    data-index={index}
                  />
                ))}
              </div>
              {searchTotalCount && searchTotalCount > searchResults.length && (
                <div className={styles.loadBtnContainer}>
                  <Button
                    type="button"
                    data-testid="search-load-more-btn"
                    onPress={handleSearchLoadMore}
                    isDisabled={!searchNextCursor}
                  >
                    {Global('buttons.loadMore')}
                  </Button>
                  <div>
                    {Global('messaging.numDisplaying', { num: searchResults.length, total: searchTotalCount || '' })}
                  </div>
                  <Button onPress={resetSearch} className={`${styles.searchMatchText} link`}> {Global('links.clearFilter')}</Button>
                </div>
              )}
            </>
          ) : showEmptyProjectsState ? (
            <div
              className="empty-state"
              role="status"
              aria-labelledby="projects-empty-heading"
            >
              <h2 id="projects-empty-heading" className="empty-state-heading">
                {Project('messages.info.noProjectsHeading')}
              </h2>
              <p className="empty-state-description">
                {Project('messages.info.noProjectsDescription')}
              </p>
              <TransitionLink
                href={routePath('projects.create')}
                className="button-link button--primary"
              >
                {Global('buttons.createNewPlan')}
              </TransitionLink>
            </div>
          ) : searchTerm && searchButtonClicked ? (
            <p>{Global('messaging.noItemsFound')}</p>
          ) : (
            <>
              <div className='project-list' role="list" aria-label={Project('projectsList')}>
                {projects.map((project, index) => (
                  <ProjectListItem
                    key={project.id ?? `project-${index}`}
                    item={project}
                    data-index={index}
                  />
                ))}
              </div>
              {totalCount != null && totalCount > projects.length && (
                <div className={styles.loadBtnContainer}>
                  <Button
                    type="button"
                    data-testid="load-more-btn"
                    onPress={handleLoadMore}
                    isDisabled={!nextCursor}
                  >
                    {Global('buttons.loadMore')}
                  </Button>
                  <div className={styles.remainingText}>
                    {Global('messaging.numDisplaying', { num: projects.length, total: totalCount || '' })}
                  </div>
                  {isSearchFetch && (
                    <Button onPress={resetSearch} className={`${styles.searchMatchText} link`}> {Global('links.clearFilter')}</Button>
                  )}
                </div>
              )}
            </>
          )}
        </ContentContainer>
      </LayoutContainer >
    </>
  );
}

export default ProjectsListPage;
