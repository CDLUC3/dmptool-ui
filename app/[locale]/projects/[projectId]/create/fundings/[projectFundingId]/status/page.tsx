'use client';

import React, { useEffect, useMemo, useRef, useState, type TransitionStartFunction } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
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
  fundingFlowPath,
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
  const projectFundingId = String(params.projectFundingId);
  const isNewFunding = searchParams?.get('newFunding') === 'true';
  const { flow } = useCreateProjectFlow();
  const errorRef = useRef<HTMLDivElement | null>(null);

  const Global = useTranslations('Global');
  const Flow = useTranslations('CreateProjectFlow');

  const { data, loading, error } = useQuery(ProjectFundingsApiDocument, {
    variables: { projectId: Number(projectId) },
    fetchPolicy: 'network-only',
  });
  const [updateProjectFunding] = useMutation(UpdateProjectFundingDocument);
  const [removeProjectFunding] = useMutation(RemoveProjectFundingDocument);

  const fundings = data?.project?.fundings ?? [];
  const funding = fundings.find((f) => String(f.id) === projectFundingId);
  const funderName = funding?.affiliation?.displayName;

  const [choice, setChoice] = useState<FundingChoice>('planned');
  const [errors, setErrors] = useState<string[]>([]);

  const notFound = !loading && (!!error || !funding);
  const displayedErrors = useMemo(
    () => (notFound ? [Flow('fundingStatus.errors.noFunding')] : errors),
    [notFound, errors, Flow]
  );

  useEffect(() => {
    if (funding) setChoice(fundingChoiceFromStatus(funding.status));
  }, [funding?.id]);

  useEffect(() => {
    if (error) handleApolloError(error, 'ProjectsCreateProjectFunding.projectFundingsQuery');
  }, [error]);

  const handleSubmit = async ({ startTransition }: { startTransition: TransitionStartFunction }) => {
    setErrors([]);

    const fundingId = funding?.id;
    if (!funding || !fundingId) {
      setErrors([Flow('fundingStatus.errors.noFunding')]);
      return;
    }

    try {
      const result = await updateProjectFunding({
        variables: {
          input: {
            projectFundingId: fundingId,
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
      startTransition(() => {
        router.push(next === 'projectSearch'
          ? fundingFlowPath(next, flow, projectId, fundingId)
          : flowPath(next, flow, projectId));
      });
    } catch (err) {
      handleApolloError(err, 'ProjectsCreateProjectFunding.handleSubmit');
      setErrors([Flow('fundingStatus.errors.saveFailed')]);
    }
  };

  const goToFunderStep = () => {
    router.push(flowPath('funder', flow, projectId));
  };

  const handleChangeFunder = async () => {
    setErrors([]);
    const fundingId = funding?.id;
    if (!fundingId) return;

    // removeProjectFunding also unlinks the funding from the project's plans, so a funding
    // that already existed before this flow stays on the project alongside the new funder
    if (!isNewFunding) {
      goToFunderStep();
      return;
    }

    try {
      const result = await removeProjectFunding({ variables: { projectFundingId: fundingId } });
      const [hasErrors] = checkErrors(
        (result?.data?.removeProjectFunding?.errors ?? {}) as ProjectFundingErrors,
        ['general', 'affiliationId', 'projectId']
      );
      if (hasErrors) {
        setErrors([Flow('fundingStatus.errors.changeFunderFailed')]);
        return;
      }
      goToFunderStep();
    } catch (err) {
      handleApolloError(err, 'ProjectsCreateProjectFunding.handleChangeFunder');
      setErrors([Flow('fundingStatus.errors.changeFunderFailed')]);
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
        <ErrorMessages errors={displayedErrors} ref={errorRef} />
        {loading ? (
          <>
            <Loading variant="inline" message={Global('messaging.loading')} />
            <FlowActions />
          </>
        ) : notFound ? (
          <FlowActions>
            <Button
              type="button"
              onPress={goToFunderStep}
              data-testid="choose-funder"
            >
              {Flow('buttons.chooseFunder')}
            </Button>
          </FlowActions>
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
