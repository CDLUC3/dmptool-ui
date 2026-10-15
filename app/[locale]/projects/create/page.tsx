'use client';

import React, { useRef, useState, type TransitionStartFunction } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import {
  Breadcrumb,
  Breadcrumbs,
  Form,
  Link,
  Radio,
  Text
} from "react-aria-components";

import { MyProjectsDocument } from '@/generated/graphql';
import PageHeader from "@/components/PageHeader";
import CreateProjectFlowLayout, { FlowActions, flowPath } from '@/components/CreateProjectFlow';
import { RadioGroupComponent, TransitionButton } from '@/components/Form';
import ErrorMessages from '@/components/ErrorMessages';
import Loading from '@/components/Loading';
import { routePath } from '@/utils/routes';

type Gate = 'existing' | 'new';

const PROJECT_LIMIT = 50;

const ProjectsStartPlan = () => {
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement | null>(null);

  const Global = useTranslations('Global');
  const Flow = useTranslations('CreateProjectFlow');

  const [gate, setGate] = useState<Gate | ''>('');
  const [projectId, setProjectId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data, loading, error } = useQuery(MyProjectsDocument, {
    variables: { paginationOptions: { type: 'CURSOR', limit: PROJECT_LIMIT } },
    skip: gate !== 'existing',
  });
  const projects = data?.myProjects?.items?.filter((p) => p?.id) ?? [];

  const handleSubmit = async ({ startTransition }: { startTransition: TransitionStartFunction }) => {
    setSubmitted(true);
    if (!gate) return;
    if (gate === 'new') {
      startTransition(() => {
        router.push(routePath('projects.create', {}, { intent: 'plan' }));
      });
      return;
    }
    if (!projectId) return;
    startTransition(() => {
      router.push(flowPath('planStart', { intent: 'plan', fromExisting: true }, projectId));
    });
  };

  return (
    <>
      <PageHeader
        title={Flow('startPlan.title')}
        description={Flow('startPlan.description')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href="/">{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href="/projects">{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb>{Flow('startPlan.title')}</Breadcrumb>
          </Breadcrumbs>
        }
        className="page-project-start-plan"
      />
      <CreateProjectFlowLayout screen="startPlan" flow={{ intent: 'plan', fromExisting: gate === 'existing' }}>
        <ErrorMessages errors={error ? [Flow('startPlan.errors.loadProjects')] : []} ref={errorRef} />
        <Form onSubmit={(e) => e.preventDefault()}>
          <RadioGroupComponent
            name="startPlanGate"
            value={gate}
            radioGroupLabel={Flow('startPlan.gateLabel')}
            onChange={(value) => {
              setSubmitted(false);
              setGate(value as Gate);
            }}
            isInvalid={submitted && !gate}
            errorMessage={Flow('startPlan.errors.chooseGate')}
          >
            <Radio value="existing">{Flow('startPlan.yesExisting')}</Radio>
            <Radio value="new">{Flow('startPlan.noNew')}</Radio>
          </RadioGroupComponent>

          {gate === 'existing' && (
            loading ? (
              <Loading variant="inline" message={Global('messaging.loading')} />
            ) : projects.length === 0 ? (
              !error && <p>{Flow('startPlan.noProjects')}</p>
            ) : (
              <RadioGroupComponent
                name="startPlanProject"
                value={projectId}
                radioGroupLabel={Flow('startPlan.projectsLabel')}
                onChange={(value) => {
                  setSubmitted(false);
                  setProjectId(value);
                }}
                isInvalid={submitted && !projectId}
                errorMessage={Flow('startPlan.errors.chooseProject')}
              >
                {projects.map((project) => (
                  <div key={project!.id}>
                    <Radio value={String(project!.id)}>{project!.title}</Radio>
                    <Text slot="description">
                      {Flow('startPlan.projectMeta', {
                        funder: project!.fundings?.map((f) => f.name).filter(Boolean).join(', ') || Flow('startPlan.noFunder'),
                        plans: project!.plans?.length ?? 0,
                      })}
                    </Text>
                  </div>
                ))}
              </RadioGroupComponent>
            )
          )}

          <FlowActions>
            <TransitionButton
              type="submit"
              onPress={handleSubmit}
              loadingLabel={Global('buttons.loading')}
            >
              {Flow('buttons.next')}
            </TransitionButton>
          </FlowActions>
        </Form>
      </CreateProjectFlowLayout>
    </>
  );
};

export default ProjectsStartPlan;
