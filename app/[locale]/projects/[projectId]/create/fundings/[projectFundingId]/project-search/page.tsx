'use client';

import React, { useMemo, useRef, useState, type TransitionStartFunction } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  Breadcrumb,
  Breadcrumbs,
  Form,
  Input,
  Label,
  Link,
  Text,
  TextField
} from "react-aria-components";

// GraphQL
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import {
  ExternalProject,
  SearchExternalProjectsDocument,
  ProjectDocument,
  ProjectFundingsApiDocument,
  ProjectImportDocument
} from '@/generated/graphql';

// Components
import PageHeader from "@/components/PageHeader";
import CreateProjectFlowLayout, {
  FlowActions,
  flowPath,
  fundingFlowPath,
  useCreateProjectFlow,
} from '@/components/CreateProjectFlow';
import ErrorMessages from '@/components/ErrorMessages';
import Loading from '@/components/Loading';

// Utils and other
import { routePath } from '@/utils/routes';
import { useToast } from "@/context/ToastContext";
import logECS from '@/utils/clientLogger';
import styles from './ProjectsCreateProjectProjectSearch.module.scss';
import { TransitionButton } from '@/components/Form';


const ProjectsCreateProjectProjectSearch = () => {
  const router = useRouter();
  const params = useParams();
  const { projectId } = params;
  const projectFundingId = String(params.projectFundingId);
  const { flow } = useCreateProjectFlow();
  const toastState = useToast();
  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Localization
  const Global = useTranslations('Global');
  const Flow = useTranslations('CreateProjectFlow');
  const t = useTranslations('ProjectsCreateProjectProjectSearch');

  // States for each search field
  const [projectID, setProjectID] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");
  const [awardYear, setAwardYear] = useState<string>("");
  const [principalInvestigator, setPrincipalInvestigator] = useState<string>("");

  // State to track if a search has been performed
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [projects, setProjects] = useState<ExternalProject[]>([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const [searchExternalProjectsQuery, { loading }] = useLazyQuery(SearchExternalProjectsDocument);

  const { data: fundingsData, loading: fundingsLoading } = useQuery(ProjectFundingsApiDocument, {
    variables: { projectId: Number(projectId) },
    fetchPolicy: 'network-only',
  });
  const { data: projectData, loading: projectLoading } = useQuery(ProjectDocument, {
    variables: { projectId: Number(projectId) },
    fetchPolicy: 'network-only',
  });

  const funding = fundingsData?.project?.fundings?.find((f) => String(f.id) === projectFundingId);
  const funderUri = funding?.affiliation?.uri;
  const currentProject = projectData?.project;

  const isLoading = fundingsLoading || projectLoading;
  const fundingNotFound = !isLoading && !funderUri;
  // Stable reference so ErrorMessages doesn't re-scroll on every render
  const noFundingErrors = useMemo(() => [Flow('fundingStatus.errors.noFunding')], [Flow]);

  // Initialize useProjectImportMutation for importing project details after selection
  const [projectImportMutation] = useMutation(ProjectImportDocument);

  // Handles the Search button click
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessages([]);

    if (!funderUri) return;

    if (!projectID.trim() && !projectName.trim() && !awardYear.trim() && !principalInvestigator.trim()) {
      setHasSearched(false);
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
            affiliationId: funderUri,
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
      logECS('error', 'searchExternalProjects', {
        error,
        url: { path: routePath('projects.create.projectSearch', { projectId: projectId as string, projectFundingId }) },
      });
      setHasSearched(false);
      setProjects([]);
      setErrorMessages([Flow('projectSearch.searchFailed')]);
    }
  };

  const handleSelectProject = async (
    project: ExternalProject,
    { startTransition }: { startTransition: TransitionStartFunction }
  ): Promise<void> => {
    setErrorMessages([]);

    if (!funderUri || !currentProject) {
      setErrorMessages([t('messages.errors.selectedFailed')]);
      return;
    }

    try {
      const response = await projectImportMutation({
        variables: {
          input: {
            // projectImport overwrites every project column, blanking any field not sent here
            // and resetting isTestProject to false, so carry the current values over.
            project: {
              id: Number(projectId),
              title: project.title || currentProject.title,
              abstractText: project.abstractText || currentProject.abstractText,
              startDate: project.startDate || currentProject.startDate,
              endDate: project.endDate || currentProject.endDate,
              isTestProject: currentProject.isTestProject,
              researchDomainId: currentProject.researchDomain?.id,
            },
            funding: project.fundings?.map((f) => ({
              projectId: Number(projectId),
              affiliationId: funderUri,
              funderProjectNumber: f?.funderProjectNumber ?? undefined,
              grantId: f?.grantId ?? undefined,
              funderOpportunityNumber: f?.funderOpportunityNumber ?? undefined,
            })) ?? [],
            members: project.members?.map((m) => ({
              projectId: Number(projectId),
              affiliationId: m?.affiliationId ?? undefined,
              givenName: m?.givenName ?? undefined,
              surName: m?.surName ?? undefined,
              orcid: m?.orcid ?? undefined,
              email: m?.email ?? undefined,
            })) ?? [],
          },
        },
      });

      const errors = response.data?.projectImport?.errors;
      const hasErrors = errors && Object.values(errors)
        .filter((v) => v && v !== 'ProjectErrors')
        .length > 0;

      if (hasErrors) {
        setErrorMessages([errors?.general ?? t('messages.errors.selectedFailed')]);
      } else {
        toastState.add(
          Flow('projectSearch.projectSelected', { projectTitle: project.title || '' }),
          { type: 'success' }
        );
        startTransition(() => {
          router.push(flowPath('projectDetails', flow, projectId as string));
        });
      }
    } catch (error) {
      logECS('error', 'projectImportMutation', {
        error,
        url: { path: routePath('projects.create.projectSearch', { projectId: projectId as string, projectFundingId }) },
      });
      setErrorMessages([t('messages.errors.selectedFailed')]);
    }
  };

  const handleAddProjectManually = async (
    { startTransition }: { startTransition: TransitionStartFunction }
  ): Promise<void> => {
    startTransition(() => {
      router.push(fundingFlowPath('fundingDetails', flow, projectId as string, projectFundingId));
    });
  };

  const handleChooseFunder = async (
    { startTransition }: { startTransition: TransitionStartFunction }
  ): Promise<void> => {
    startTransition(() => {
      router.push(flowPath('funder', flow, projectId as string));
    });
  };

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.projects')}</Link></Breadcrumb>
          </Breadcrumbs>
        }
        className="page-project-create-project-search"
      />
      <CreateProjectFlowLayout screen="projectSearch" flow={flow}>
        <ErrorMessages errors={fundingNotFound ? noFundingErrors : errorMessages} ref={errorRef} />
        {isLoading && <Loading variant="inline" message={Global('messaging.loading')} />}
        {fundingNotFound && (
          <FlowActions>
            <TransitionButton
              type="button"
              onPress={handleChooseFunder}
              loadingLabel={Global('buttons.loading')}
            >
              {Flow('buttons.chooseFunder')}
            </TransitionButton>
          </FlowActions>
        )}
        {!isLoading && !fundingNotFound && (
          <>
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
                        ?.filter((m) => m.role?.some((r) => r?.includes('/investigation')))
                        .map((m) => `${m.givenName ?? ''} ${m.surName ?? ''}`.trim())
                        .filter(Boolean)
                        .join('; ') ?? '—';

                      const startYear = project.startDate?.slice(0, 4);
                      const endYear = project.endDate?.slice(0, 4);
                      const yearRange = startYear || endYear
                        ? `${startYear ?? '?'}–${endYear ?? '?'}`
                        : null;

                      return (
                        <div
                          key={index}
                          className={styles.projectResultsListItem}
                          role="group"
                          aria-label={`${t('form.projectName')}: ${project.title}`}
                        >
                          <div className={styles.projectDetails}>
                            <h4 className={styles.projectName}>
                              {project.title ?? '—'}{yearRange && ` (${yearRange})`}
                            </h4>
                            <dl className={styles.definitionList}>
                              <div className={styles.definitionListItem}>
                                <dt>{t('definitions.projectNumber')}:</dt>
                                <dd>{projectNumber}</dd>
                              </div>
                              <div className={styles.definitionListItem}>
                                <dt>{t('definitions.grantId')}:</dt>
                                <dd>
                                  {grantId && grantId.startsWith('http') ? (
                                    <a href={grantId} target="_blank" rel="noopener noreferrer">
                                      {grantId}
                                    </a>
                                  ) : (
                                    grantId
                                  )}
                                </dd>

                              </div>
                              {investigators && (
                                <div className={styles.definitionListItem}>
                                  <dt>{t('definitions.principalInvestigator')}:</dt>
                                  <dd>{investigators}</dd>
                                </div>
                              )}
                            </dl>
                          </div>
                          <div className={styles.projectSelect}>
                            <TransitionButton
                              className="secondary select-button"
                              onPress={({ startTransition }) => handleSelectProject(project, { startTransition })}
                              aria-label={`${Global('buttons.select')} ${project.title}`}
                            >
                              {Global('buttons.select')}
                            </TransitionButton>
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
            </>
          )}

              {/* Add Project Manually */}
              <section aria-labelledby="manual-section" className="mt-8">
                <h2 id="manual-section" className="heading-3">{t('headings.notInThisList')}</h2>
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
        {!fundingNotFound && <FlowActions />}
      </CreateProjectFlowLayout>
    </>
  );
};

export default ProjectsCreateProjectProjectSearch;
