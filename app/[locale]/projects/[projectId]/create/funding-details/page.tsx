'use client';

import React, { useEffect, useRef, useState, type TransitionStartFunction } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  Breadcrumb,
  Breadcrumbs,
  Form,
  Link,
  ListBoxItem,
} from 'react-aria-components';

import {
  ProjectFundingDocument,
  ProjectFundingErrors,
  ProjectFundingStatus,
  ProjectFundingsApiDocument,
  UpdateProjectFundingDocument,
} from '@/generated/graphql';

import PageHeader from '@/components/PageHeader';
import CreateProjectFlowLayout, {
  FlowActions,
  flowPath,
  useCreateProjectFlow,
} from '@/components/CreateProjectFlow';
import { FormInput, FormSelect, TransitionButton } from '@/components/Form';
import ErrorMessages from '@/components/ErrorMessages';
import Loading from '@/components/Loading';

import { checkErrors } from '@/utils/errorHandler';
import { handleApolloError } from '@/utils/apolloErrorHandler';
import { useToast } from '@/context/ToastContext';

interface FundingDetailsForm {
  status: ProjectFundingStatus;
  grantId: string;
  funderProjectNumber: string;
  funderOpportunityNumber: string;
}

type FieldErrors = Partial<Record<keyof FundingDetailsForm, string>>;

const ProjectsCreateProjectFundingDetails = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = String(params.projectId);
  const projectFundingIdParam = searchParams?.get('projectFundingId');
  const { flow } = useCreateProjectFlow();
  const toastState = useToast();
  const errorRef = useRef<HTMLDivElement | null>(null);

  const Global = useTranslations('Global');
  const Flow = useTranslations('CreateProjectFlow');

  const { data: fundingsData, loading: fundingsLoading } = useQuery(ProjectFundingsApiDocument, {
    variables: { projectId: Number(projectId) },
    skip: !!projectFundingIdParam,
  });
  const projectFundingId = projectFundingIdParam
    ? Number(projectFundingIdParam)
    : fundingsData?.project?.fundings?.[0]?.id ?? undefined;

  const { data, loading } = useQuery(ProjectFundingDocument, {
    variables: { projectFundingId: Number(projectFundingId) },
    skip: !projectFundingId,
    fetchPolicy: 'network-only',
  });
  const [updateProjectFunding] = useMutation(UpdateProjectFundingDocument);

  const [form, setForm] = useState<FundingDetailsForm>({
    status: ProjectFundingStatus.Planned,
    grantId: '',
    funderProjectNumber: '',
    funderOpportunityNumber: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errors, setErrors] = useState<string[]>([]);

  const funding = data?.projectFunding;

  useEffect(() => {
    if (!funding) return;
    setForm({
      status: funding.status ?? ProjectFundingStatus.Planned,
      grantId: funding.grantId ?? '',
      funderProjectNumber: funding.funderProjectNumber ?? '',
      funderOpportunityNumber: funding.funderOpportunityNumber ?? '',
    });
  }, [funding]);

  const statusItems = Object.values(ProjectFundingStatus).map((status) => ({
    id: status,
    name: Flow(`fundingDetails.statuses.${status}`),
  }));

  const update = (key: keyof FundingDetailsForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async ({ startTransition }: { startTransition: TransitionStartFunction }) => {
    setErrors([]);
    setFieldErrors({});

    if (!projectFundingId) {
      setErrors([Flow('fundingDetails.messages.notFound')]);
      return;
    }

    try {
      const result = await updateProjectFunding({
        variables: {
          input: {
            projectFundingId,
            status: form.status,
            grantId: form.grantId,
            funderProjectNumber: form.funderProjectNumber,
            funderOpportunityNumber: form.funderOpportunityNumber,
          },
        },
      });

      const [hasErrors, errs] = checkErrors(
        (result?.data?.updateProjectFunding?.errors ?? {}) as ProjectFundingErrors,
        ['general', 'grantId', 'funderProjectNumber', 'funderOpportunityNumber', 'status']
      );
      if (hasErrors) {
        setFieldErrors({
          grantId: errs.grantId ?? undefined,
          funderProjectNumber: errs.funderProjectNumber ?? undefined,
          funderOpportunityNumber: errs.funderOpportunityNumber ?? undefined,
          status: errs.status ?? undefined,
        });
        setErrors([String(errs.general || Flow('fundingDetails.messages.saveFailed'))]);
        return;
      }

      toastState.add(Flow('fundingDetails.messages.saved'), { type: 'success' });
      startTransition(() => {
        router.push(flowPath('projectDetails', flow, projectId));
      });
    } catch (err) {
      handleApolloError(err, 'ProjectsCreateProjectFundingDetails.handleSubmit');
      setErrors([Flow('fundingDetails.messages.saveFailed')]);
    }
  };

  const isLoading = loading || fundingsLoading;

  return (
    <>
      <PageHeader
        title={Flow('fundingDetails.title')}
        description={Flow('fundingDetails.description')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href="/">{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href="/projects">{Global('breadcrumbs.projects')}</Link></Breadcrumb>
          </Breadcrumbs>
        }
        className="page-project-create-project-funding"
      />
      <CreateProjectFlowLayout screen="fundingDetails" flow={flow}>
        <ErrorMessages errors={errors} ref={errorRef} />
        {isLoading ? (
          <>
            <Loading variant="inline" message={Global('messaging.loading')} />
            <FlowActions />
          </>
        ) : (
          <Form onSubmit={(e) => e.preventDefault()}>
            <FormInput
              name="funderName"
              type="text"
              label={Flow('fundingDetails.funderName')}
              value={funding?.affiliation?.displayName ?? ''}
              disabled
            />

            <FormSelect
              label={Flow('fundingDetails.status')}
              name="status"
              items={statusItems}
              selectedKey={form.status}
              onChange={(value) => update('status', value)}
              isInvalid={!!fieldErrors.status}
              errorMessage={fieldErrors.status}
            >
              {statusItems.map((status) => (
                <ListBoxItem key={status.id} id={status.id}>{status.name}</ListBoxItem>
              ))}
            </FormSelect>

            <FormInput
              name="grantId"
              type="text"
              label={Flow('fundingDetails.grantId')}
              helpMessage={Flow('fundingDetails.grantIdHelp')}
              value={form.grantId}
              onChange={(e) => update('grantId', e.target.value)}
              isInvalid={!!fieldErrors.grantId}
              errorMessage={fieldErrors.grantId}
            />

            <FormInput
              name="funderProjectNumber"
              type="text"
              label={Flow('fundingDetails.funderProjectNumber')}
              helpMessage={Flow('fundingDetails.funderProjectNumberHelp')}
              value={form.funderProjectNumber}
              onChange={(e) => update('funderProjectNumber', e.target.value)}
              isInvalid={!!fieldErrors.funderProjectNumber}
              errorMessage={fieldErrors.funderProjectNumber}
            />

            <FormInput
              name="funderOpportunityNumber"
              type="text"
              label={Flow('fundingDetails.funderOpportunityNumber')}
              helpMessage={Flow('fundingDetails.funderOpportunityNumberHelp')}
              value={form.funderOpportunityNumber}
              onChange={(e) => update('funderOpportunityNumber', e.target.value)}
              isInvalid={!!fieldErrors.funderOpportunityNumber}
              errorMessage={fieldErrors.funderOpportunityNumber}
            />

            <FlowActions>
              <TransitionButton
                type="submit"
                onPress={handleSubmit}
                loadingLabel={Global('buttons.saving')}
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

export default ProjectsCreateProjectFundingDetails;
