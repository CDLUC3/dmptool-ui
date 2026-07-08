'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  FieldError,
  Input,
  Label,
  Link,
  SearchField,
  Text,
} from "react-aria-components";

//Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer, } from '@/components/Container';
import TemplateList from '@/components/TemplateList';
import ErrorMessages from '@/components/ErrorMessages';
import Pagination from '@/components/Pagination';

//GraphQL
import { useMutation, useLazyQuery } from '@apollo/client/react';
import {
  PublishedTemplateSearchResults,
  TemplateSearchResult,
  AddTemplateDocument,
  TemplatesDocument,
  PublishedTemplatesDocument,
  VersionedTemplateSearchResult,
} from '@/generated/graphql';

// Other
import { logECS, routePath } from '@/utils/index';
import {
  TemplateItemProps,
  TemplateSearchResultInterface,
  PaginatedTemplateSearchResultsInterface,
} from '@/app/types';
import { toSentenceCase } from '@/utils/general';
import { useToast } from '@/context/ToastContext';
import { useFormatDate } from '@/hooks/useFormatDate';
import { handleApolloError } from '@/utils/apolloErrorHandler';

// # of templates displayed
const LIMIT = 5;

type TemplateType = 'published' | 'myTemplates';

interface FetchTemplateByTypeParams {
  templateType: TemplateType;
  page?: number;
  searchTerm?: string;
}

// Step 2 of the Create Template start pages - Select existing template
const TemplateSelectTemplatePage = ({ templateName }: { templateName: string }) => {
  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  // check if this is initial mount
  const isInitialMount = useRef(true);
  const formatDate = useFormatDate();
  const router = useRouter();
  const toastState = useToast();

  // State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);

  const [publishedTemplates, setPublishedTemplates] = useState<TemplateItemProps[]>([]);
  const [myTemplates, setMyTemplates] = useState<TemplateItemProps[]>([]);


  // Separate pagination states
  const [publishedPagination, setPublishedPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  const [myTemplatesPagination, setMyTemplatesPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  //Localization keys
  const SelectTemplate = useTranslations('TemplateSelectTemplatePage');
  const Global = useTranslations('Global');

  // Separate lazy queries for published sections
  const [fetchPublishedTemplates, { data: publishedTemplatesData, loading: publishedTemplatesLoading }] = useLazyQuery(PublishedTemplatesDocument);
  const [fetchMyTemplates, { data: myTemplatesData, loading: myTemplatesLoading }] = useLazyQuery(TemplatesDocument);

  // GraphQL mutation for adding the new template
  const [addTemplateMutation] = useMutation(AddTemplateDocument, {
    notifyOnNetworkStatusChange: true,
  });

  const clearErrors = () => {
    setErrors([]);
  }

  // Lazy fetch - get templates by type with pagination and search term
  const fetchTemplatesByType = async ({
    templateType,
    page = 1,
    searchTerm = ''
  }: FetchTemplateByTypeParams) => {
    try {
      if (templateType === 'published') {
        let offsetLimit = 0;
        if (page) {
          setPublishedPagination(prev => ({ ...prev, currentPage: page }));
          offsetLimit = (page - 1) * LIMIT;
        }
        await fetchPublishedTemplates({
          variables: {
            paginationOptions: {
              offset: offsetLimit,
              limit: LIMIT,
              type: "OFFSET",
              sortDir: "DESC",
              bestPractice: false
            },
            term: searchTerm,
          }
        });
      } else {
        let offsetLimit = 0;
        if (page) {
          setMyTemplatesPagination(prev => ({ ...prev, currentPage: page }));
          offsetLimit = (page - 1) * LIMIT;
        }
        await fetchMyTemplates({
          variables: {
            paginationOptions: {
              offset: offsetLimit,
              limit: LIMIT,
              type: "OFFSET",
              sortDir: "DESC",
              bestPractice: true
            },
            term: searchTerm,
          }
        });
      }
    } catch (err) {
      handleApolloError(err, 'TemplateSelectTemplatePage.fetchTemplatesByType');
    }
  };

  // Handle page click for public templates
  const handlePublicPageClick = async (page: number) => {
    await fetchTemplatesByType({ templateType: 'published', page, searchTerm });
  };
  // Handle page click for org templates
  const handleMyTemplatesPageClick = async (page: number) => {
    await fetchTemplatesByType({ templateType: 'myTemplates', page, searchTerm });
  };

  // zero out search and filters
  const resetSearch = async () => {
    setSearchTerm('');
    // Reset both paginations to first page
    setPublishedPagination(prev => ({ ...prev, currentPage: 1 }));
    setMyTemplatesPagination(prev => ({ ...prev, currentPage: 1 }));

    try {
      // Fetch both types without search term
      await Promise.all([
        fetchTemplatesByType({ templateType: 'published', page: 1, searchTerm: '' }),
        fetchTemplatesByType({ templateType: 'myTemplates', page: 1, searchTerm: '' })
      ]);
    } catch (error) {
      handleApolloError(error, 'TemplateSelectTemplatePage.resetSearch');

    }
  }


  // Handle search input changes
  const handleInputChange = (value: string) => {
    // Update search term immediately for UI responsiveness
    setSearchTerm(value);
  };

  // Handle search when user presses search button
  const handleSearchInput = async (term: string) => {
    setSearchTerm(term);
    clearErrors();

    // Reset both paginations to first page
    setPublishedPagination(prev => ({ ...prev, currentPage: 1 }));
    setMyTemplatesPagination(prev => ({ ...prev, currentPage: 1 }));

    // Fetch both types with search term
    await Promise.all([
      fetchTemplatesByType({ templateType: 'published', page: 1, searchTerm: term }),
      fetchTemplatesByType({ templateType: 'myTemplates', page: 1, searchTerm: term })
    ]);
  };

  // When user selects a template from myTemplates (org templates)
  const onSelectMyTemplate = async (templateId: number) => {
    addTemplateMutation({
      variables: {
        name: templateName,
        copyFromTemplateId: templateId,
      },
    }).then(response => {
      if (response?.data) {
        const responseData = response?.data?.addTemplate;
        if (responseData && responseData.errors) {
          const errorMessages = Object.values(responseData.errors)
            .filter((error) => error) as string[];
          setErrors(errorMessages);
        }
        clearErrors();

        const newTemplateId = response?.data?.addTemplate?.id;
        if (newTemplateId) {
          router.push(routePath('template.show', { templateId: newTemplateId }));
        }
      }
    }).catch(err => {
      logECS('error', 'handleClick', {
        error: err,
        url: { path: routePath('template.create') }
      });
    });
  };

  // When user selects a template from publishedTemplates (versioned templates)
  const onSelectPublishedTemplate = async (versionedTemplateId: number) => {
    addTemplateMutation({
      variables: {
        name: templateName,
        copyFromVersionedTemplateId: versionedTemplateId,
      },
    }).then(response => {
      if (response?.data) {
        const responseData = response?.data?.addTemplate;
        if (responseData && responseData.errors) {
          const errorMessages = Object.values(responseData.errors)
            .filter((error) => error) as string[];
          setErrors(errorMessages);
        }
        clearErrors();

        const newTemplateId = response?.data?.addTemplate?.id;
        if (newTemplateId) {
          router.push(routePath('template.show', { templateId: newTemplateId }));
        }
      }
    }).catch(err => {
      logECS('error', 'handleClick', {
        error: err,
        url: { path: routePath('template.create') }
      });
    });
  };

  async function handleStartNew() {
    addTemplateMutation({
      variables: { name: templateName },
    }).then(response => {
      if (response?.data) {
        const responseData = response?.data?.addTemplate;
        if (responseData && responseData.errors) {
          const errorMessages = Object.values(responseData.errors)
            .filter((error) => error) as string[];
          setErrors(errorMessages);
        }
        clearErrors();

        const newTemplateId = response?.data?.addTemplate?.id;
        if (newTemplateId) {
          router.push(routePath('template.show', { templateId: newTemplateId }));
        }
      }
    }).catch(err => {
      logECS('error', 'handleStartNew', {
        error: err,
        url: { path: routePath('template.create') }
      });
    });
  }

  // Transform public templates into easier to use properties
  const transformPublishedTemplates = async (
    templates: PublishedTemplateSearchResults | null
  ): Promise<{ publishedTemplates: TemplateItemProps[] }> => {


    // Filter out null and undefined templates and only include PUBLIC visibility
    let publishedTemplates = templates?.items?.filter(
      template =>
        template !== null &&
        template !== undefined &&
        template.visibility === 'PUBLIC'
    ) || [];

    // Sort so that bestPractice=true are at the top
    publishedTemplates = publishedTemplates.sort((a, b) => {
      // Place true before false (descending)
      if (a?.bestPractice === b?.bestPractice) return 0;
      if (a?.bestPractice) return -1;
      return 1;
    });

    if (publishedTemplates.length === 0) {
      return { publishedTemplates: [] };
    }
    const transformedTemplates = await Promise.all(
      publishedTemplates.map(async (template: VersionedTemplateSearchResult | null) => ({
        id: template?.id,
        title: template?.name || "",
        description: template?.description || "",
        link: routePath('template.show', { templateId: Number(template?.id) }),
        funder: template?.ownerDisplayName || template?.name,
        lastUpdated: template?.modified ? formatDate(template?.modified) : null,
        lastRevisedBy: template?.modifiedByName || null,
        publishStatus: Global('published'),// These are all published templates
        hasAdditionalGuidance: false,
        bestPractices: template?.bestPractice || false,
        defaultExpanded: false,
        visibility: template?.visibility,
      }))
    );

    return { publishedTemplates: transformedTemplates };
  };

  // Transform Org Templates into easier to use properties
  const transformMyTemplates = async (
    templates: PaginatedTemplateSearchResultsInterface | null
  ): Promise<{ myTemplates: TemplateItemProps[] }> => {

    const myTemplates = templates?.items?.filter(template => template !== null && template !== undefined) || [];

    if (myTemplates.length === 0) {
      return { myTemplates: [] };
    }
    const transformedTemplates = await Promise.all(
      myTemplates.map(async (template: TemplateSearchResultInterface | null) => ({
        id: template?.id,
        title: template?.name || "",
        description: template?.description || "",
        link: routePath('template.show', { templateId: Number(template?.id) }),
        funder: template?.ownerDisplayName || template?.name,
        lastUpdated: template?.modified ? formatDate(template?.modified) : null,
        lastRevisedBy: template?.modifiedByName || null,
        publishStatus: template?.isDirty ? Global('notPublished') : Global('published'),
        hasAdditionalGuidance: false,
        defaultExpanded: false,
        visibility: template?.latestPublishVisibility ? toSentenceCase(template.latestPublishVisibility) : 'Organization',
      }))
    );

    return { myTemplates: transformedTemplates };
  };

  // Process published templates when publishedTemplatesData changes
  useEffect(() => {
    const processPublishedTemplates = async () => {
      if (publishedTemplatesData?.publishedTemplates?.items) {
        const transformedTemplates = await transformPublishedTemplates(
          publishedTemplatesData.publishedTemplates
        );

        const publishedTemplates = transformedTemplates.publishedTemplates;

        setPublishedTemplates(publishedTemplates);

        // Update published template pagination
        const totalCount = publishedTemplatesData?.publishedTemplates?.totalCount ?? 0;
        const totalPages = Math.ceil(totalCount / LIMIT);
        setPublishedPagination({
          currentPage: publishedPagination.currentPage, // Keep current page
          totalPages,
          hasNextPage: publishedTemplatesData?.publishedTemplates?.hasNextPage ?? false,
          hasPreviousPage: publishedTemplatesData?.publishedTemplates?.hasPreviousPage ?? false
        });
      } else {
        setPublishedTemplates([]);
      }
    };
    processPublishedTemplates();
  }, [publishedTemplatesData]);

  // Process Org Templates when myTemplatesData changes
  useEffect(() => {
    const processMyTemplates = async () => {
      const safeMyTemplates = {
        ...myTemplatesData?.myTemplates,
        items: (myTemplatesData?.myTemplates?.items ?? []).filter((t): t is TemplateSearchResult => t !== null && t !== undefined),
      };

      if (myTemplatesData?.myTemplates?.items) {
        const transformedTemplates = await transformMyTemplates(safeMyTemplates);
        setMyTemplates(transformedTemplates.myTemplates);

        // Update org templates pagination
        const totalCount = myTemplatesData?.myTemplates?.totalCount ?? 0;
        const totalPages = Math.ceil(totalCount / LIMIT);
        setMyTemplatesPagination({
          currentPage: myTemplatesPagination.currentPage,
          totalPages,
          hasNextPage: myTemplatesData?.myTemplates?.hasNextPage ?? false,
          hasPreviousPage: myTemplatesData?.myTemplates?.hasPreviousPage ?? false
        });
      } else {
        setMyTemplates([]);
      }
    };
    processMyTemplates();
  }, [myTemplatesData]);

  useEffect(() => {
    // Skip on initial mount since the other useEffect handles it
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Need this to set list of templates back to original
    if (searchTerm === '') {
      resetSearch();
    }
  }, [searchTerm])

  // Fetch templates on initial load
  useEffect(() => {
    const load = async () => {
      await fetchTemplatesByType({ templateType: 'published', page: 1 });
      await fetchTemplatesByType({ templateType: 'myTemplates', page: 1 });
    };
    load();
  }, []);

  useEffect(() => {
    // If the template name entered on step 1 is missing from the page, we redirect back to step 1 with a toast message
    if (!templateName) {
      toastState.add(SelectTemplate('messages.missingTemplateName'), { type: 'error' })
      router.push(routePath('template.create', { step: '1' }));
    }
  }, [templateName])

  return (
    <>
      <PageHeader
        title={SelectTemplate('title')}
        description=""
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('template.index')}>{Global('breadcrumbs.templates')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('template.create', { step: '1' })}>{Global('breadcrumbs.createTemplate')}</Link></Breadcrumb>
            <Breadcrumb>{Global('breadcrumbs.selectExistingTemplate')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={
          <></>
        }
        className="page-template-list"
      />

      <LayoutContainer>
        <ContentContainer>
          <>
            <ErrorMessages errors={errors} ref={errorRef} />
            <div className="searchSection" role="search" ref={topRef}>
              <SearchField aria-label="Template search">
                <Label>{Global('labels.searchByKeyword')}</Label>
                <Input
                  aria-describedby="search-help"
                  value={searchTerm}
                  onChange={e => handleInputChange(e.target.value)} />
                <Button
                  onPress={() => {
                    handleSearchInput(searchTerm);
                  }}
                >
                  {Global('buttons.search')}
                </Button>
                <FieldError />
                <Text slot="description" className="help" id="search-help">
                  {Global('helpText.searchHelpText')}
                </Text>
              </SearchField>
            </div>

            {/*My Org Templates */}
            <div data-testid="my-org-templates">
              {myTemplates.length > 0 && (
                <h2 id="org-templates">
                  {SelectTemplate('headings.myOrgTemplates')}
                </h2>
              )}

              <div className="template-list">
                {myTemplatesLoading ? (
                  <p>{Global('messaging.loading')}</p>
                ) : myTemplates.length > 0 ? (
                  <section className="mb-8" role="list" aria-labelledby="org-templates">
                    {
                      <TemplateList
                        templates={myTemplates}
                        onSelect={onSelectMyTemplate}
                      />
                    }
                  </section>
                ) : (
                  <p>{Global('messaging.noItemsFound')}</p>
                )}
              </div>
              {myTemplates.length > 0 && (
                <Pagination
                  currentPage={myTemplatesPagination.currentPage}
                  totalPages={myTemplatesPagination.totalPages}
                  hasPreviousPage={myTemplatesPagination.hasPreviousPage}
                  hasNextPage={myTemplatesPagination.hasNextPage}
                  handlePageClick={handleMyTemplatesPageClick}
                />
              )}
            </div>

            {/*Public Templates */}
            <div data-testid="published-templates">
              {publishedTemplates.length > 0 && (
                <h2 id="published-templates">
                  {SelectTemplate('headings.publicTemplates')}
                </h2>
              )}

              <div className="template-list">
                {publishedTemplatesLoading ? (
                  <p>{Global('messaging.loading')}</p>
                ) : publishedTemplates.length > 0 ? (

                  <section className="mb-8" role="list" aria-labelledby="published-templates">
                    {
                      <TemplateList
                        templates={publishedTemplates}
                        onSelect={onSelectPublishedTemplate}
                      />
                    }
                  </section>
                ) : (
                  <p>{Global('messaging.noItemsFound')}</p>
                )}
              </div>
              {publishedTemplates.length > 0 && (
                <Pagination
                  currentPage={publishedPagination.currentPage}
                  totalPages={publishedPagination.totalPages}
                  hasPreviousPage={publishedPagination.hasPreviousPage}
                  hasNextPage={publishedPagination.hasNextPage}
                  handlePageClick={handlePublicPageClick}
                />
              )}
            </div>

            {/** Create New Template */}
            <section className="mb-8" aria-labelledby="create-new">
              <h2 id="create-new">
                {SelectTemplate('headings.createNew')}
              </h2>
              <Button
                className="tertiary"
                onPress={handleStartNew}
                data-testid="startNewButton"
              >
                {SelectTemplate('buttons.startNew')}
              </Button>
            </section>

          </>
        </ContentContainer >
      </LayoutContainer >
    </>
  );
}

export default TemplateSelectTemplatePage;
