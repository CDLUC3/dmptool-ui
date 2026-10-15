'use client';

import React, { useEffect, useRef, useState, type TransitionStartFunction } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Form,
  Link,
  Radio,
  Text
} from "react-aria-components";

import { useMutation, useQuery } from '@apollo/client/react';
import {
  ProjectFundingErrors,
  ProjectFundingsApiDocument,
  RemoveProjectFundingDocument,
  UpdateProjectFundingDocument,
} from '@/generated/graphql';

import PageHeader from "@/components/PageHeader";
import CreateProjectFlowLayout, {
  FUNDING_CHOICES,
  FUNDING_CHOICE_STATUS,
  FlowActions,
  FundingChoice,
  flowPath,
  fundingChoiceFromStatus,
  screenAfterFundingStatus,
  useCreateProjectFlow,
} from '@/components/CreateProjectFlow';
import { RadioGroupComponent, TransitionButton } from '@/components/Form';
import ErrorMessages from '@/components/ErrorMessages';
import Loading from '@/components/Loading';

import { checkErrors } from '@/utils/errorHandler';
import { handleApolloError } from '@/utils/apolloErrorHandler';


const ProjectsCreateProjectFunding = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = String(params.projectId);
  const projectFundingIdParam = searchParams?.get('projectFundingId');
  const { flow } = useCreateProjectFlow();
  const errorRef = useRef<HTMLDivElement | null>(null);

  const Global = useTranslations('Global');
  const Flow = useTranslations('CreateProjectFlow');

  const { data, loading } = useQuery(ProjectFundingsApiDocument, {
    variables: { projectId: Number(projectId) },
    fetchPolicy: 'network-only',
  });
  const [updateProjectFunding] = useMutation(UpdateProjectFundingDocument);
  const [removeProjectFunding] = useMutation(RemoveProjectFundingDocument);

  const fundings = data?.project?.fundings ?? [];
  const funding = fundings.find((f) => String(f.id) === projectFundingIdParam) ?? fundings[0];
  const funderName = funding?.affiliation?.displayName;

  const [choice, setChoice] = useState<FundingChoice>('planned');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (funding) setChoice(fundingChoiceFromStatus(funding.status));
  }, [funding?.id]);

  const handleSubmit = async ({ startTransition }: { startTransition: TransitionStartFunction }) => {
    setErrors([]);

    if (!funding?.id) {
      setErrors([Flow('fundingStatus.errors.noFunding')]);
      return;
    }

    try {
      const result = await updateProjectFunding({
        variables: {
          input: {
            projectFundingId: funding.id,
            status: FUNDING_CHOICE_STATUS[choice],
          }
        }
      });

      const [hasErrors, errs] = checkErrors(
        (result?.data?.updateProjectFunding?.errors ?? {}) as ProjectFundingErrors,
        ['general', 'status']
      );
      if (hasErrors) {
        setErrors([String(errs.general || errs.status || Flow('fundingStatus.errors.saveFailed'))]);
        return;
      }

      const next = screenAfterFundingStatus(choice, !!funding.affiliation?.apiTarget);
      const extraQuery = next === 'projectSearch'
        ? { affId: funding.affiliation?.id ?? undefined, projectFundingId: funding.id }
        : {};

      startTransition(() => {
        router.push(flowPath(next, flow, projectId, extraQuery));
      });
    } catch (err) {
      handleApolloError(err, 'ProjectsCreateProjectFunding.handleSubmit');
      setErrors([Flow('fundingStatus.errors.saveFailed')]);
    }
  };

  const handleChangeFunder = async () => {
    setErrors([]);
    try {
      await removeProjectFunding({ variables: { projectFundingId: Number(funding!.id) } });
      router.push(flowPath('funder', flow, projectId));
    } catch (err) {
      handleApolloError(err, 'ProjectsCreateProjectFunding.handleChangeFunder');
      setErrors([Flow('fundingStatus.errors.saveFailed')]);
    }
  };

  return (
    <>
      <PageHeader
        title={Flow('fundingStatus.title')}
        description={funderName
          ? Flow('fundingStatus.description', { funder: funderName })
          : Flow('fundingStatus.descriptionNoFunder')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href="/">{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href="/projects">{Global('breadcrumbs.projects')}</Link></Breadcrumb>
          </Breadcrumbs>
        }
        className="page-project-create-project-funding"
      />
      <CreateProjectFlowLayout screen="fundingStatus" flow={flow}>
        <ErrorMessages errors={errors} ref={errorRef} />
        {loading ? (
          <>
            <Loading variant="inline" message={Global('messaging.loading')} />
            <FlowActions />
          </>
        ) : (
          <Form onSubmit={(e) => e.preventDefault()}>
            <RadioGroupComponent
              name="funding_status"
              value={choice}
              radioGroupLabel={Flow('fundingStatus.label')}
              onChange={(value) => setChoice(value as FundingChoice)}
            >
              {FUNDING_CHOICES.map((option) => (
                <div key={option}>
                  <Radio value={option}>{Flow(`fundingStatus.options.${option}`)}</Radio>
                  <Text slot="description">
                    {Flow(`fundingStatus.options.${option}Description`)}
                  </Text>
                </div>
              ))}
            </RadioGroupComponent>

            {funding?.id && (
              <p>
                <Button className="link" onPress={handleChangeFunder} data-testid="change-funder">
                  {Flow('fundingStatus.changeFunder')}
                </Button>
              </p>
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
        )}
      </CreateProjectFlowLayout>
    </>
  );
};
export default ProjectsCreateProjectFunding;
