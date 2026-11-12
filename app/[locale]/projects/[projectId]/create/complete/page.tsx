'use client';

import React, { useMemo } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { Link } from 'react-aria-components';

import { ProjectDocument } from '@/generated/graphql';
import PageHeader from '@/components/PageHeader';
import CreateProjectFlowLayout, {
  DEFAULT_FLOW,
  FlowBreadcrumbs,
  flowPath,
  useFlowState,
} from '@/components/CreateProjectFlow';
import TransitionLink from '@/components/TransitionLink';
import ErrorMessages from '@/components/ErrorMessages';
import Loading from '@/components/Loading';
import { routePath } from '@/utils/routes';
import styles from './setupComplete.module.scss';

const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

const ProjectsCreateProjectSetupComplete = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const format = useFormatter();
  const projectId = String(params.projectId);
  const planId = searchParams?.get('planId');
  const flow = useFlowState();
  const errorRef = React.useRef<HTMLDivElement | null>(null);

  const Global = useTranslations('Global');
  const Flow = useTranslations('CreateProjectFlow');

  const { data, loading, error } = useQuery(ProjectDocument, {
    variables: { projectId: Number(projectId) },
  });
  const project = data?.project;
  const title = project?.title ?? '';
  const overviewHref = routePath('projects.show', { projectId });

  const funders = useMemo(() => {
    const names = (project?.fundings ?? [])
      .map(funding => funding?.affiliation?.displayName || funding?.affiliation?.name)
      .filter((name): name is string => !!name);
    return format.list(new Set(names));
  }, [project?.fundings, format]);

  const planTitle = planId
    ? project?.plans?.find(plan => String(plan?.id) === planId)?.title ?? ''
    : '';

  const heading = planId ? Flow('complete.setupTitle') : Flow('complete.projectTitle');

  const descriptionValues = {
    title,
    funders,
    planTitle,
    hasFunders: funders ? 'yes' : 'no',
    hasPlanTitle: planTitle ? 'yes' : 'no',
    strong,
  };
  const overviewLink = (chunks: React.ReactNode) => <Link href={overviewHref}>{chunks}</Link>;

  return (
    <>
      <PageHeader
        title={heading}
        description=""
        showBackButton={false}
        breadcrumbs={<FlowBreadcrumbs current={heading} />}
        className="page-project-create-complete"
      />
      <CreateProjectFlowLayout screen="complete" flow={flow}>
        <ErrorMessages errors={error ? [Flow('complete.loadFailed')] : []} ref={errorRef} />
        {loading ? (
          <Loading variant="inline" message={Global('messaging.loading')} />
        ) : project && (
          <>
            <span className={styles.check} aria-hidden="true">✓</span>
            <p id="setup-complete-summary">
              {planId
                ? Flow.rich('complete.setupDescription', descriptionValues)
                : Flow.rich('complete.projectDescription', descriptionValues)}
            </p>
            <p>
              {planId
                ? Flow.rich('complete.overviewHintPlan', { link: overviewLink })
                : Flow.rich('complete.overviewHintProject', { link: overviewLink })}
            </p>

            <div className={styles.actions}>
              {planId ? (
                <TransitionLink
                  href={routePath('projects.dmp.show', { projectId, dmpId: planId })}
                  className="button-link button--primary"
                >
                  {Flow('complete.startWriting')}
                </TransitionLink>
              ) : (
                <TransitionLink
                  href={flowPath('planStart', DEFAULT_FLOW, projectId)}
                  className="button-link button--primary"
                >
                  {Flow('complete.createFirstPlan')}
                </TransitionLink>
              )}
            </div>
          </>
        )}
      </CreateProjectFlowLayout>
    </>
  );
};

export default ProjectsCreateProjectSetupComplete;
