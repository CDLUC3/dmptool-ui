'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Form,
  Link,
  ListBoxItem,
} from "react-aria-components";

// Apollo Client
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';
import {
  ProjectFundingErrors,
  ProjectFundingStatus,
  ProjectFundingDocument,
  UpdateProjectFundingDocument,
} from '@/generated/graphql';

// Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import { FormInput, FormSelect } from "@/components/Form";
import ErrorMessages from '@/components/ErrorMessages';

import { scrollToTop } from '@/utils/general';
import logECS from '@/utils/clientLogger';
import { routePath } from '@/utils/routes';
import { extractErrors } from '@/utils/errorHandler';
import { useToast } from '@/context/ToastContext';

import {
  removeProjectFundingAction
} from './actions';

import styles from './projectFunding.module.scss';

interface ProjectFundingFormErrorsInterface {
  funderGrantId: string;
  funderOpportunityNumber: string;
  funderProjectNumber: string;
}

interface ProjectFundingInterface {
  funderName: string;
  fundingStatus: ProjectFundingStatus;
  funderGrantId: string;
  funderOpportunityNumber: string;
  funderProjectNumber: string;
}

type RemoveFundingErrors = {
  general?: string;
  status?: string;
  affiliationId?: string;
  funderOpportunityNumber?: string;
  funderProjectNumber?: string;
  grantId?: string;
  projectId?: string;
}

const ProjectsProjectFundingEdit = () => {
  const toastState = useToast(); // Access the toast state from context
  const router = useRouter(); // Access the router object

  //For scrolling to top of page
  const topRef = useRef<HTMLDivElement | null>(null);
  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Get projectId and projectFundingID
  const params = useParams();
  // From route /projects/:projectId/fundings/:projectFundingId/edit
  const projectId = String(params.projectId);
  const projectFundingId = String(params.projectFundingId);

  const [projectFunding, setProjectFunding] = useState<ProjectFundingInterface>({
    funderName: '',
    fundingStatus: ProjectFundingStatus.Planned,
    funderGrantId: '',
    funderOpportunityNumber: '',
    funderProjectNumber: ''
  });

  const [fieldErrors, setFieldErrors] = useState<ProjectFundingFormErrorsInterface>({
    funderGrantId: '',
    funderOpportunityNumber: '',
    funderProjectNumber: ''
  });

  // Track whether the project should be in read-only mode based on the "readOnly" field 
  // returned from the backend from ProjectDocument query
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // Localization keys
  const EditFunding = useTranslations('ProjectsProjectFundingEdit');
  const Global = useTranslations('Global');

  // Get Apollo client for cache updates
  const client = useApolloClient();

  // Place statuses into SelectItem interface for FormSelect component
  const fundingStatuses = Object.values(ProjectFundingStatus).map(status => ({
    id: status,
    name: status.toLowerCase()
  }));

  // Get Project Funding data
  const { data, loading, error: queryError } = useQuery(ProjectFundingDocument, {
    variables: { projectFundingId: Number(projectFundingId) },
    /*Needed to add this fetchPolicy so that users get fresh data when coming back to this page after editing because it was
    previously showing stale data. I believe that it's ok to use this here because:
    - Edit pages typically are low traffic
    - Data accuracy is critical on form pages and we don't want users overwriting their changes*/
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true
  });

  // Initialize useUpdateProjectMutation
  const [updateProjectFundingMutation] = useMutation(UpdateProjectFundingDocument);

  const clearAllFieldErrors = () => {
    //Remove all field errors
    setFieldErrors({
      funderGrantId: '',
      funderOpportunityNumber: '',
      funderProjectNumber: ''
    });
  }

  // Show Success Message
  const showSuccessToast = () => {
    const successMessage = EditFunding('messages.success.projectFundingUpdated');
    toastState.add(successMessage, { type: 'success' });
    // Scroll to top of page
    scrollToTop(topRef);
  }

  const updateProjectFundingContent = (
    key: string,
    value: string
  ) => {
    setProjectFunding((prevContents) => ({
      ...prevContents,
      [key]: value,
    }));
  };

  // Make GraphQL mutation request to update projectFunding table
  const updateProjectFunding = async (): Promise<[ProjectFundingErrors, boolean]> => {
    try {
      const response = await updateProjectFundingMutation({
        variables: {
          input: {
            projectFundingId: Number(projectFundingId),
            status: projectFunding.fundingStatus,
            funderProjectNumber: projectFunding.funderProjectNumber,
            grantId: projectFunding.funderGrantId,
            funderOpportunityNumber: projectFunding.funderOpportunityNumber
          }
        }
      });

      const responseErrors = response.data?.updateProjectFunding?.errors
      if (responseErrors) {
        if (responseErrors && Object.values(responseErrors).filter((err) => err && err !== 'ProjectFundingErrors').length > 0) {
          return [responseErrors, false];
        }
      }

      return [{}, true];
    } catch (error) {
      logECS('error', 'updateProjectFundingMutation', {
        error,
        url: { path: '/projects/[projectId]/fundings/[projectFundingId]/edit' }
      });
      setErrorMessages(prevErrors => [...prevErrors, EditFunding('messages.errors.projectFundingUpdateFailed')]);
      return [{}, false];
    }
  };


  // Handle form submit
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Clear previous error messages
    clearAllFieldErrors();
    setErrorMessages([]);

    // Create new section
    const [errors, success] = await updateProjectFunding();

    if (!success) {
      // Check if there are any errors (always exclude the GraphQL `_typename` entry)
      if (errors) {
        setFieldErrors({
          funderGrantId: errors.grantId || '',
          funderOpportunityNumber: errors.funderOpportunityNumber || '',
          funderProjectNumber: errors.funderProjectNumber || ''
        });
      }
      setErrorMessages([errors.general || EditFunding('messages.errors.projectFundingUpdateFailed')]);

    } else {
      // Show success message
      showSuccessToast();
      // Redirect back to the project funding page
      router.push(routePath('projects.fundings.index', { projectId }));
    }
  };

  // Call Server Action removeProjectFundingAction to run the removeProjectFundingMutation
  const deleteFunding = async () => {
    // Don't need a try-catch block here, as the error is handled in the action
    const response = await removeProjectFundingAction({
      projectFundingId: Number(projectFundingId),
    })

    if (response.redirect) {
      router.push(response.redirect);
    }

    return {
      success: response.success,
      errors: response.errors,
      data: response.data
    }
  }

  const handleDeleteFunding = async () => {
    const result = await deleteFunding();

    if (!result.success) {
      const errors = result.errors;
      if (errors) {
        setErrorMessages(prev => prev.concat(errors));
      }
    } else {
      if (result?.data?.errors) {
        const errs = extractErrors<RemoveFundingErrors>(result?.data?.errors, ['general', 'status', 'affiliationId', 'funderOpportunityNumber', 'funderProjectNumber', 'projectId']);
        if (errs.length > 0) {
          setErrorMessages(prev => prev.concat(errs));
        } else {
          // Update cache to remove the deleted funding
          const cache = client.cache;

          // Modify the Query.projectFundings to remove the deleted funding
          cache.modify({
            fields: {
              projectFundings(existingFundings = [], { readField }) {
                return existingFundings.filter(
                  /* eslint-disable @typescript-eslint/no-explicit-any */
                  (fundingRef: any) => readField('id', fundingRef) !== Number(projectFundingId)
                );
              }
            }
          });

          // Evict the specific ProjectFunding object from cache
          cache.evict({
            id: cache.identify({ __typename: 'ProjectFunding', id: Number(projectFundingId) })
          });

          // Run garbage collection to clean up orphaned objects
          cache.gc();

          const successMessage = EditFunding('messages.success.removedFunding');
          toastState.add(successMessage, { type: 'success' });
          // Redirect back to the project funding page
          router.push(routePath('projects.fundings.index', { projectId }));
        }
      }
    }
  }

  const handleAddFunding = async () => {
    const successMessage = EditFunding('messages.info.redirectingToAddFunderPage');
    toastState.add(successMessage, { type: 'success' });
    // Redirect to Add Funding page
    router.push(routePath('projects.fundings.add', { projectId }));
  }

  useEffect(() => {
    // set project data in state
    if (data && data.projectFunding) {
      setProjectFunding({
        funderName: data.projectFunding?.affiliation?.name || '',
        fundingStatus: data.projectFunding.status || ProjectFundingStatus.Planned,
        funderGrantId: data.projectFunding?.grantId || '',
        funderOpportunityNumber: data.projectFunding?.funderOpportunityNumber || '',
        funderProjectNumber: data.projectFunding?.funderProjectNumber || ''
      });
      setIsReadOnly(data.projectFunding?.project?.readOnly || false);
    }
  }, [data]);

  useEffect(() => {
    if (queryError) {
      setErrorMessages(prev => [...prev, queryError.message]);
    }
  }, [queryError])

  if (loading) {
    return <div>{Global('messaging.loading')}...</div>;
  }

  return (
    <>
      <div ref={topRef} />
      <PageHeader
        title={EditFunding('title')}
        description={EditFunding('description')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.show', { projectId })}>{Global('breadcrumbs.projectOverview')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.fundings.index', { projectId })}>{Global('breadcrumbs.projectFunding')}</Link></Breadcrumb>
            <Breadcrumb>{EditFunding('title')}</Breadcrumb>
          </Breadcrumbs>
        }
        className="page-funding-edit"
      />
      <LayoutContainer>
        <ContentContainer>
          <ErrorMessages errors={errorMessages} ref={errorRef} />
          <Form onSubmit={handleFormSubmit}>
            <FormInput
              name="funderName"
              type="text"
              isRequired={false}
              label={EditFunding('labels.funderName')}
              value={projectFunding.funderName}
              disabled={true}
            />

            <FormSelect
              label={EditFunding('labels.fundingStatus')}
              isRequired
              name="fundingStatus"
              items={fundingStatuses}
              isDisabled={isReadOnly}
              selectClasses={styles.fundingStatusSelect}
              onChange={selected => updateProjectFundingContent('fundingStatus', selected as ProjectFundingStatus)}
              selectedKey={projectFunding.fundingStatus}
            >

              {fundingStatuses && fundingStatuses.map((status) => {
                return (
                  <ListBoxItem key={status.id}>{status.name}</ListBoxItem>
                )

              })}
            </FormSelect>

            <FormInput
              name="grantNumber"
              type="text"
              isRequired={false}
              disabled={isReadOnly}
              label={EditFunding('labels.grantNumber')}
              value={projectFunding.funderGrantId}
              onChange={(e) => updateProjectFundingContent('funderGrantId', e.target.value)}
              isInvalid={(!!fieldErrors.funderGrantId)}
              errorMessage={fieldErrors.funderGrantId.length > 0 ? fieldErrors.funderGrantId : EditFunding('messages.errors.fundingGrantId')}
            />

            <FormInput
              name="projectNumber"
              type="text"
              isRequired={false}
              disabled={isReadOnly}
              label={EditFunding('labels.projectNumber')}
              value={projectFunding.funderProjectNumber}
              onChange={(e) => updateProjectFundingContent('funderProjectNumber', e.target.value)}
              isInvalid={(!!fieldErrors.funderProjectNumber)}
              errorMessage={fieldErrors.funderProjectNumber.length > 0 ? fieldErrors.funderProjectNumber : EditFunding('messages.errors.fundingProjectNumber')}
            />

            <FormInput
              name="opportunityNumber"
              type="text"
              isRequired={false}
              disabled={isReadOnly}
              label={EditFunding('labels.opportunity')}
              value={projectFunding.funderOpportunityNumber}
              onChange={(e) => updateProjectFundingContent('funderOpportunityNumber', e.target.value)}
            />

            {!isReadOnly && (
              <div className={styles.buttonsContainer}>
                <Button type="submit" className="submit-button">{Global('buttons.saveChanges')}</Button>
                <Button type="button" className="secondary" onPress={handleAddFunding}>{Global('buttons.addAnother')}</Button>
              </div>
            )}

          </Form>

          {!isReadOnly && (
            <div className={styles.deleteWrapper}>
              <h2>{EditFunding('headings.deleteFunder')}</h2>
              <p>
                {EditFunding.rich('para1Delete', {
                  strong: (chunks) => <strong>{chunks}</strong>
                })}
              </p>
              <p>{EditFunding('para2Delete')}</p>

              <Button type="button" className="danger" onPress={handleDeleteFunding}>{EditFunding('buttons.removeFunder')}</Button>
            </div>
          )}
        </ContentContainer>
      </LayoutContainer>
    </>
  );
};

export default ProjectsProjectFundingEdit;