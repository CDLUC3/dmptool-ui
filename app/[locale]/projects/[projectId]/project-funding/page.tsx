'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Form,
  Link,
  Radio,
  Text
} from "react-aria-components";

// GraphQL
import { useLazyQuery } from '@apollo/client/react';
import { ProjectFundingsApiDocument } from '@/generated/graphql';

// Components
import PageHeader from "@/components/PageHeader";
import {
  ContentContainer,
  LayoutContainer,
} from "@/components/Container"
import { RadioGroupComponent } from '@/components/Form';

// Utils and other
import { routePath } from '@/utils/routes';


const ProjectsCreateProjectFunding = () => {
  const router = useRouter();
  const params = useParams();

  const [fundingsApiQuery] = useLazyQuery(ProjectFundingsApiDocument, {});

  const { projectId } = params;

  const [hasFunding, setHasFunding] = useState("yes");

  // localization keys
  const Global = useTranslations('Global');
  const ProjectFunding = useTranslations('ProjectsCreateProjectFunding');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    fundingsApiQuery({
      variables: {
        projectId: Number(projectId),
      }
    }).then(({ data }) => {

      // NOTE: In the previous step, we selected a funder. So when we get to
      // this point, we already have an affiliated funder. Using assertion here
      // to tell typescript we definltely have a value here.
      const fundings = data!.project!.fundings!;
      const funder = fundings[0]!.affiliation;

      if (funder!.apiTarget && hasFunding === 'yes') {
        router.push(routePath('projects.create.projects.search', {
          projectId: projectId as string,
        }, { affId: String(data?.project?.fundings?.[0]?.affiliation?.id) }));
      } else {
        router.push(routePath('projects.project.info', {
          projectId: projectId as string,
        }));
      }
    });
  }

  return (
    <>
      <PageHeader
        title={ProjectFunding('title')}
        description=""
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href="/">{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href="/projects">{Global('breadcrumbs.projects')}</Link></Breadcrumb>
          </Breadcrumbs>
        }
        className="page-project-create-project-funding"
      />
      <LayoutContainer>
        <ContentContainer>
          <Form onSubmit={handleSubmit}>

            <RadioGroupComponent
              name="has_funding"
              value={hasFunding}
              radioGroupLabel={ProjectFunding('form.radioFundingLabel')}
              description={ProjectFunding('form.radioFundingDescription')}
              onChange={setHasFunding}
            >
              <div>
                <Radio value="yes">{ProjectFunding('form.radioYesLabel')}</Radio>
                <Text
                  slot="description"
                >
                  {ProjectFunding('form.radioYesDescription')}
                </Text>
              </div>

              <div>
                <Radio value="no">{ProjectFunding('form.radioNoLabel')}</Radio>
                <Text
                  slot="description"
                >
                  {ProjectFunding('form.radioNoDescription')}
                </Text>
              </div>

            </RadioGroupComponent>

            <Button
              type="submit"
              className=""
            >
              {Global('buttons.continue')}
            </Button>

          </Form>

        </ContentContainer>
      </LayoutContainer>
    </>
  );
};
export default ProjectsCreateProjectFunding;
