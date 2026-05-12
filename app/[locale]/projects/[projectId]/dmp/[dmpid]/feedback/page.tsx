'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Link,
  Tooltip,
  TooltipTrigger,
} from 'react-aria-components';

// GraphQL
import { useQuery, useMutation } from '@apollo/client/react';
import {
  MeDocument,
  PlanFeedbackStatusDocument,
  ProjectCollaboratorsDocument,
  RequestFeedbackDocument
} from '@/generated/graphql';

// Components
import PageHeader from '@/components/PageHeader';
import ErrorMessages from '@/components/ErrorMessages';
import {
  ContentContainer,
  LayoutWithPanel,
  SidebarPanel,
} from '@/components/Container';
import Loading from '@/components/Loading';
import ExpandableContentSection from '@/components/ExpandableContentSection';
import { FormTextArea } from '@/components/Form';

// Utils and other
import { SanitizeHTML } from '@/utils/sanitize';
import { routePath } from '@/utils/routes';
import logECS from '@/utils/clientLogger';
import { checkErrors, extractErrors } from '@/utils/errorHandler';
import { useToast } from '@/context/ToastContext';
import styles from './ProjectsProjectPlanFeedback.module.scss';

const ProjectsProjectPlanFeedback = () => {
  const params = useParams();
  const toastState = useToast();
  const projectId = params.projectId as string;
  const dmpId = params.dmpid as string;

  // error reference for error messages
  const errorRef = useRef<HTMLDivElement | null>(null);
  // Refs for accessibility
  const successMessageRef = useRef<HTMLSpanElement>(null);

  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // Translations
  const Global = useTranslations('Global');
  const t = useTranslations('ProjectsProjectPlanFeedback');

  // GraphQL queries and mutations
  const { data: meData,
    loading: meLoading,
    error: meError
  } = useQuery(MeDocument);

  const {
    data: feedbackData,
    loading: feedbackLoading,
    error: feedbackError,
    refetch: refetchFeedbackStatus
  } = useQuery(PlanFeedbackStatusDocument, {
    variables: { planId: Number(dmpId) },
  });

  // Get project collaborators
  const { data: collaboratorsData, loading: collaboratorsLoading, error: collaboratorsError } = useQuery(ProjectCollaboratorsDocument,
    {
      variables: { projectId: Number(projectId) },
      skip: (!projectId), // prevents the query from running when no projectId
      fetchPolicy: 'network-only', // always fetch from network
      notifyOnNetworkStatusChange: true
    }
  );

  // Initialize mutation
  const [RequestFeedbackMutation] = useMutation(RequestFeedbackDocument);


  const isPrimaryCollaborator = collaboratorsData?.projectCollaborators?.some(
    (collaborator) =>
      collaborator?.user?.id === meData?.me?.id &&
      collaborator?.accessLevel === "PRIMARY"
  ) ?? false;

  const handleRequestFeedback = async () => {
    setErrorMessages([]);
    setIsSubmitting(true);

    try {
      const response = await RequestFeedbackMutation({
        variables: {
          planId: Number(dmpId),
          messageToOrg: feedbackMessage,
        }
      });

      const [hasErrors, errs] = checkErrors(
        response.data?.requestFeedback?.errors as Record<string, string | null | undefined>,
        ['general', 'planId', 'feedbackComments']
      );

      if (hasErrors) {
        const errorList = extractErrors(errs, ['general', 'planId', 'feedbackComments']);
        setErrorMessages(errorList.length > 0 ? errorList : [Global('messaging.somethingWentWrong')]);
        logECS('error', 'requestFeedback', {
          error: errs,
          url: { path: routePath('projects.dmp.feedback', { projectId, dmpId }) }
        });
        return;
      }

      // Success so refetch feedback status to update UI
      await refetchFeedbackStatus();

      toastState.add(t('messages.success.feedbackRequested'), { type: 'success' });
    } catch (error) {
      setErrorMessages([Global('messaging.somethingWentWrong')]);
      logECS('error', 'requestFeedback', {
        error,
        url: { path: routePath('projects.dmp.feedback', { projectId, dmpId }) }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (meError) {
      setErrorMessages(prev => [...prev, meError.message]);
    }
  }, [meError]);

  useEffect(() => {
    if (feedbackError) {
      setErrorMessages(prev => [...prev, feedbackError.message]);
    }
  }, [feedbackError]);

  useEffect(() => {
    if (collaboratorsError) {
      setErrorMessages(prev => [...prev, collaboratorsError.message]);
    }
  }, [collaboratorsError]);


  if (meLoading || feedbackLoading || collaboratorsLoading) {
    return <Loading message={Global('messaging.loading')} />;
  }

  const feedbackRequested = feedbackData?.planFeedbackStatus?.status === 'REQUESTED';

  return (
    <>
      <PageHeader
        title={t('title')}
        description=""
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.show', { projectId })}>{Global('breadcrumbs.projectOverview')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.dmp.show', { projectId, dmpId })}>{Global('breadcrumbs.planOverview')}</Link></Breadcrumb>
            <Breadcrumb>{t('title')}</Breadcrumb>
          </Breadcrumbs>
        }
        className="page-project-feedback"
      />

      <LayoutWithPanel>
        <ContentContainer>
          <ErrorMessages errors={errorMessages} ref={errorRef} />
          <p>
            {t('description', { orgName: meData?.me?.affiliation?.displayName || t('anonymousOrgName') })}
          </p>

          <div className={styles.messageBox}>
            <p><strong>Hello {meData?.me?.givenName}</strong></p>
            <SanitizeHTML html={meData?.me?.affiliation?.feedbackMessage || ''} />
          </div>

          <div className={styles.feedbackForm}>
            {!feedbackRequested && (
              <FormTextArea
                name="feedback-message"
                label={t('form.label', { orgName: meData?.me?.affiliation?.displayName || t('anonymousOrgName') })}
                placeholder={t('form.placeholder')}
                value={feedbackMessage}
                onChange={setFeedbackMessage}
                richText={false}
                className={styles.messageTextarea}
                disabled={isSubmitting || !isPrimaryCollaborator}
              />
            )}
            <div className={styles.submitSection}>
              {isPrimaryCollaborator ? (
                <Button
                  onPress={handleRequestFeedback}
                  className="react-aria-Button react-aria-Button--primary"
                  isDisabled={isSubmitting || feedbackRequested}
                  aria-describedby={feedbackRequested ? "feedback-success" : undefined}
                >
                  {isSubmitting ? (
                    <>
                      <span className={styles.loadingSpinner} aria-hidden="true"></span>
                      <span className="sr-only">{Global('messaging.submittingSROnly')}</span>
                      {Global('messaging.submitting')}
                    </>
                  ) : (
                    t('form.submitButton')
                  )}
                </Button>
              ) : (
                <TooltipTrigger delay={0}>
                  <Button
                    className={styles.submitButtonDisabled}
                    aria-disabled={true}
                    onPress={() => { }}
                  >
                    {t('form.submitButton')}
                  </Button>
                  <Tooltip
                    placement="bottom"
                    className={`${styles.tooltip} py-2 px-2`}
                  >
                    {t('form.primaryAccessRequired')}
                  </Tooltip>
                </TooltipTrigger>
              )}

              {feedbackRequested && (
                <span
                  ref={successMessageRef}
                  id="feedback-success"
                  className={styles.successMessage}
                  role="status"
                  aria-live="polite"
                  tabIndex={-1}
                >
                  {t('form.successMessage')}
                </span>
              )}
            </div>
          </div>

          <section className={styles.teamFeedbackSection}>
            <h2>{t('teamFeedback.title')}</h2>
            <p>{t('teamFeedback.description')}</p>
            <Link
              href={routePath('projects.collaboration', { projectId })}
              className="react-aria-Button react-aria-Button--secondary"
            >
              {t('teamFeedback.updateAccessButton')}
            </Link>
          </section>
        </ContentContainer>

        <SidebarPanel>
          <div className={styles.sidebarContent}>
            <ExpandableContentSection
              id="university-support-feedback"
              heading={t('sidebar.universitySupport.title')}
              expandLabel={Global('links.expand')}
              summaryCharLimit={150}
            >
              <p>{t('sidebar.universitySupport.description')}</p>

              <p><strong>{t('sidebar.universitySupport.expertsCanTitle')}</strong></p>
              <ul>
                <li>{t('sidebar.universitySupport.expertsCan.0')}</li>
                <li>{t('sidebar.universitySupport.expertsCan.1')}</li>
                <li>{t('sidebar.universitySupport.expertsCan.2')}</li>
              </ul>

              <p>{t('sidebar.universitySupport.requestInfo')}</p>
            </ExpandableContentSection>

            <ExpandableContentSection
              id="team-members-feedback"
              heading={t('sidebar.teamMembers.title')}
              expandLabel={Global('links.expand')}
              summaryCharLimit={150}
            >
              <p>{t('sidebar.teamMembers.description')}</p>

              <p><strong>{t('sidebar.teamMembers.usefulWhenTitle')}</strong></p>
              <ul>
                <li>{t('sidebar.teamMembers.usefulWhen.0')}</li>
                <li>{t('sidebar.teamMembers.usefulWhen.1')}</li>
                <li>{t('sidebar.teamMembers.usefulWhen.2')}</li>
              </ul>

              <p>{t('sidebar.teamMembers.encourageInfo')}</p>
            </ExpandableContentSection>
          </div>
        </SidebarPanel>
      </LayoutWithPanel>
    </>
  );
};

export default ProjectsProjectPlanFeedback;
