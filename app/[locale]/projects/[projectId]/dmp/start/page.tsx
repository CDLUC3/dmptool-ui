'use client';

import { useState, type TransitionStartFunction } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import {
  Breadcrumb,
  Breadcrumbs,
  Form,
  Link,
  Radio,
} from "react-aria-components";

//Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import {
  RadioGroupComponent,
  TransitionButton
} from "@/components/Form";

import { routePath } from '@/utils/index';

const ProjectsProjectPlanNew = () => {
  // Get projectId param
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.projectId); // From route /projects/:projectId

  const REDIRECT_TO_DMP_CREATE = routePath('projects.dmp.create', { projectId });
  const REDIRECT_TO_DMP_UPLOAD = routePath('projects.dmp.upload', { projectId });

  // Localization keys
  const t = useTranslations('ProjectsProjectPlanNew');
  const Global = useTranslations('Global');

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

  return (
    <>
      <PageHeader
        title={t('title')}
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
      <LayoutContainer>
        <ContentContainer>
          <Form onSubmit={(e) => e.preventDefault()} className="project-detail-form">
            <div className="project-type-section">
              <RadioGroupComponent
                name="projectType"
                value={dmpPlan.startNewPlan}
                aria-label={t('labels.startNewOrUploadExisting')}
                radioGroupLabel=""
                onChange={handleRadioChange}
              >
                <div>
                  <Radio value="true">{t('labels.startNewPlan')}</Radio>
                </div>

                <div>
                  <Radio value="false">{t('labels.uploadExistingPlan')}</Radio>
                </div>
              </RadioGroupComponent>
            </div>

            <TransitionButton
              type="submit"
              className="submit-button"
              onPress={handleFormSubmit}
              loadingLabel={Global('buttons.loading')}
            >
              {Global('buttons.next')}
            </TransitionButton>
          </Form>
        </ContentContainer>
      </LayoutContainer >
    </>
  );
};

export default ProjectsProjectPlanNew;
