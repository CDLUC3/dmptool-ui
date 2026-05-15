'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Breadcrumb, Breadcrumbs, Link } from "react-aria-components";
import { useParams } from 'next/navigation';
import { useTranslations } from "next-intl";
import { DocumentNode } from '@apollo/client';

// GraphQL
import { useQuery } from '@apollo/client/react';
import {
  PlanDocument,
  MeDocument,
} from '@/generated/graphql';

// Components
import {
  ContentContainer,
  LayoutWithPanel,
  SidebarPanel
} from "@/components/Container";
import { DmpIcon } from '@/components/Icons';
import ErrorMessages from '@/components/ErrorMessages';
import PageHeader from "@/components/PageHeader";
import SafeHtml from '@/components/SafeHtml';
import GuidancePanel from '@/components/GuidancePanel';
import Loading from '@/components/Loading';
import NotificationHeader from '../Notification';
import { TransitionLink } from "@/components/Form";

// Utils and other
import { stripHtml } from '@/utils/general';
import { routePath } from '@/utils/routes';
import styles from './PlanOverviewSectionPage.module.scss';
import { useGuidanceData } from '@/app/hooks/useGuidanceData';
import { useGuidanceMutations, UseGuidanceMutationsProps } from "@/app/hooks/useGuidanceMutations";

interface VersionedQuestion {
  id: string;
  title: string;
  link: string;
  hasAnswer: boolean;
}

type SectionType = 'BASE' | 'CUSTOM';

interface RawSection {
  name?: string | null;
  requirements?: string | null;
  introduction?: string | null;
  guidance?: string | null;
}

interface RawQuestion {
  id?: number | null;
  questionText?: string | null;
  hasAnswer?: boolean | null;
}

export interface SectionPageConfig {
  /** URL param key for the section ID ("sid" or "csid"). */
  sectionIdParamKey: string;
  /** GraphQL document for fetching questions. */
  questionsDocument: DocumentNode;
  /** Variable key for the questions query ("versionedSectionId" | "versionedCustomSectionId"). */
  questionsVariableKey: string;
  /** GraphQL document for fetching the section. */
  sectionDocument: DocumentNode;
  /** Variable key(s) for the section query — shape differs between BASE and CUSTOM. */
  buildSectionVariables: (ids: { sectionId: number; planId: number }) => Record<string, number>;
  /** Extract questions array from the questions query result. */
  extractQuestions: (data: Record<string, RawQuestion[] | null | undefined>) => RawQuestion[] | null | undefined;
  /** Extract section object from the section query result. */
  extractSection: (data: Record<string, RawSection | null | undefined>) => RawSection | null | undefined;
  /** Extract the section name for the breadcrumb from the section query result. */
  extractBreadcrumbName: (data: Record<string, RawSection | null | undefined>) => string | null | undefined;
  /** Build the route link for an individual question. */
  buildQuestionLink: (ids: {
    projectId: string;
    dmpId: string;
    sectionId: number;
    question: RawQuestion & { questionType?: string | null; versionedQuestionId?: number | null; customQuestionId?: number | null };
  }) => string;
  /** Whether this is a BASE or CUSTOM section. */
  sectionType: SectionType;
  /** Build params for useGuidanceMutations. */
  buildGuidanceMutationParams: (ids: {
    planId: number;
    sectionId: number;
  }) => UseGuidanceMutationsProps;
}



export const PlanOverviewSectionPageShared: React.FC<{ config: SectionPageConfig }> = ({ config }) => {
  const {
    sectionIdParamKey,
    questionsDocument,
    questionsVariableKey,
    sectionDocument,
    buildSectionVariables,
    extractQuestions,
    extractSection,
    extractBreadcrumbName,
    buildQuestionLink,
    sectionType,
    buildGuidanceMutationParams,
  } = config;

  // Localization
  const t = useTranslations('PlanOverview');
  const Guidance = useTranslations('Guidance');
  const Section = useTranslations('SectionPage');
  const Global = useTranslations('Global');

  // Get route params
  const params = useParams();
  const sectionId = params[sectionIdParamKey] as string;
  const dmpId = params.dmpid as string; // plan id
  const projectId = params.projectId as string;


  // Validate that sectionId is present
  if (!sectionId) {
    return <ErrorMessages errors={[t('errors.invalidSectionId')]} />;
  }

  // State for navigation visibility
  const [showNavigation, setShowNavigation] = useState(true);
  // Track whether the question should be read-only based on plan status and user role
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  // Validate that dmpId is a valid number
  const planId = parseInt(dmpId);

  // Get user data
  const { data: me } = useQuery(MeDocument);

  const { data: questionsData, loading: questionsLoading, error: questionsError } = useQuery(questionsDocument, {
    variables: {
      planId,
      [questionsVariableKey]: Number(sectionId)
    },
    skip: !sectionId
  });

  const { data: planData, loading: planLoading } = useQuery(PlanDocument, {
    variables: { planId },
    skip: !planId
  });

  const { data: sectionData, loading: sectionLoading } = useQuery(sectionDocument, {
    variables: buildSectionVariables({ sectionId: Number(sectionId), planId }),
    skip: !sectionId
  });


  // Derive unified section shape here, after all queries have run
  const section = useMemo(() => {
    const raw = extractSection(sectionData as Record<string, RawSection | null | undefined>);
    if (!raw) return null;
    return {
      name: raw.name ?? '',
      requirements: raw.requirements ?? null,
      introduction: raw.introduction ?? null,
      guidance: raw.guidance ?? null,
    };
  }, [sectionData]);

  // Determine if user is a collaborator with edit access - this will allow them to see "Update" on the section cards and access the question modals even if the plan is read-only
  const isEditCollaborator = useMemo(() => {
    const myId = me?.me?.id;
    if (!myId || !planData?.plan?.project?.collaborators) return false;

    return planData.plan.project.collaborators.some(
      (collaborator) =>
        collaborator?.user?.id === myId &&
        collaborator?.accessLevel === "EDIT"
    );
  }, [me?.me?.id, planData?.plan?.project?.collaborators]);


  const questions: VersionedQuestion[] = useMemo(() => {
    const source = extractQuestions(questionsData as Record<string, RawQuestion[] | null | undefined>);
    return source
      ?.filter((q): q is NonNullable<typeof q> => q !== null)
      .map((q) => ({
        id: q.id?.toString() || '',
        title: q.questionText || '',
        link: buildQuestionLink({ projectId, dmpId, sectionId: Number(sectionId), question: q }),
        hasAnswer: q.hasAnswer || false,
      })) || [];
  }, [questionsData]);

  // versionedTemplateId for guidance filtering
  const versionedTemplateId = planData?.plan?.versionedTemplate?.id;

  // Use the guidance data hook to get section tags and matched guidance
  // as well as handlers for adding/removing guidance organizations
  const { sectionTagsMap, guidanceItems } = useGuidanceData({
    planId: parseInt(dmpId),
    versionedSectionId: Number(sectionId),
    sectionType,
  });


  // Use guidance mutations hook (mutations only, no data)
  const { addGuidanceOrganization, removeGuidanceOrganization, clearError, guidanceError } =
    useGuidanceMutations(
      buildGuidanceMutationParams({ planId, sectionId: Number(sectionId) })
    );


  // Set read-only state based on plan status and user role
  useEffect(() => {
    setIsReadOnly(planData?.plan?.readOnly || true);
  }, [planData]);

  // Hide navigation when close to footer
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;

      const distanceToBottom = documentHeight - scrollTop - windowHeight;

      // Hide if we're within 200px of the bottom
      setShowNavigation(distanceToBottom > 200);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simple error handling - check for invalid DMP ID
  if (isNaN(planId)) {
    return <ErrorMessages errors={[t('errors.invalidDmpId')]} />;
  }

  if (questionsLoading || sectionLoading || planLoading) {
    return <Loading />;
  }


  if (questionsError) {
    return <div>{Section('errors.errorLoadingSections', { message: questionsError.message })}</div>;
  }

  // Plan sections data for rendering
  const planSections = planData?.plan?.versionedSections || [];
  const sectionBelongsToPlan = planSections.some(
    (s) => s.versionedSectionId === Number(sectionId) || s.customSectionId === Number(sectionId)
  );
  // Check if section belongs to this plan
  if (!sectionBelongsToPlan) {
    return <ErrorMessages errors={[t('errors.sectionNotFound')]} />;
  }

  const plan = {
    id: planData?.plan?.id?.toString() || '',
    title: planData?.plan?.versionedTemplate?.template?.name || '',
    funder_name: planData?.plan?.project?.fundings?.[0]?.affiliation?.displayName || '',
    feedbackStatus: planData?.plan?.feedbackStatus?.status ?? '',
  };

  return (
    <>
      <PageHeader
        title={section?.name || "Section"}
        description=""
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs aria-label={t('navigation.navigation')}>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.show', { projectId })}>{Global('breadcrumbs.projectOverview')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.dmp.show', { projectId, dmpId })}>{Global('breadcrumbs.planOverview')}</Link></Breadcrumb>
            <Breadcrumb>
              {extractBreadcrumbName(sectionData as Record<string, RawSection | null | undefined>) || "Section"}

            </Breadcrumb>
          </Breadcrumbs>
        }
        actions={null}
        className="page-project-list"
      />

      <LayoutWithPanel>
        {plan?.feedbackStatus === "REQUESTED" && isReadOnly && (
          <NotificationHeader
            title={t("feedbackNotification.title")}
          >
            <p>{t("feedbackNotification.description")}</p>
          </NotificationHeader>
        )}
        <ContentContainer>
          <div className={styles.contentWrapper}>
            {/* Subtle plan navigation for very large screens */}
            <nav
              className={`${styles.planNavigation} ${!showNavigation ? styles.planNavigationHidden : ''}`}
              aria-labelledby="plan-nav-title"
            >
              <h2 id="plan-nav-title" className={"hidden-accessibly"}>{Section('navigation.planNavigation')}</h2>

              <Link
                href={routePath('projects.dmp.show', { projectId, dmpId })}
                className={styles.planOverviewLink}
                aria-label="Go to plan overview"
              >
                {Section('navigation.planOverview')}
              </Link>

              {planSections.length > 0 && (
                <ul className={styles.sectionsList} role="list" aria-label="Plan sections">
                  {planSections.map((section) => (
                    <li key={section.versionedSectionId ?? `custom-${section.customSectionId}`}>
                      <Link
                        href={routePath('projects.dmp.show', {
                          projectId,
                          dmpId
                        })}
                        className={`${styles.sectionLink} ${section.versionedSectionId === Number(sectionId) ? styles.currentSection : ''
                          }`}
                        aria-label={`Go to ${section.title} section`}
                        aria-current={(section.versionedSectionId ?? section.customSectionId) === Number(sectionId)}
                      >
                        {section.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </nav>

            <div className="container">
              {section?.introduction && (
                <section aria-label={t('headings.introduction')}>
                  <h3 className="h4">{t('headings.introduction')}</h3>
                  <SafeHtml html={section.introduction} />
                </section>
              )}
              <section aria-label={"Requirements"}>
                {section?.requirements && (
                  <>
                    <h3 className="h4">{t('headings.requirementsBy', { funder: plan.funder_name })}</h3>
                    <SafeHtml html={section?.requirements} />
                  </>
                )}
              </section>

              {questions.length === 0 ? (
                <section className={styles.noQuestionsMessage}>
                  <h3>{Section('headings.noQuestionsAvailable')}</h3>
                  <p>{Section('headings.noQuestionsInSection')}</p>
                </section>
              ) : (
                questions.map((question) => {
                  const canEditSections = !isReadOnly || isEditCollaborator;

                  // Determine the action label for the section button
                  const sectionActionLabel = !canEditSections
                    ? t("sections.view")
                    : question.hasAnswer
                      ? t("sections.update")
                      : t("sections.start");
                  return (
                    <section
                      key={question.id}
                      className={styles.questionCard}
                      aria-labelledby={`question-title-${question.id}`}
                    >
                      <div className={styles.questionHeader}>
                        <div className={styles.questionTitle}>
                          <h3 id={`question-title-${question.id}`}>
                            {stripHtml(question.title)}
                          </h3>
                          <p aria-live="polite">
                            <span
                              className={styles.progressIndicator}
                              aria-label={`Question status: ${question.hasAnswer ? t('question.answered') : t('question.notAnswered')}`}
                            >
                              <DmpIcon
                                icon={question.hasAnswer ? 'check_circle' : 'cancel'}
                                classes={`${styles.progressIcon} ${!question.hasAnswer ? styles.progressIconInactive : ''}`}
                              />
                              {question.hasAnswer ? t('question.answered') : t('question.notAnswered')}
                            </span>
                          </p>
                        </div>
                        <TransitionLink
                          href={question.link}
                          aria-label={t('sections.ariaLabel', {
                            action: question.hasAnswer ? t('sections.update') : t('sections.start'),
                            title: question.title
                          })}
                          className="react-aria-Button react-aria-Button--secondary"
                        >
                          {sectionActionLabel}
                        </TransitionLink>
                      </div>
                    </section>
                  )
                })
              )}
            </div>
          </div>
        </ContentContainer>

        <SidebarPanel>
          <div className="status-panel-content side-panel">
            <h2 className="h4">{Guidance('title')}</h2>
            <GuidancePanel
              userAffiliationId={me?.me?.affiliation?.uri}
              ownerAffiliationId={planData?.plan?.versionedTemplate?.owner?.uri}
              versionedTemplateId={versionedTemplateId!}
              guidanceItems={guidanceItems}
              sectionTags={sectionTagsMap}
              guidanceError={guidanceError}
              onAddOrganization={addGuidanceOrganization}
              onRemoveOrganization={removeGuidanceOrganization}
              onClearError={clearError}
            />
          </div>
        </SidebarPanel>
      </LayoutWithPanel>
    </>
  );
}

export default PlanOverviewSectionPageShared;