'use client';

import React, { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Form,
  Input,
  Label,
  Link,
  Text,
  TextField
} from "react-aria-components";
import { useLazyQuery, useQuery } from '@apollo/client/react';
import {
  ExternalProject,
  SearchExternalProjectsDocument,
  AffiliationByIdDocument
} from '@/generated/graphql';
import PageHeader from "@/components/PageHeader";
import {
  ContentContainer,
  LayoutContainer,
} from "@/components/Container";
import { routePath } from '@/utils/routes';

import styles from './ProjectsCreateProjectProjectSearch.module.scss';
import { TransitionButton } from '@/components/Form';


const formatRoleLabel = (roleUri: string): string => {
  const segment = roleUri.split('/').pop() ?? roleUri;
  return segment.charAt(0).toUpperCase() + segment.slice(1);
};


const ProjectsCreateProjectProjectSearch = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { projectId } = params;
  const affiliationId = searchParams.get('affId');

  // Localization
  const Global = useTranslations('Global');
  const t = useTranslations('ProjectsCreateProjectProjectSearch');

  // States for each search field
  const [projectID, setProjectID] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("Particle");
  const [awardYear, setAwardYear] = useState<string>("");
  const [principalInvestigator, setPrincipalInvestigator] = useState<string>("");

  // State to track if a search has been performed
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [projects, setProjects] = useState<ExternalProject[]>([]);

  const [searchExternalProjectsQuery, { loading, error }] = useLazyQuery(SearchExternalProjectsDocument);

  // Get affiliation URI for affiliationId passed from previous page
  const { data: affiliationData, loading: affiliationLoading, error: affiliationError } = useQuery(AffiliationByIdDocument, {
    variables: {
      affiliationId: Number(affiliationId)
    }
  });

  console.log("***Affiliation Data:", affiliationData);

  // Handles the Search button click
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectID.trim() && !projectName.trim() && !awardYear.trim() && !principalInvestigator.trim()) {
      setHasSearched(false);
      setProjects([]);
      return;
    }

    if (!affiliationId) {
      console.error('Missing affiliationId');
      return;
    }

    if (!affiliationData?.affiliationById?.uri) {
      console.error('Missing affiliation URI');
      setHasSearched(true);
      setProjects([]);
      return;
    }

    // Split PI names by semicolon and trim whitespace
    const piNames = principalInvestigator
      ? principalInvestigator.split(';').map((name) => name.trim()).filter(Boolean)
      : [];

    try {
      const { data } = await searchExternalProjectsQuery({
        variables: {
          input: {
            affiliationId: affiliationData?.affiliationById?.uri,
            awardId: projectID.trim() || undefined,
            awardName: projectName.trim() || undefined,
            awardYear: awardYear.trim() || undefined,
            piNames: piNames.length > 0 ? piNames : undefined,
          },
        },
      });

      setHasSearched(true);
      // Filter out any null results and update state
      setProjects((data?.searchExternalProjects ?? []).filter((p): p is ExternalProject => p !== null));
    } catch (error) {
      console.error('Search failed:', error);
      setHasSearched(true);
      setProjects([]);
    }
  };

  const handleSelectProject = (project: ExternalProject) => {
    setProjectID(project.fundings?.[0]?.funderProjectNumber ?? '');
    setProjectName(project.title ?? '');
    setAwardYear(project.startDate?.slice(0, 4) ?? '');
    setPrincipalInvestigator(
      project.members
        ?.map((m) => `${m.givenName ?? ''} ${m.surName ?? ''}`.trim())
        .filter(Boolean)
        .join('; ') ?? ''
    );
  };

  const handleAddProjectManually = (): Promise<void> => {
    return new Promise(() => {
      router.push(routePath('projects.fundings.add', {
        projectId: projectId as string,
      }));
    });
  };

  return (
    <>
      <PageHeader
        title={t('title')}
        description="Enter details of your project to help find it in this funder's database. The more you enter the more likely it is to find your project."
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.projects')}</Link></Breadcrumb>
          </Breadcrumbs>
        }
        className="page-project-create-project-search"
      />
      <LayoutContainer>
        <ContentContainer>
          {/* Search Form */}
          <Form onSubmit={handleSearch} aria-labelledby="search-section">
            <section id="search-section" className={styles.searchSection}>
              {/* Project ID Field */}
              <TextField className={styles.searchField}>
                <Label htmlFor="project-id">{t('form.projectId')}</Label>
                <Input
                  id="project-id"
                  value={projectID}
                  onChange={(e) => setProjectID(e.target.value)}
                  placeholder={t('form.projectIdPlaceholder')}
                />
                <Text slot="description" className="help">
                  {t('form.projectIdHelpText')}
                </Text>
              </TextField>

              {/* Project Name Field */}
              <TextField className={styles.searchField}>
                <Label htmlFor="project-name">{t('form.projectName')}</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={t('form.projectNamePlaceHolder')}
                />
                <Text slot="description" className="help">
                  {t('form.projectNameDescription')}
                </Text>
              </TextField>

              {/* Award Year Field */}
              <TextField className={styles.searchField}>
                <Label htmlFor="award-year">{t('form.projectAwardYear')}</Label>
                <Input
                  id="award-year"
                  value={awardYear}
                  onChange={(e) => setAwardYear(e.target.value)}
                  placeholder={t('form.projectAwardYearPlaceholder')}
                />
              </TextField>

              {/* Principal Investigator Field */}
              <TextField className={styles.searchField}>
                <Label htmlFor="principal-investigator">{t('form.projectPrincipalInvestigator')}</Label>
                <Input
                  id="principal-investigator"
                  value={principalInvestigator}
                  onChange={(e) => setPrincipalInvestigator(e.target.value)}
                  placeholder={t('form.projectPrincipalInvestigatorPlaceholder')}
                />
                <Text slot="description" className="help">
                  {t('form.projectPrincipalInvestigatorDescription')}
                </Text>
              </TextField>

              {/* Submit Button */}
              <div className={styles.searchField}>
                <TransitionButton
                  type="submit"
                  loadingLabel={Global('buttons.searching')}
                  loadingVariant="inline"
                  isDisabled={loading}
                  showLoading={false}
                >
                  {Global('buttons.search')}
                </TransitionButton>
              </div>
            </section>
          </Form>

          {/* Search Results */}
          {hasSearched && (
            <>
              {projects.length > 0 ? (
                <section aria-labelledby="projects-section">
                  <h3 id="projects-section">{t('headings.projectsFound', { count: projects.length })}</h3>
                  <div className={styles.projectResultsList}>
                    {projects.map((project, index) => {
                      const projectNumber = project.fundings?.[0]?.funderProjectNumber ?? '-';

                      const grantId = project.fundings?.[0]?.grantId ?? '—';

                      const investigators = project.members
                        ?.map((m) => `${m.givenName ?? ''} ${m.surName ?? ''}`.trim())
                        .filter(Boolean)
                        .join('; ') ?? '—';

                      const yearRange = project.startDate
                        ? `${project.startDate.slice(0, 4)}${project.endDate ? `–${project.endDate.slice(0, 4)}` : ''}`
                        : null;
                      return (
                        <div
                          key={index}
                          className={styles.projectResultsListItem}
                          role="group"
                          aria-label={`Project: ${project.title}`}
                        >
                          <div className={styles.projectDetails}>
                            <h4 className={styles.projectName}>
                              {project.title ?? '—'}{yearRange && ` (${yearRange})`}
                            </h4>
                            <dl>
                              <dt>{t('definitions.awardId')}:</dt>
                              <dd>{projectNumber}</dd>
                              <dt>{t('definitions.grantId')}:</dt>
                              <dd>{grantId}</dd>
                              {investigators && (
                                <>
                                  <dt>{t('definitions.principalInvestigator')}:</dt>
                                  <dd>{investigators}</dd>
                                </>
                              )}
                            </dl>
                          </div>
                          <div className={styles.projectSelect}>
                            <Button
                              className="secondary select-button"
                              onPress={() => handleSelectProject(project)}
                              aria-label={`Select ${project.title}`}
                            >
                              {Global('buttons.select')}
                            </Button>
                          </div>
                        </div>
                      );

                    }
                    )}
                  </div>
                </section>
              ) : (
                <section aria-labelledby="no-results-section">
                  <h3 id="no-results-section">{t('headings.noProjectFound')}</h3>
                  <p>
                    {t('descriptions.noProjectFound')}
                  </p>
                </section>
              )}

              {/* Add Project Manually */}
              <section aria-labelledby="manual-section" className="mt-8">
                <h3 id="manual-section">{t('headings.notInThisList')}</h3>
                <p>{t('descriptions.addProjectManually')}</p>
                <TransitionButton
                  type="button"
                  className="add-project-button"
                  onPress={handleAddProjectManually}
                  loadingLabel={Global('buttons.loading')}
                  showLoading={false}
                  aria-label={t('buttons.addProjectManually')}
                >
                  {t('buttons.addProjectManually')}
                </TransitionButton>

              </section>
            </>
          )}
        </ContentContainer>
      </LayoutContainer>
    </>
  );
};

export default ProjectsCreateProjectProjectSearch;
