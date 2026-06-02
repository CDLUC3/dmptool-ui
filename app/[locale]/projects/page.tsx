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
import Loading from '@/components/Loading';
import { TransitionLink } from "@/components/Form";

//GraphQL
import { MyProjectsDocument } from '@/generated/graphql';

import {
  ProjectItemProps,
  ProjectSearchResultInterface,
  PaginatedProjectSearchResultsInterface
} from '@/app/types';

// Hooks
import { useScrollToTop } from '@/hooks/scrollToTop';
import { logECS, routePath } from '@/utils/index';

import styles from './ProjectsListPage.module.scss';

const LIMIT = 3;

const ProjectsListPage: React.FC = () => {
  const formatter = useFormatter();
  const errorRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const { scrollToTop } = useScrollToTop();
  const [projects, setProjects] = useState<(ProjectItemProps)[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  // Initializing isPageLoading to true to show loading state until we have results or an error
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchButtonClicked, setSearchButtonClicked] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [totalCount, setTotalCount] = useState<number | null>(0);
  const [fetchProjects, { data: projectData }] = useLazyQuery(MyProjectsDocument, {
    notifyOnNetworkStatusChange: true,
  });
  const [searchResults, setSearchResults] = useState<ProjectItemProps[]>([]);
  const [isSearchFetch, setIsSearchFetch] = useState(false);
  const [firstNewIndex, setFirstNewIndex] = useState<number | null>(null);


  // Add separate state for search pagination
  const [searchNextCursor, setSearchNextCursor] = useState<string | null>(null);
  const [searchTotalCount, setSearchTotalCount] = useState<number | null>(0);


  // Translation keys
  const Global = useTranslations('Global');
  const Project = useTranslations('ProjectsListPage');


  // zero out search and filters
  const resetSearch = () => {
    setSearchTerm('');
    setIsSearchFetch(false);
    setProjects([]); // Clear existing projects
    setSearchResults([]); // Clear search results
    setSearchButtonClicked(false);
    setNextCursor(null); // Reset cursor
    setSearchNextCursor(null); // Reset search cursor
    fetchProjects({
      variables: {
        paginationOptions: {
          limit: LIMIT,
        },
      },
    });
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
    setIsSearchFetch(true);
    setSearchResults([]); // Clear previous search results
    setSearchNextCursor(null); // Reset search cursor


    await fetchProjects({
      variables: {
        paginationOptions: {
          type: "CURSOR",
          limit: LIMIT,
        },
        term: searchTerm.toLowerCase(),
      },
    });
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
      setErrors(prev => [...prev, 'Failed to load more projects']);
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
      setErrors(prev => [...prev, 'Failed to load more projects']);
    }
  };

  const formatDate = (date: string | number) => {
    const parsedDate = typeof date === "number"
      ? new Date(date)
      : new Date(date.replace(/-/g, "/")); // Replace dashes with slashes for compatibility

    if (isNaN(parsedDate.getTime())) {
      return "Invalid Date"; // Handle invalid input gracefully
    }

    return formatter.dateTime(parsedDate, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Load projects when page loads
  useEffect(() => {
    fetchProjects({
      variables: {
        paginationOptions: {
          limit: LIMIT,
        },
      },
    });
  }, []);

  // Transform project data when projectData updates
  useEffect(() => {
    if (!projectData || !projectData.myProjects) return;

    const processProjects = async (projectsData: PaginatedProjectSearchResultsInterface | null) => {
      const items = projectsData?.items ?? [];

      // Transform each project
      const transformed = await Promise.all(
        items.map(async (project) => ({
          title: project?.title || "",
          link: `/projects/${project?.id}`,
          funding: project?.fundings?.map((fund) => fund?.name).join(', ') || '',
          defaultExpanded: false,
          startDate: project?.startDate ? formatDate(project.startDate) : '',
          endDate: project?.endDate ? formatDate(project.endDate) : '',
          members: project?.members?.map((member) => ({
            name: member.name || '',
            roles: member.role || '',
            orcid: member.orcid || ''
          })) ?? [],
          grantId: project?.fundings?.map((fund) => fund?.grantId).join(', ') || '',
        }))
      );

      if (isSearchFetch) {
        // Handle search results - backend returns only new items for pagination
        if (searchResults.length === 0) {
          // First search request - set all results
          setSearchResults(transformed);
        } else {
          // Subsequent search requests - append new items
          setSearchResults(prev => [...prev, ...transformed]);
        }
        setSearchNextCursor(projectData.myProjects?.nextCursor ?? null);
        setSearchTotalCount(projectData?.myProjects?.totalCount ?? null);
      } else {
        // Handle regular pagination - backend returns only new items for pagination
        if (projects.length === 0) {
          // First load - set all results
          setProjects(transformed);
          setIsPageLoading(false); // Data loaded, stop showing loading state
        } else {
          // Subsequent loads - append new items (backend sends only new items)
          setProjects(prev => [...prev, ...transformed]);
        }

        setNextCursor(projectData.myProjects?.nextCursor ?? null);
        setTotalCount(projectData?.myProjects?.totalCount ?? null);
      }
    };

    processProjects({
      ...projectData.myProjects,
      items: projectData.myProjects.items?.filter((item): item is ProjectSearchResultInterface => item !== null) ?? []
    });

    // Check for errors
    const items = projectData.myProjects.items ?? [];
    const projectErrors = items
      .filter((project) => project?.errors?.general || project?.errors?.title)
      .map((project) => project?.errors?.general || Project('messages.errors.errorRetrievingProjects'));

    if (projectErrors.length > 0) {
      setErrors(prev => [...prev, ...projectErrors]);
    }
  }, [projectData, isSearchFetch]); // REMOVED projects.length and searchResults.length to avoid circular dependencies

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

  if (isPageLoading) {
    return <Loading message={Global('messaging.loading')} />;
  }

  return (
    <>
      <PageHeader
        title={Global('breadcrumbs.planDashboard')}
        description={Project('intro')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href="/">{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href="/projects">{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb>{Global('breadcrumbs.planDashboard')}</Breadcrumb>
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
          {searchResults.length > 0 ? (
            <div className="template-list" role="list">
              {searchResults.map((project, index) => (
                <div
                  key={`search-${project.link}-${index}`}
                  data-index={index}
                >
                  <ProjectListItem item={project} />
                </div>
              ))}
              {searchTotalCount && searchTotalCount > searchResults.length && (
                <div className={styles.loadBtnContainer}>
                  <Button
                    type="button"
                    data-testid="search-load-more-btn"
                    onPress={handleSearchLoadMore}
                    aria-label="load more search results"
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
            </div>
          ) : (
            <>
              <div className='template-list' role="list">
                {searchTerm && searchButtonClicked ? (
                  <p>{Global('messaging.noItemsFound')}</p>
                ) : projects.length === 0 && totalCount === 0 ? (
                  <div className="empty-state" role="status">
                    <h2 className="empty-state-heading">
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
                ) : (
                  <>
                    {projects.map((project, index) => (
                      <div
                        key={`project-${project.link}-${index}`}
                        data-index={index}
                      >
                        <ProjectListItem item={project} />
                      </div>
                    ))}
                    {totalCount != null && totalCount > projects.length && (
                      <div className={styles.loadBtnContainer}>
                        <Button
                          type="button"
                          data-testid="load-more-btn"
                          onPress={handleLoadMore}
                          aria-label="load more"
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
              </div>
            </>
          )}
        </ContentContainer>
      </LayoutContainer >
    </>
  );
}

export default ProjectsListPage;
