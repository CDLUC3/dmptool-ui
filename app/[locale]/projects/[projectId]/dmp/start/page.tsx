'use client';

import { useState, type ReactNode, type TransitionStartFunction } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import {
  Breadcrumb,
  Breadcrumbs,
  Form,
  Link,
  Radio,
  Text,
} from "react-aria-components";

//Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import {
  RadioGroupComponent,
  TransitionButton
} from "@/components/Form";
import CreateProjectFlowLayout, {
  FlowActions,
  flowPath,
  useCreateProjectFlow,
} from '@/components/CreateProjectFlow';

import { routePath } from '@/utils/index';

const ProjectsProjectPlanNew = () => {
  // Get projectId param
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.projectId); // From route /projects/:projectId
  const { inFlow, flow } = useCreateProjectFlow();

  const REDIRECT_TO_DMP_CREATE = inFlow
    ? flowPath('planCreate', flow, projectId)
    : routePath('projects.dmp.create', { projectId });
  const REDIRECT_TO_DMP_UPLOAD = inFlow
    ? flowPath('planUpload', flow, projectId)
    : routePath('projects.dmp.upload', { projectId });

  // Localization keys
  const t = useTranslations('ProjectsProjectPlanNew');
  const Global = useTranslations('Global');
  const Flow = useTranslations('CreateProjectFlow');

  const [dmpPlan, setDmpPlan] = useState({
    startNewPlan: 'true',
  });

  const updateProjectContent = (
    key: string,
    value: string
  ) => {
    setDmpPlan((prevContents) => ({
      ...prevContents,
      [key]: value,
    }));
  };

  // Handle changes from RadioGroup
  const handleRadioChange = (value: string) => {
    updateProjectContent('startNewPlan', value);
  };

  // Handle form submit
  const handleFormSubmit = async ({ startTransition }: { startTransition: TransitionStartFunction }) => {
    const destination = dmpPlan.startNewPlan === 'true'
      ? REDIRECT_TO_DMP_CREATE
      : REDIRECT_TO_DMP_UPLOAD;


    // router.push called synchronously inside startTransition so TransitionButton's
    // isPending correctly tracks the real navigation.
    startTransition(() => {
      router.push(destination);
    });
  };

  const wrapLayout = (children: ReactNode) => inFlow
    ? <CreateProjectFlowLayout screen="planStart" flow={flow}>{children}</CreateProjectFlowLayout>
    : <LayoutContainer><ContentContainer>{children}</ContentContainer></LayoutContainer>;

  return (
    <>
      <PageHeader
        title={inFlow ? Flow('planStart.title') : t('title')}
        description=""
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href="/">{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link
              href="/projects">{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb><Link
              href={`/projects/${projectId}`}>{Global('breadcrumbs.projectOverview')}</Link></Breadcrumb>
            <Breadcrumb>{Global('breadcrumbs.startDMP')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={null}
        className="page-project-list"
      />
      {wrapLayout(
        <Form onSubmit={(e) => e.preventDefault()} className="project-detail-form">
          {inFlow && <p data-testid="plan-start-intro">{Flow('planStart.description')}</p>}
          <div className="project-type-section">
            <RadioGroupComponent
              name="projectType"
              value={dmpPlan.startNewPlan}
              aria-label={t('labels.startNewOrUploadExisting')}
              radioGroupLabel={inFlow ? Flow('planStart.label') : ''}
              onChange={handleRadioChange}
            >
              <div>
                <Radio value="true">{inFlow ? Flow('planStart.options.create') : t('labels.startNewPlan')}</Radio>
                {inFlow && <Text slot="description">{Flow('planStart.options.createDescription')}</Text>}
              </div>

              <div>
                <Radio value="false">{inFlow ? Flow('planStart.options.upload') : t('labels.uploadExistingPlan')}</Radio>
                {inFlow && <Text slot="description">{Flow('planStart.options.uploadDescription')}</Text>}
              </div>
            </RadioGroupComponent>
          </div>

          <FlowActions>
            <TransitionButton
              type="submit"
              className="submit-button"
              onPress={handleFormSubmit}
              loadingLabel={Global('buttons.loading')}
            >
              {inFlow ? Flow('buttons.next') : Global('buttons.next')}
            </TransitionButton>
          </FlowActions>
        </Form>
      )}
    </>
  );
};

export default ProjectsProjectPlanNew;
