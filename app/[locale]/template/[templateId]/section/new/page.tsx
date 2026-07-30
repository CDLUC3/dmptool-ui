'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useLazyQuery } from '@apollo/client/react';

import {
  SectionErrors,
  VersionedSectionSearchResult,
  VersionedSectionSearchResults,
  AddSectionDocument,
  PublishedSectionsDocument,
  TemplateDocument
} from '@/generated/graphql';

// Components
import { ContentContainer, LayoutContainer } from '@/components/Container';
import PageHeader from "@/components/PageHeader";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeading
} from "@/components/Card/card";
import ErrorMessages from '@/components/ErrorMessages';
import Pagination from '@/components/Pagination';

//Other utils
import { checkErrors } from '@/utils/errorHandler';

import { scrollToTop } from '@/utils/general';
import { routePath } from '@/utils/routes';
import logECS from '@/utils/clientLogger';
import styles from './newSectionPage.module.scss';

// # of sections displayed per section type
const LIMIT = 6;

type SectionType = 'org' | 'bestPractice';

interface FetchSectionsByTypeParams {
  sectionType: SectionType;
  page?: number;
  searchTerm?: string;
}

interface SectionInterface {
  id?: number | null;
  name: string;
  modified?: string | null;
  bestPractice?: boolean | null;
  isDirty?: boolean | null;
  templateName?: string | null;
  questionCount?: number | null;
}

const SectionTypeSelectPage: React.FC = () => {

  const [errors, setErrors] = useState<string[]>([]);
  const [bestPracticeSections, setBestPracticeSections] = useState<SectionInterface[]>([]);
  const [orgSections, setOrgSections] = useState<SectionInterface[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [initialLoading, setInitialLoading] = useState(true);


  // Separate pagination states
  const [orgPagination, setOrgPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  const [bestPracticePagination, setBestPracticePagination] = useState({
    currentPage: 1,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });


  //For scrolling to error in modal window
  const errorRef = useRef<HTMLDivElement | null>(null);
  // Scrolling to top
  const topRef = useRef<HTMLDivElement>(null);
  // Get templateId param
  const params = useParams();
  const router = useRouter();
  const templateId = String(params.templateId); // From route /template/:templateId

  // Initialize user addSection mutation
  const [addSectionMutation] = useMutation(AddSectionDocument);

  //Localization keys
  const AddNewSection = useTranslations('SectionTypeSelectPage');
  const createSection = useTranslations('CreateSectionPage');
  const Global = useTranslations('Global');

  // Separate lazy queries for published sections
  const [fetchOrgSections, { data: orgSectionsData, loading: orgLoading }] = useLazyQuery(PublishedSectionsDocument);
  const [fetchBestPracticeSections, { data: bestPracticeData, loading: bestPracticeLoading }] = useLazyQuery(PublishedSectionsDocument);

  const resetSearch = useCallback(() => {
    setSearchTerm('');
    handleSearchInput('');
    scrollToTop(topRef);
  }, [scrollToTop]);

  const clearErrors = () => {
    setErrors([])
  }


  const fetchSectionsByType = async ({
    sectionType,
    page = 1,
    searchTerm = ''
  }: FetchSectionsByTypeParams) => {
    if (sectionType === 'org') {
      let offsetLimit = 0;
      if (page) {
        setOrgPagination(prev => ({ ...prev, currentPage: page }));
        offsetLimit = (page - 1) * LIMIT;
      }
      await fetchOrgSections({
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
        setBestPracticePagination(prev => ({ ...prev, currentPage: page }));
        offsetLimit = (page - 1) * LIMIT;
      }
      await fetchBestPracticeSections({
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
  };
  // Handle page click for org sections
  const handleOrgPageClick = async (page: number) => {
    await fetchSectionsByType({ sectionType: 'org', page, searchTerm });
  };
  // Handle page click for best practice sections
  const handleBestPracticePageClick = async (page: number) => {
    await fetchSectionsByType({ sectionType: 'bestPractice', page, searchTerm });
  };

  // Make GraphQL mutation request to clone a section
  const copyPublishedSection = async (section: SectionInterface) => {
    if (section) {
      try {
        const response = await addSectionMutation({
          variables: {
            input: {
              templateId: Number(templateId),
              copyFromVersionedSectionId: section.id,
              name: section.name,
            },
          },
          // Refetch the template query to update the UI after adding a section
          refetchQueries: [
            { query: TemplateDocument, variables: { templateId: Number(templateId) } }
          ]
        });

        if (response.data?.addSection) {

          const [hasErrors, errs] = checkErrors(
            response.data.addSection.errors as SectionErrors,
            ['general', 'name']
          );

          if (hasErrors) {
            setErrors([String(errs.general)]);
            return;
          }

          // Success redirect to the edit section page for the newly copied section
          router.push(routePath('template.section.slug', { templateId, section_slug: String(response.data.addSection.id) }));
        } else {
          setErrors([createSection('messages.errorCreatingSection')]);
        }

      } catch (error) {
        logECS('error', 'copyPublishedSection', {
          error,
          url: { path: routePath('template.section.new', { templateId }) }
        });
        setErrors([createSection('messages.errorCreatingSection')]);
      }
    }
  };


  // Handle search input
  const handleSearchInput = async (term: string) => {
    setSearchTerm(term);
    clearErrors();

    // Reset both paginations to first page
    setOrgPagination(prev => ({ ...prev, currentPage: 1 }));
    setBestPracticePagination(prev => ({ ...prev, currentPage: 1 }));

    // Fetch both types with search term
    await Promise.all([
      fetchSectionsByType({ sectionType: 'org', page: 1, searchTerm: term }),
      fetchSectionsByType({ sectionType: 'bestPractice', page: 1, searchTerm: term })
    ]);
  };

  // Handle input changes
  const handleInputChange = (value: string) => {
    // Update search term immediately for UI responsiveness
    setSearchTerm(value);
    if (value === '') {
      //reset search
      resetSearch();
    }
  };

  const transformSectionsData = async (sectionsData: VersionedSectionSearchResults): Promise<{
    orgSections: SectionInterface[];
    bestPracticeSections: SectionInterface[];
  }> => {
    const publishedSections = sectionsData?.items?.filter(section => section !== null && section !== undefined) as VersionedSectionSearchResult[] || [];

    if (publishedSections.length === 0) {
      return { orgSections: [], bestPracticeSections: [] };
    }

    const transformedSections = publishedSections?.map((section: VersionedSectionSearchResult) => {
      return {
        id: section?.id ?? null,
        name: section?.name ?? '',
        modified: section?.modified,
        bestPractice: section?.bestPractice ?? false,
        templateName: section?.versionedTemplateName ?? '',
        questionCount: section?.versionedQuestionCount
      }
    });

    const orgSections = transformedSections.filter((section: SectionInterface) => section?.bestPractice === false);
    const bestPracticeSections = transformedSections.filter((section: SectionInterface) => section?.bestPractice === true);

    // Remove duplicates between org and best practice sections
    const filteredBestPractice = bestPracticeSections.filter(
      (item: SectionInterface) => !orgSections.some((org: SectionInterface) => org.name === item.name)
    );

    return { orgSections, bestPracticeSections: filteredBestPractice };
  };


  // Process organization sections when orgSectionsData changes
  useEffect(() => {
    const processOrgSections = async () => {
      if (orgSectionsData?.publishedSections?.items) {
        const transformedSections = await transformSectionsData(
          orgSectionsData.publishedSections
        );
        // Filter to only org sections (non-best practice)
        const orgSections = transformedSections.orgSections;
        setOrgSections(orgSections);

        // Update org-specific pagination
        const totalCount = orgSectionsData?.publishedSections?.totalCount ?? 0;
        const totalPages = Math.ceil(totalCount / LIMIT);
        setOrgPagination({
          currentPage: orgPagination.currentPage, // Keep current page
          totalPages,
          hasNextPage: orgSectionsData?.publishedSections?.hasNextPage ?? false,
          hasPreviousPage: orgSectionsData?.publishedSections?.hasPreviousPage ?? false
        });
      } else {
        setOrgSections([]);
      }
    };
    processOrgSections();
  }, [orgSectionsData]);

  // Process best practice sections when bestPracticeData changes
  useEffect(() => {
    const processBestPracticeSections = async () => {
      if (bestPracticeData?.publishedSections?.items) {
        const transformedSections = await transformSectionsData(bestPracticeData.publishedSections);

        // Filter to only best practice sections
        const bpSections = transformedSections.bestPracticeSections.filter(section => section?.bestPractice === true);
        setBestPracticeSections(bpSections);

        // Update best practice-specific pagination
        const totalCount = bestPracticeData?.publishedSections?.totalCount ?? 0;
        const totalPages = Math.ceil(totalCount / LIMIT);
        setBestPracticePagination({
          currentPage: bestPracticePagination.currentPage,
          totalPages,
          hasNextPage: bestPracticeData?.publishedSections?.hasNextPage ?? false,
          hasPreviousPage: bestPracticeData?.publishedSections?.hasPreviousPage ?? false
        });
      } else {
        setBestPracticeSections([]);
      }
    };
    processBestPracticeSections();
  }, [bestPracticeData]);


  useEffect(() => {
    const load = async () => {
      await fetchSectionsByType({ sectionType: 'org', page: 1 });
      await fetchSectionsByType({ sectionType: 'bestPractice', page: 1 });
      setInitialLoading(false);
    };
    load();
  }, []);


  if (initialLoading) {
    return <div>Loading...</div>; // only for the very first load, otherwise there is flapping when a user clicks on pagination buttons
  }


  return (
    <>
      <PageHeader
        title={AddNewSection('headings.addNewSection')}
        description={AddNewSection('intro')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('template.index', { templateId })}>{Global('breadcrumbs.templates')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('template.show', { templateId })}>{Global('breadcrumbs.editTemplate')}</Link></Breadcrumb>
            <Breadcrumb>{Global('breadcrumbs.addNewSection')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={null}
        className=""
      />

      <LayoutContainer>
        <ContentContainer>
          <div className="searchSection" role="search" ref={topRef}>
            <ErrorMessages errors={errors} ref={errorRef} />
            {/* Search Field */}
            <SearchField>
              <Label>{AddNewSection('search.label')}</Label>
              <Input
                aria-describedby="search-help"
                value={searchTerm}
                onChange={e => handleInputChange(e.target.value)}

              />
              <Button
                onPress={() => {
                  // Call your filtering function without changing the input value
                  handleSearchInput(searchTerm);
                }}
              >
                {Global('buttons.search')}
              </Button>
              <FieldError />
              <Text slot="description" className="help">
                {AddNewSection('search.helpText')}
              </Text>
            </SearchField>
          </div>

          {searchTerm.length > 0 && (
            <div className="clear-filter">
              <div className="search-match-text"><Button data-testid="clear-filter" onPress={resetSearch} className="search-match-text link">{Global('links.clearFilter')}</Button></div>
            </div>
          )}
          <div>

            {/*Organization Sections */}
            <div>
              {orgSections.length > 0 && (

                <h2>{AddNewSection('headings.previouslyCreatedSections')}</h2>
              )}

              <div className="card-grid-list">
                {orgLoading ? (
                  <p>{Global('messaging.loading')}</p>
                ) : orgSections.length > 0 ? (
                  orgSections.map((section, index) => (
                    <section key={index}>
                      <Card>
                        <CardHeading className={styles.cardHeading}>{section.name}</CardHeading>
                        <CardBody>
                          <p>Template: {section.templateName}</p>
                          {AddNewSection.rich("questionsCount", {
                            count: section.questionCount ? section.questionCount : 0,
                            p: (chunks) => <p>{chunks}</p>,
                          })}
                        </CardBody>
                        <CardFooter>
                          <Button
                            onPress={() => copyPublishedSection(section)}
                            className="button-link secondary">
                            {Global('buttons.select')}
                          </Button>
                        </CardFooter>
                      </Card>
                    </section>
                  ))
                ) : searchTerm.length === 0 ? null : ( // Only show "no items" message when searching
                  <p>{Global('messaging.noItemsFound')}</p>
                )}
              </div>
              {orgSections.length > 0 && (
                <Pagination
                  currentPage={orgPagination.currentPage}
                  totalPages={orgPagination.totalPages}
                  hasPreviousPage={orgPagination.hasPreviousPage}
                  hasNextPage={orgPagination.hasNextPage}
                  handlePageClick={handleOrgPageClick}
                />
              )}

            </div>

            {/* Best Practice sections */}
            <div>
              {bestPracticeSections.length > 0 && (
                <h2>{AddNewSection('headings.bestPracticeSections')}</h2>
              )}

              <div className="card-grid-list">
                {bestPracticeLoading ? (
                  <p>{Global('messaging.loading')}</p>
                ) : bestPracticeSections.length > 0 ? (
                  bestPracticeSections.map((section, index) => (
                    <div key={index}>
                      <Card>
                        <CardHeading>{section.name}</CardHeading>
                        <CardBody>
                          <p>Template: {section.templateName}</p>
                          {AddNewSection.rich("questionsCount", {
                            count: section.questionCount ? section.questionCount : 0,
                            p: (chunks) => <p>{chunks}</p>,
                          })}
                        </CardBody>
                        <CardFooter>
                          <Button
                            onPress={() => copyPublishedSection(section)}
                            className="button-link secondary">
                            {Global('buttons.select')}
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  ))
                ) : searchTerm.length === 0 ? null : ( // Only show "no items" message when searching
                  <p>{Global('messaging.noItemsFound')}</p>
                )}
              </div>

              {bestPracticeSections.length > 0 && bestPracticePagination.totalPages > 1 && (
                <Pagination
                  currentPage={bestPracticePagination.currentPage}
                  totalPages={bestPracticePagination.totalPages}
                  hasPreviousPage={bestPracticePagination.hasPreviousPage}
                  hasNextPage={bestPracticePagination.hasNextPage}
                  handlePageClick={handleBestPracticePageClick}
                />
              )}
            </div>

            <h2>
              {AddNewSection('headings.buildNewSection')}
            </h2>
            <p>
              {AddNewSection('newSectionDescription')}
            </p>
            <Link href={routePath('template.section.create', { templateId })}
              className="button-link secondary">{AddNewSection('buttons.createNew')}</Link>
          </div>
        </ContentContainer>
      </LayoutContainer >
    </>
  );
}

export default SectionTypeSelectPage;
