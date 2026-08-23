'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Checkbox,
  Form,
  Link,
} from "react-aria-components";

import {
  addProjectMemberAction
} from '@/app/actions';
import { AddProjectMemberResponse } from '@/app/types';
import { useQuery } from '@apollo/client/react';
import {
  MemberRole,
  MemberRolesDocument,
} from '@/generated/graphql';
// Components
import PageHeader from "@/components/PageHeader";
import {
  ContentContainer,
  LayoutContainer
} from "@/components/Container";
import { FormInput, CheckboxGroupComponent } from "@/components/Form";
import ErrorMessages from '@/components/ErrorMessages';

//Other
import logECS from '@/utils/clientLogger';
import { ProjectMemberFormInterface, ProjectMemberErrorInterface } from '@/app/types';
import { useToast } from '@/context/ToastContext';
import { routePath } from '@/utils/routes';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


type AddProjectMemberErrors = {
  affiliationId?: string;
  email?: string;
  general?: string;
  givenName?: string;
  memberRoleIds?: string;
  orcid?: string;
  projectId?: string;
  surName?: string;
}


const ProjectsProjectMemberCreate: React.FC = () => {

  // Get projectId and memberId params
  const params = useParams();
  const projectId = String(params.projectId);

  //Routes
  const PROJECT_MEMBERS_ROUTE = routePath('projects.members.index', { projectId });
  const PROJECT_MEMBER_SEARCH = routePath('projects.members.search', { projectId });

  // Hooks for toast, router and scroll to top
  const toastState = useToast();
  const router = useRouter();

  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // Keep track of which roles are checked
  const [checkboxRoles, setCheckboxRoles] = useState<string[]>([]);
  const [roles, setRoles] = useState<MemberRole[]>([]);
  const [projectMemberData, setProjectMemberData] = useState<ProjectMemberFormInterface>({
    givenName: '',
    surName: '',
    affiliationId: '',
    email: '',
    orcid: '',
    isPrimaryContact: false,
  });

  // Field errors
  const [fieldErrors, setFieldErrors] = useState<ProjectMemberErrorInterface>({
    givenName: '',
    surName: '',
    affiliationId: '',
    email: '',
    orcid: '',
    projectRoles: ''
  });

  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);

  //For scrolling to top of page
  const topRef = useRef<HTMLDivElement | null>(null);

  // localization keys
  const Global = useTranslations('Global');
  const t = useTranslations('ProjectsProjectMembersEdit');
  const CreateMember = useTranslations('ProjectsProjectMemberCreate');

  // Get Member Roles
  const { data: memberRoles, loading: memberRolesLoading, error: memberRolesError } = useQuery(MemberRolesDocument);

  const isLoading = memberRolesLoading;
  const isError = memberRolesError;


  // Show Success Message for updating member
  const showSuccessToast = () => {
    const successMessage = CreateMember('messaging.success.memberAdded');
    toastState.add(successMessage, { type: 'success' });
  }

  // Handle changes to role checkbox selection
  const handleCheckboxChange = (values: string[]) => {
    setCheckboxRoles(values); // Set the selected role IDs
  }

  const clearAllFieldErrors = () => {
    setFieldErrors({
      givenName: '',
      surName: '',
      affiliationId: '',
      email: '',
      orcid: '',
      projectRoles: ''
    });
  }

  // Call Server Action addProjectMemberAction
  const addProjectMember = async () => {

    // Don't need a try-catch block here, as the error is handled in the server action
    const response = await addProjectMemberAction({
      projectId: Number(projectId),
      givenName: projectMemberData.givenName,
      surName: projectMemberData.surName,
      affiliationId: projectMemberData.affiliationId,
      email: projectMemberData.email,
      orcid: projectMemberData.orcid,
      memberRoleIds: checkboxRoles.filter((id) => id !== undefined).map(Number)
    });

    const { success, errors: errs, redirect } = response as AddProjectMemberResponse;

    if (redirect) {
      router.push(redirect);
    }

    if (!success && errs) {
      setErrorMessages(errs);
      logECS('error', 'addProjectMember', {
        errors: errs,
        url: { path: PROJECT_MEMBERS_ROUTE }
      });
    } else {

      // If there are field-specific errors, set them
      if (response.data?.errors) {
        const errors = response.data.errors as AddProjectMemberErrors | null;

        // Check if there are any actual error values (not null/undefined and not __typename)
        const hasErrors = errors && Object.entries(errors).some(([key, value]) =>
          key !== '__typename' && value !== null && value !== undefined && value !== ''
        );

        if (hasErrors) {
          setFieldErrors({
            givenName: errors.givenName || '',
            surName: errors.surName || '',
            affiliationId: errors.affiliationId || '',
            email: errors.email || '',
            orcid: errors.orcid || '',
            projectRoles: errors.memberRoleIds ?? ''
          });
          setErrorMessages([errors.general || CreateMember('messaging.errors.errorAddingMember')]);
        }

        // On success
        showSuccessToast();
        router.push(PROJECT_MEMBERS_ROUTE);
      }
    }
  }

  // Client-side validation of fields
  const validateField = (name: string, value: string | string[] | undefined) => {
    let error = '';
    switch (name) {
      case 'givenName':
        if (!value || value.length <= 2) {
          error = t('form.errors.firstName');
        }
        break;
      case 'surName':
        if (!value || value.length <= 2) {
          error = t('form.errors.lastName');
        }
        break;
      case 'email':
        if (!value || !emailRegex.test(value as string)) {
          error = t('form.errors.email');
        }
        break;
    }

    setFieldErrors(prevErrors => ({
      ...prevErrors,
      [name]: error
    }));
    return error;
  }

  // Check whether form is valid before submitting
  const isFormValid = (): boolean => {
    // Initialize a flag for form validity
    let isValid = true;

    // Iterate over formData to validate each field
    Object.keys(projectMemberData).forEach((key) => {
      const name = key as keyof ProjectMemberFormInterface;
      const value = projectMemberData[name];

      // Skip boolean fields (isPrimaryContact)
      if (typeof value === 'boolean') {
        return;
      }

      // Call validateField to update errors for each field
      const error = validateField(name, value);
      if (error) {
        isValid = false;
      }
    });
    return isValid;
  };

  // Handle form submit
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Clear previous error messages
    clearAllFieldErrors();
    setErrorMessages([]);

    if (isFormValid()) {
      // Add new project member
      await addProjectMember();
    } else {
      setErrorMessages([CreateMember('messaging.errors.errorAddingMember')])
    }
  };

  useEffect(() => {
    // Set the roles from the query
    if (memberRoles?.memberRoles) {
      const filteredRoles = memberRoles.memberRoles.filter((role: MemberRole | null): role is MemberRole => role !== null);
      setRoles(filteredRoles);
    }
  }, [memberRoles]);


  if (isLoading) {
    return <div>{Global('messaging.loading')}...</div>;
  }

  if (isError) {
    return <div>{Global('messaging.error')}</div>;
  }


  return (
    <>
      <PageHeader
        title={CreateMember('title')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.show', { projectId })}>{Global('breadcrumbs.project')}</Link></Breadcrumb>
            <Breadcrumb><Link href={PROJECT_MEMBER_SEARCH}>{CreateMember('breadcrumbs.projectMemberSearch')}</Link></Breadcrumb>
            <Breadcrumb>{CreateMember('breadcrumbs.addProjectMember')}</Breadcrumb>
          </Breadcrumbs>
        }
        className="page-member-edit"
      />

      <ErrorMessages errors={errorMessages} ref={errorRef} />

      <LayoutContainer>
        <ContentContainer>
          <div ref={topRef}>
            <Form onSubmit={handleFormSubmit}>
              <div>
                <FormInput
                  name="givenName"
                  type="text"
                  label={t('form.labels.firstName')}
                  value={projectMemberData.givenName}
                  onChange={(e) => {
                    setProjectMemberData({ ...projectMemberData, givenName: e.target.value });
                    // Clear the error for this field when user changes it
                    setFieldErrors(prev => ({ ...prev, givenName: '' }));
                  }}
                  isInvalid={fieldErrors.givenName.length !== 0}
                  errorMessage={fieldErrors.givenName}
                />

                <FormInput
                  name="surName"
                  type="text"
                  label={t('form.labels.lastName')}
                  value={projectMemberData.surName}
                  onChange={(e) => {
                    setProjectMemberData({ ...projectMemberData, surName: e.target.value });
                    // Clear the error for this field when user changes it
                    setFieldErrors(prev => ({ ...prev, surName: '' }));
                  }}
                  isInvalid={fieldErrors.surName.length !== 0}
                  errorMessage={fieldErrors.surName}
                />

                <FormInput
                  name="affiliation"
                  type="text"
                  label={t('form.labels.affiliation')}
                  value={projectMemberData.affiliationId}
                  onChange={(e) => {
                    setProjectMemberData({ ...projectMemberData, affiliationId: e.target.value });
                    // Clear the error for this field when user changes it
                    setFieldErrors(prev => ({ ...prev, affiliationId: '' }));
                  }}
                  isInvalid={fieldErrors.affiliationId.length !== 0}
                  errorMessage={fieldErrors.affiliationId || t('form.errors.affiliation')}
                />

                <FormInput
                  name="email"
                  type="email"
                  label={t('form.labels.emailAddress')}
                  value={projectMemberData.email}
                  onChange={(e) => {
                    setProjectMemberData({ ...projectMemberData, email: e.target.value });
                    // Clear the error for this field when user changes it
                    setFieldErrors(prev => ({ ...prev, email: '' }));
                  }}
                  isInvalid={fieldErrors.email.length > 0 || Boolean(projectMemberData.email && !emailRegex.test(projectMemberData.email))}
                  errorMessage={fieldErrors.email || t('form.errors.email')}
                />

                <FormInput
                  name="orcid"
                  type="text"
                  label={t('form.labels.orcid')}
                  value={projectMemberData.orcid}
                  onChange={(e) => {
                    setProjectMemberData({ ...projectMemberData, orcid: e.target.value });
                    // Clear the error for this field when user changes it
                    setFieldErrors(prev => ({ ...prev, orcid: '' }));
                  }}
                  isInvalid={fieldErrors.orcid.length !== 0}
                  errorMessage={fieldErrors.orcid || t('form.errors.orcid')}
                />

                <CheckboxGroupComponent
                  name="projectRoles"
                  value={checkboxRoles}
                  onChange={(newValues) => handleCheckboxChange(newValues)}
                  isRequired={false}
                  checkboxGroupLabel={t('form.labels.checkboxGroupLabel')}
                  checkboxGroupDescription={t('form.labels.checkboxGroupDescription')}
                  isInvalid={checkboxRoles.length === 0}
                  errorMessage={fieldErrors.projectRoles || t('form.errors.projectRoles')}
                >
                  {roles.map((role, index) => (
                    <div key={index}>
                      <Checkbox
                        value={role?.id?.toString() ?? ''}
                        aria-label={CreateMember('projectRolesOptions') + ' ' + role.label}
                        data-testid={`role-checkbox-${role?.id}`}
                      >
                        <div className="checkbox">
                          <svg viewBox="0 0 18 18" aria-hidden="true">
                            <polyline points="1 9 7 14 15 4" />
                          </svg>
                        </div>
                        <div className="">
                          <span>
                            {role.label}
                          </span>

                        </div>
                      </Checkbox>
                    </div>
                  ))}
                </CheckboxGroupComponent>

                <Button type="submit">{Global('buttons.saveChanges')}</Button>
              </div>
            </Form>
          </div>


        </ContentContainer>
      </LayoutContainer>
    </>
  );
};

export default ProjectsProjectMemberCreate;
