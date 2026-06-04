'use client';

import React, { useRef, useState } from 'react';
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

// GraphQL
import { useMutation } from '@apollo/client/react';
import {
  ProjectFundingStatus,
  AffiliationErrors,
  ProjectFundingErrors,
  AddAffiliationDocument,
  AddProjectFundingDocument,
} from '@/generated/graphql';

// Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import { FormInput, FormSelect } from "@/components/Form";
import ErrorMessages from '@/components/ErrorMessages';
import { TypeAheadWithOther, useAffiliationSearch } from '@/components/Form/TypeAheadWithOther';

// Utils and other
import { routePath } from '@/utils/routes';
import { scrollToTop } from '@/utils/general';
import logECS from '@/utils/clientLogger';
import { useToast } from '@/context/ToastContext';

import styles from './addFunderManually.module.scss';

interface FieldErrorsInterface {
  affiliationId: string;
  otherAffiliationName: string;
  funderGrantId: string;
  funderOpportunityNumber: string;
  funderProjectNumber: string;
}

interface ProjectFundingInterface {
  affiliationName: string;
  affiliationId: string;
  otherAffiliationName: string;
  fundingStatus: ProjectFundingStatus;
  funderGrantId: string;
  funderOpportunityNumber: string;
  funderProjectNumber: string;
}

const AddProjectFunderManually = () => {
  const addFunding = useTranslations('ProjectsProjectFundingAdd');
  const global = useTranslations('Global');

  const toastState = useToast();
  const topRef = useRef<HTMLDivElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const params = useParams();
  const projectId = Number(params.projectId);

  // For TypeAhead component
  const { suggestions, handleSearch } = useAffiliationSearch();

  const [addAffiliation] = useMutation(AddAffiliationDocument);
  const [addProjectFunding] = useMutation(AddProjectFundingDocument);

  const [fundingData, setFundingData] = useState<ProjectFundingInterface>({
    affiliationName: '',
    affiliationId: '',
    otherAffiliationName: '',
    fundingStatus: ProjectFundingStatus.Planned,
    funderGrantId: '',
    funderOpportunityNumber: '',
    funderProjectNumber: ''
  });

  const fundingStatuses = Object.values(ProjectFundingStatus).map(status => ({
    id: status,
    name: status.toLowerCase()
  }));

  const [errors, setErrors] = useState<string[]>([]);
  const [otherField, setOtherField] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorsInterface>({
    affiliationId: '',
    otherAffiliationName: '',
    funderGrantId: '',
    funderOpportunityNumber: '',
    funderProjectNumber: ''
  });

  const updateAffiliationFormData = async (id: string, value: string) => {
    clearActiveFieldError('affiliationId')
    // Clear previous error messages
    clearAllFieldErrors();
    setErrors([]);
    return setFundingData({ ...fundingData, affiliationName: value, affiliationId: id });
  }

  // Clear any errors for the current active field
  const clearActiveFieldError = (name: string) => {
    // Clear error for active field
    setFieldErrors(prevErrors => ({
      ...prevErrors,
      [name]: ''
    }));
  }

  function clearAllFieldErrors() {
    setFieldErrors({
      affiliationId: '',
      otherAffiliationName: '',
      funderGrantId: '',
      funderOpportunityNumber: '',
      funderProjectNumber: ''
    });
  }

  // Show Success Message
  function showSuccessToast() {
    const successMessage = addFunding('messages.success.projectFundingUpdated');
    toastState.add(successMessage, { type: 'success' });
    scrollToTop(topRef);
  }

  /**
   * Check if there are any errors from our addAffilitation graphql mutation.
   *
   * Returns true if any error was detected, as well as the original error
   * object that should now be type casted correctly
   */
  function hasAffiliationErrors(errs: AffiliationErrors): [boolean, AffiliationErrors] {
    const noErrors = Object.values(errs).every(val => val === null);
    if (noErrors) return [false, errs];

    const keys: (keyof AffiliationErrors)[] = [
      "name",
    ];

    return [keys.some((k) => !!errs[k]), errs];
  }

  /**
   * Check if there are any errors from our addProjectFunding graphql mutation.
   *
   * Returns true if any error was detected, as well as the original error
   * object that should now be type casted correctly
   */
  function hasProjectFundingErrors(errs: ProjectFundingErrors): [boolean, ProjectFundingErrors] {
    const noErrors = Object.values(errs).every(val => val === null);
    if (noErrors) return [false, errs];

    // is ProjectFunding error
    const keys: (keyof ProjectFundingErrors)[] = [
      "projectId",
      "affiliationId",
      "funderOpportunityNumber",
      "funderProjectNumber",
      "grantId",
      "general",
      "status",
    ];

    return [keys.some((k) => !!errs[k]), errs];
  }

  // Handle any changes to form field values
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Clear previous error messages
    clearAllFieldErrors();
    setErrors([]);
    const { name, value } = e.target;
    setFundingData({ ...fundingData, [name]: value });
  }

  // Handle Form Submittal
  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Clear previous error messages
    clearAllFieldErrors();
    setErrors([]);

    // First check that if the user has opted to enter "Other", then that value cannot be blank
    if (otherField && !fundingData.otherAffiliationName.trim()) {
      setFieldErrors(prev => ({
        ...prev,
        otherAffiliationName: addFunding('messages.errors.requiredOtherAffiliation')
      }));
      setErrors([addFunding('messages.errors.projectFundingUpdateFailed')]);
      return;
    }


    let affiliationId: string;

    if (otherField) {
      try {
        // Only call addAffiliation if "otherField" is true, because otherwise it's an existing affiliation and we
        // want to use the existing affiliationId
        const result = await addAffiliation({
          variables: {
            input: {
              funder: true,
              displayName: fundingData.otherAffiliationName,
            },
          },
        });

        const data = result?.data;
        affiliationId = data?.addAffiliation?.uri as string;

        const [hasErrors, errs] = hasAffiliationErrors(data?.addAffiliation?.errors as AffiliationErrors);
        if (hasErrors) {
          setFieldErrors({
            ...fieldErrors,
            affiliationId: String(errs.name),
          });
          setErrors([errs.general ?? addFunding('messages.errors.projectFundingUpdateFailed')]);
          return; // stop if affiliation failed
        }
      } catch (err) {
        const error = err as Error;
        logECS("error", "addAffiliation", {
          err: error,
          url: { path: "/projects/[projectId]/fundings/add" },
        });
        setErrors(prev => [
          ...prev,
          error.message || addFunding("messages.errors.projectFundingUpdateFailed"),
        ]);
        return;
      }
    } else {
      // Otherwise just use the affiliationId of selecting existing affiliation
      affiliationId = fundingData.affiliationId;
    }

    try {
      // Now always call addProjectFunding to add it to the project
      const result = await addProjectFunding({
        variables: {
          input: {
            projectId,
            affiliationId,
            funderOpportunityNumber: fundingData.funderOpportunityNumber,
            funderProjectNumber: fundingData.funderProjectNumber,
            grantId: fundingData.funderGrantId,
            status: fundingData.fundingStatus,
          },
        },
      });

      const data = result?.data;
      const [hasErrors, errs] = hasProjectFundingErrors(data?.addProjectFunding?.errors as ProjectFundingErrors);
      if (hasErrors) {
        setFieldErrors({
          ...fieldErrors,
          ...(errs.affiliationId != null && { affiliationId: String(errs.affiliationId) }),
          ...(errs.grantId != null && { funderGrantId: String(errs.grantId) }),
          ...(errs.funderOpportunityNumber != null && { funderOpportunityNumber: String(errs.funderOpportunityNumber) }),
          ...(errs.funderProjectNumber != null && { funderProjectNumber: String(errs.funderProjectNumber) }),
        });

        setErrors([errs.general ?? addFunding('messages.errors.projectFundingUpdateFailed')]);
        return;
      }
      // Success
      showSuccessToast();
      router.push(routePath('projects.fundings.index', { projectId }));

    } catch (err) {
      const error = err as Error;
      logECS("error", "addProjectFunding", {
        err: error,
        url: { path: "/projects/[projectId]/fundings/add" },
      });
      setErrors(prev => [
        ...prev,
        error.message || addFunding("messages.errors.projectFundingUpdateFailed"),
      ]);
    }
  }

  return (
    <>
      <div ref={topRef} />
      <PageHeader
        title={addFunding('title')}
        description={addFunding('description')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.index', { projectId })}>{global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.show', { projectId })}>{global('breadcrumbs.projectOverview')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.fundings.index', { projectId })}>{global('breadcrumbs.projectFunding')}</Link></Breadcrumb>
            <Breadcrumb>{addFunding('title')}</Breadcrumb>
          </Breadcrumbs>
        }
        className="page-funding-edit"
      />
      <LayoutContainer>
        <ContentContainer>
          <ErrorMessages errors={errors} ref={errorRef} />
          <Form onSubmit={handleFormSubmit}>
            <TypeAheadWithOther
              label={addFunding('labels.funderName')}
              fieldName="funderName"
              setOtherField={setOtherField}
              isRequired={true}
              error={fieldErrors.affiliationId}
              updateFormData={updateAffiliationFormData}
              value={fundingData.affiliationName}
              suggestions={suggestions}
              onSearch={handleSearch}
            />
            {otherField && (
              <div className={`${styles.formRow} ${styles.oneItemRow}`}>
                <FormInput
                  name="otherAffiliationName"
                  type="text"
                  label="Other Institution"
                  placeholder={fundingData.otherAffiliationName}
                  value={fundingData.otherAffiliationName}
                  onChange={handleInputChange}
                  isInvalid={!!fieldErrors['otherAffiliationName']}
                  errorMessage={fieldErrors['otherAffiliationName'] ?? ''}
                />

              </div>
            )}

            <FormSelect
              label={addFunding('labels.fundingStatus')}
              isRequired
              name="fundingStatus"
              items={fundingStatuses}
              selectClasses={styles.fundingStatusSelect}
              onChange={value => setFundingData({ ...fundingData, fundingStatus: value as ProjectFundingStatus })}
              selectedKey={fundingData.fundingStatus}
            >
              {fundingStatuses && fundingStatuses.map((status) => {
                return (
                  <ListBoxItem key={status.id}>{status.name}</ListBoxItem>
                )
              })}
            </FormSelect>

            <FormInput
              name="funderGrantId"
              type="text"
              label={addFunding('labels.grantNumber')}
              value={fundingData.funderGrantId}
              onChange={handleInputChange}
              isInvalid={!!fieldErrors.funderGrantId}
              errorMessage={fieldErrors.funderGrantId}
            />

            <FormInput
              name="funderProjectNumber"
              type="text"
              label={addFunding('labels.projectNumber')}
              value={fundingData.funderProjectNumber}
              onChange={handleInputChange}
              isInvalid={!!fieldErrors.funderProjectNumber}
              errorMessage={fieldErrors.funderProjectNumber}
            />

            <FormInput
              name="funderOpportunityNumber"
              type="text"
              label={addFunding('labels.opportunity')}
              value={fundingData.funderOpportunityNumber}
              onChange={handleInputChange}
              isInvalid={!!fieldErrors.funderOpportunityNumber}
              errorMessage={fieldErrors.funderOpportunityNumber}
            />

            <Button type="submit" className="submit-button">{global('buttons.saveChanges')}</Button>
          </Form>
        </ContentContainer>
      </LayoutContainer>
    </>
  );
};

export default AddProjectFunderManually;
