'use client';

import { useCallback, useEffect, useRef, useReducer, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Form,
  Link,
  DialogTrigger,
} from "react-aria-components";

// Components
import PageHeader from "@/components/PageHeader";
import {
  ContentContainer,
  LayoutContainer,
} from "@/components/Container";
import { FormInput } from "@/components/Form";
import { TypeAheadWithOther } from '@/components/Form/TypeAheadWithOther';
import ErrorMessages from '@/components/ErrorMessages';
import Loading from '@/components/Loading';
import { ModalOverlayComponent } from '@/components/ModalOverlayComponent';
import TransitionButton from '@/components/TransitionButton';
import ProjectRoles from '../../ProjectRoles';

// GraphQL
import {
  MemberRole,
  ProjectMemberErrors,
  MemberRolesDocument,
  UpdateProjectMemberDocument,
  RemoveProjectMemberDocument
} from '@/generated/graphql';

// Hooks
import { useScrollToTop } from '@/hooks/scrollToTop';
import { useProjectMemberData } from "@/hooks/projectMemberData";
import { useAffiliationSearch } from '@/components/Form/TypeAheadWithOther/useAffiliationSearch';

//Utils and other
import logECS from '@/utils/clientLogger';
import { ProjectMemberFormInterface, ProjectMemberErrorInterface } from '@/app/types';
import styles from './ProjectsProjectMembersEdit.module.scss';
import { useToast } from '@/context/ToastContext';
import { routePath } from '@/utils/routes';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialState = {
  roles: [] as MemberRole[],
};

type State = typeof initialState;

type Action = { type: 'SET_ROLES'; payload: MemberRole[] };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_ROLES':
      return { ...state, roles: action.payload };
    default:
      return state;
  }
};

const ProjectsProjectMembersEdit: React.FC = () => {

  const [state, dispatch] = useReducer(reducer, initialState);

  // Get projectId and memberId params
  const params = useParams();
  const projectId = String(params.projectId);
  const memberId = String(params.memberId);

  //Routes
  const EDIT_MEMBER_ROUTE = routePath('projects.members.edit', { projectId, memberId });
  const PROJECT_MEMBERS_ROUTE = routePath('projects.members.index', { projectId });

  // Hooks for toast, router and scroll to top
  const toastState = useToast();
  const router = useRouter();
  const { scrollToTop } = useScrollToTop();

  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [otherField, setOtherField] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

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
  const MemberSearch = useTranslations('ProjectsProjectMembersSearch');

  // Get Member Roles
  const {
    data: memberRoles,
    loading: memberRolesLoading,
    error: memberRolesError,
    refetch: refetchMemberRoles,
  } = useQuery(MemberRolesDocument);

  // Hooks for project member data
  const {
    projectMemberData,
    checkboxRoles,
    setCheckboxRoles,
    loading,
    setProjectMemberData,
    queryError
  } = useProjectMemberData(Number(memberId));

  const {
    suggestions,
    handleSearch: handleAffiliationSearch,
    isSearching: isAffiliationSearching,
    searchError: affiliationSearchError,
  } = useAffiliationSearch();

  const isLoading = loading;
  const isError = queryError;


  // Initialize project member mutations
  const [updateProjectMemberMutation, { loading: isUpdating }] = useMutation(UpdateProjectMemberDocument);
  const [removeProjectMemberMutation] = useMutation(RemoveProjectMemberDocument);

  // Show Success Message for updating member
  const showSuccessToast = () => {
    const successMessage = t('form.success.memberUpdated');
    toastState.add(successMessage, { type: 'success' });
  }

  // Show Success Message for removing member
  const showRemoveSuccessToast = () => {
    const successMessage = t('form.success.removedMember');
    toastState.add(successMessage, { type: 'success' });
  }

  // Handle changes to role checkbox selection
  const handleCheckboxChange = (values: string[]) => {
    setCheckboxRoles(values); // Set the selected role IDs
    setFieldErrors(prev => ({ ...prev, projectRoles: '' }));
  }

  const updateAffiliationFormData = (id: string, value: string) => {
    resetErrors();
    setProjectMemberData({
      ...projectMemberData,
      affiliationId: id,
      affiliationName: value,
      otherAffiliationName: id === 'other' ? projectMemberData.otherAffiliationName : '',
    });
    setFieldErrors(prev => ({ ...prev, affiliationId: '' }));
  };

  const handleOtherAffiliationInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProjectMemberData({
      ...projectMemberData,
      otherAffiliationName: event.target.value,
    });
    setFieldErrors(prev => ({ ...prev, affiliationId: '' }));
  };

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

  // Remove project member
  const removeProjectMember = async (): Promise<[ProjectMemberErrors, boolean]> => {
    try {
      const response = await removeProjectMemberMutation({
        variables: {
          projectMemberId: Number(memberId)
        }
      });

      const responseErrors = response.data?.removeProjectMember?.errors
      if (responseErrors) {
        if (responseErrors && Object.values(responseErrors).filter((err) => err && err !== 'ProjectMemberErrors').length > 0) {
          return [responseErrors, false];
        }
      }
      return [{}, true];
    } catch (error) {
      logECS('error', 'removeProjectMember', {
        error,
        url: { path: EDIT_MEMBER_ROUTE }
      });
      setErrorMessages(prevErrors => [...prevErrors, t('form.errors.removingMember')]);
      return [{}, false];
    }
  }

  // Handle remove member from project
  const handleRemoveMember = async () => {
    setIsDeleting(true);
    const [errors, success] = await removeProjectMember();

    if (!success) {
      if (errors) {
        setFieldErrors({
          givenName: errors.givenName || '',
          surName: errors.surName || '',
          affiliationId: errors.affiliationId || '',
          email: errors.email || '',
          orcid: errors.orcid || '',
          projectRoles: errors.memberRoleIds ?? ''
        });
      }
      setErrorMessages([errors.general || t('form.errors.removingMember')]);
      setIsDeleting(false);

      // Scroll to top of page for errors
      scrollToTop(topRef);
    } else {
      // Show success message
      showRemoveSuccessToast();
      router.push(PROJECT_MEMBERS_ROUTE);
    }
  }

  // update the project member
  const updateProjectMember = async (): Promise<[ProjectMemberErrors, boolean]> => {
    try {
      const isOtherAffiliation = projectMemberData.affiliationId === 'other';
      const affiliationName = isOtherAffiliation
        ? projectMemberData.otherAffiliationName?.trim()
        : undefined;

      const input = {
        projectMemberId: Number(memberId),
        givenName: projectMemberData.givenName,
        surName: projectMemberData.surName,
        // Don't send the affiliationId if isOtherAffiliation is true, as the backend will handle it as a free-text affiliation
        affiliationId: isOtherAffiliation ? '' : projectMemberData.affiliationId,
        email: projectMemberData.email,
        orcid: projectMemberData.orcid,
        isPrimaryContact: projectMemberData.isPrimaryContact,
        memberRoleIds: checkboxRoles.filter((id) => id !== undefined).map(Number),
        ...(affiliationName ? { affiliationName } : {}),
      };

      const response = await updateProjectMemberMutation({
        variables: {
          input
        }
      });

      const responseErrors = response.data?.updateProjectMember?.errors
      if (responseErrors) {
        if (responseErrors && Object.values(responseErrors).filter((err) => err && err !== 'ProjectMemberErrors').length > 0) {
          return [responseErrors, false];
        }
      }

      return [{}, true];
    } catch (error) {
      logECS('error', 'updateProjectMember', {
        error,
        url: { path: EDIT_MEMBER_ROUTE }
      });
      setErrorMessages(prevErrors => [...prevErrors, t('form.errors.updatingMember')]);
      return [{}, false];
    }
  };

  // Client-side validation of fields
  const validateField = (name: string, value: string | string[] | undefined) => {
    let error = '';
    switch (name) {
      case 'givenName':
        if (!value || !value.toString().trim()) {
          error = MemberSearch('messaging.errors.givenNameRequired');
        }
        break;
      case 'surName':
        if (!value || !value.toString().trim()) {
          error = MemberSearch('messaging.errors.surNameRequired');
        }
        break;
      case 'affiliationName':
        if (!value || !value.toString().trim()) {
          error = MemberSearch('messaging.errors.affiliationRequired');
        }
        break;
      case 'email':
        if (value && !emailRegex.test(value as string)) {
          error = MemberSearch('messaging.errors.invalidEmail');
        }
        break;
      case 'projectRoles':
        if (!value || value.length === 0) {
          error = MemberSearch('messaging.errors.projectRolesRequired');
        }
        break;
    }

    const errorField = name === 'affiliationName' ? 'affiliationId' : name;
    setFieldErrors(prevErrors => ({
      ...prevErrors,
      [errorField]: error
    }));
    return error;
  }

  // Check whether form is valid before submitting
  const isFormValid = (): boolean => {
    // Initialize a flag for form validity
    let isValid = true;

    const fieldsToValidate: [keyof ProjectMemberFormInterface | 'projectRoles', string | string[] | undefined][] = [
      ['givenName', projectMemberData.givenName],
      ['surName', projectMemberData.surName],
      ['affiliationName', projectMemberData.affiliationId === 'other'
        ? projectMemberData.otherAffiliationName
        : projectMemberData.affiliationName],
      ['email', projectMemberData.email],
      ['projectRoles', checkboxRoles],
    ];

    fieldsToValidate.forEach(([name, value]) => {
      const error = validateField(name, value);
      if (error) {
        isValid = false;
      }
    });
    return isValid;
  };

  const resetErrors = useCallback(() => {
    setErrorMessages([]);
    clearAllFieldErrors();
  }, [clearAllFieldErrors]);

  // Handle form submit
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Clear previous error messages
    resetErrors();

    if (isFormValid()) {
      // Create new section
      const [errors, success] = await updateProjectMember();

      // Check if there are any errors (always exclude the GraphQL `_typename` entry)
      if (!success) {
        if (errors) {
          setFieldErrors({
            givenName: errors.givenName || '',
            surName: errors.surName || '',
            affiliationId: errors.affiliationId || '',
            email: errors.email || '',
            orcid: errors.orcid || '',
            projectRoles: errors.memberRoleIds ?? ''
          });
        }
        setErrorMessages([errors.general || t('form.errors.updatingMember')]);

      } else {
        // Show success message
        showSuccessToast();
        router.push(PROJECT_MEMBERS_ROUTE);
      }

      // Scroll to top of page
      scrollToTop(topRef);
    }
  };

  useEffect(() => {
    // Set the roles from the query
    if (memberRoles?.memberRoles) {
      const filteredRoles = memberRoles.memberRoles.filter((role): role is MemberRole => role !== null);
      dispatch({ type: 'SET_ROLES', payload: filteredRoles });
    }
  }, [memberRoles]);

  if (isLoading) {
    return (
      <Loading
        variant="page"
        message={Global('messaging.loading')}
      />
    );
  }

  if (isError) {
    return <div>{Global('messaging.error')}</div>;
  }


  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.show', { projectId })}>{Global('breadcrumbs.project')}</Link></Breadcrumb>
            <Breadcrumb><Link href={PROJECT_MEMBERS_ROUTE}>{t('breadcrumbs.projectMembers')}</Link></Breadcrumb>
            <Breadcrumb>{t('title')}</Breadcrumb>
          </Breadcrumbs>
        }
        className="page-member-edit"
      />

      <ErrorMessages errors={errorMessages} ref={errorRef} />

      <LayoutContainer>
        <ContentContainer>
          <div ref={topRef}>
            <Form onSubmit={handleFormSubmit} className={styles.editForm}>
              <div className={styles.formSection}>
                <FormInput
                  name="givenName"
                  type="text"
                  isRequiredVisualOnly={true}
                  label={MemberSearch('labels.givenName')}
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
                  isRequiredVisualOnly={true}
                  label={MemberSearch('labels.surName')}
                  value={projectMemberData.surName}
                  onChange={(e) => {
                    setProjectMemberData({ ...projectMemberData, surName: e.target.value });
                    // Clear the error for this field when user changes it
                    setFieldErrors(prev => ({ ...prev, surName: '' }));
                  }}
                  isInvalid={fieldErrors.surName.length !== 0}
                  errorMessage={fieldErrors.surName}
                />

                <TypeAheadWithOther
                  label={MemberSearch('labels.affiliation')}
                  fieldName="affiliation"
                  setOtherField={setOtherField}
                  isRequiredVisualOnly={true}
                  error={fieldErrors.affiliationId || affiliationSearchError}
                  updateFormData={updateAffiliationFormData}
                  value={projectMemberData.affiliationName}
                  suggestions={suggestions}
                  onSearch={handleAffiliationSearch}
                  isLoading={isAffiliationSearching}
                />
                {otherField && (
                  <FormInput
                    name="otherAffiliationName"
                    type="text"
                    label={MemberSearch('labels.otherAffiliationName')}
                    value={projectMemberData.otherAffiliationName ?? ''}
                    onChange={handleOtherAffiliationInputChange}
                  />
                )}

                <FormInput
                  name="email"
                  type="email"
                  isRequired={false}
                  isRecommended={true}
                  label={MemberSearch('labels.email')}
                  value={projectMemberData.email}
                  onChange={(e) => {
                    setProjectMemberData({ ...projectMemberData, email: e.target.value });
                    // Clear the error for this field when user changes it
                    setFieldErrors(prev => ({ ...prev, email: '' }));
                  }}
                  isInvalid={fieldErrors.email.length > 0 || Boolean(projectMemberData.email && !emailRegex.test(projectMemberData.email))}
                  errorMessage={
                    fieldErrors.email
                    || (projectMemberData.email && !emailRegex.test(projectMemberData.email)
                      ? MemberSearch('messaging.errors.invalidEmail')
                      : '')
                  }
                />

                <FormInput
                  name="orcid"
                  type="text"
                  isRequired={false}
                  isRecommended={true}
                  label={MemberSearch('labels.orcid')}
                  value={projectMemberData.orcid}
                  onChange={(e) => {
                    setProjectMemberData({ ...projectMemberData, orcid: e.target.value });
                    // Clear the error for this field when user changes it
                    setFieldErrors(prev => ({ ...prev, orcid: '' }));
                  }}
                  isInvalid={fieldErrors.orcid.length !== 0}
                  errorMessage={fieldErrors.orcid || t('form.errors.orcid')}
                />

                <div className={styles.memberRoles}>
                  <ProjectRoles
                    roles={checkboxRoles}
                    handleCheckboxChange={handleCheckboxChange}
                    isInvalid={(!!fieldErrors.projectRoles)}
                    errorMessage={fieldErrors.projectRoles}
                    memberRoles={state.roles}
                    isLoading={memberRolesLoading}
                    hasLoadError={Boolean(memberRolesError)}
                    onRetry={() => void refetchMemberRoles()}
                  />
                </div>

                <TransitionButton
                  type="submit"
                  isDisabled={isUpdating}
                  loadingLabel={Global('messaging.saving')}
                  loadingVariant="inline"
                  showLoading={false}
                >
                  {Global('buttons.saveChanges')}
                </TransitionButton>
              </div>
            </Form>
          </div>

          {/* Delete Project Member Modal */}
          <section className={styles.dangerZone} aria-labelledby="remove-member" data-testid="remove-member">
            <h2 id="remove-member">{t('headings.h2RemoveMember')}</h2>
            <p>
              {t('paragraphs.removeMember')}
            </p>
            <DialogTrigger>
              <Button
                className="danger"
                isDisabled={isDeleting}
              >
                {isDeleting ? `${t('buttons.removing')}...` : t('buttons.removeMember')}
              </Button>
              <ModalOverlayComponent
                heading={t('headings.removeProjectMember')}
                content={t('paragraphs.modalInfo')}
                btnSecondaryText={Global('buttons.cancel')}
                btnPrimaryText={isDeleting ? `${t('buttons.removing')}...` : t('buttons.removeMember')}
                isPrimaryDisabled={isDeleting}
                onPressAction={async (_event, close) => {
                  await handleRemoveMember();
                  close();
                }}
              />
            </DialogTrigger>
          </section>
        </ContentContainer>
      </LayoutContainer>
    </>
  );
};

export default ProjectsProjectMembersEdit;
