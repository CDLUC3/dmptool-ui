'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

// GraphQL
import { useQuery } from '@apollo/client/react';
import { MemberRolesDocument, MemberRole } from '@/generated/graphql';

// Utils and other
import { useToast } from '@/context/ToastContext';
import { addProjectMemberAction } from '@/app/actions';
import { AddProjectMemberResponse } from '@/app/types';
import { extractErrors } from '@/utils/errorHandler';
import { routePath } from '@/utils/index';

export const EMAIL_REGEX = /\S+@\S+\.\S+/;

export interface ProjectMemberFormState {
  givenName: string;
  surName: string;
  affiliationId: string;
  affiliationName: string;
  otherAffiliationName: string;
  email: string;
  orcid: string;
}

export const useProjectMemberForm = (projectId: string) => {
  const router = useRouter();
  const toastState = useToast();
  const t = useTranslations('ProjectsProjectMembersSearch');

  const [projectMember, setProjectMember] = useState<ProjectMemberFormState>({
    givenName: '',
    surName: '',
    affiliationId: '',
    affiliationName: '',
    otherAffiliationName: '',
    email: '',
    orcid: '',
  });

  const [roles, setRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState({
    givenName: '',
    surName: '',
    affiliationId: '',
    affiliationName: '',
    email: '',
    projectRoles: '',
  });

  const {
    data: memberRolesData,
    loading: memberRolesLoading,
    error: memberRolesError,
    refetch: refetchMemberRoles,
  } = useQuery(MemberRolesDocument);
  const memberRoles: MemberRole[] =
    memberRolesData?.memberRoles?.filter((r): r is MemberRole => r !== null) || [];

  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({
      givenName: '',
      surName: '',
      affiliationId: '',
      affiliationName: '',
      email: '',
      projectRoles: '',
    });
  }, []);

  const clearAllFormFields = useCallback(() => {
    setProjectMember({
      givenName: '',
      surName: '',
      affiliationId: '',
      affiliationName: '',
      otherAffiliationName: '',
      email: '',
      orcid: '',
    });
    setRoles([]);
  }, []);

  const resetErrors = useCallback(() => {
    setErrors([]);
    clearAllFieldErrors();
  }, [clearAllFieldErrors]);

  // Update affiliation fields
  const updateAffiliationFormData = useCallback(async (id: string, value: string) => {
    resetErrors();
    setProjectMember((prev) => ({
      ...prev,
      affiliationId: id,
      affiliationName: value,
      otherAffiliationName: id === 'other' ? prev.otherAffiliationName : '',
    }));
  }, [resetErrors]);


  const validationRules = useMemo(() => ({
    givenName: (value: string) =>
      !value.trim() ? t('messaging.errors.givenNameRequired') : '',
    surName: (value: string) =>
      !value.trim() ? t('messaging.errors.surNameRequired') : '',
    affiliationName: () => {
      if (projectMember.affiliationId === 'other') {
        return !projectMember.otherAffiliationName.trim()
          ? t('messaging.errors.affiliationRequired')
          : '';
      }
      return !projectMember.affiliationName.trim()
        ? t('messaging.errors.affiliationRequired')
        : '';
    },
    email: (value: string) =>
      value.trim() && !EMAIL_REGEX.test(value)
        ? t('messaging.errors.invalidEmail')
        : '',
    roles: (roles: string[]) =>
      roles.length === 0
        ? t('messaging.errors.projectRolesRequired')
        : '',
  }), [t, projectMember.affiliationId, projectMember.affiliationName, projectMember.otherAffiliationName]);

  // Validate fields on form submit
  const validateForm = useCallback(() => {
    const newFieldErrors = {
      givenName: validationRules.givenName(projectMember.givenName),
      surName: validationRules.surName(projectMember.surName),
      affiliationName: validationRules.affiliationName(),
      affiliationId: '', // No validation for affiliationId to avoid duplicate errors
      email: validationRules.email(projectMember.email),
      projectRoles: validationRules.roles(roles),
    };

    const hasErrors = Object.values(newFieldErrors).some((err) => err !== '');
    return { fieldErrors: newFieldErrors, hasErrors };
  }, [validationRules, projectMember, roles]);

  // Call to addProjectMember mutation
  const addProjectMember = useCallback(async (): Promise<AddProjectMemberResponse> => {
    const memberRoleIds = roles.map((r) => parseInt(r, 10));

    const response = await addProjectMemberAction({
      projectId: Number(projectId),
      givenName: projectMember.givenName,
      surName: projectMember.surName,
      email: projectMember.email,
      orcid: projectMember.orcid,
      affiliationName:
        projectMember.otherAffiliationName || projectMember.affiliationName,
      affiliationId: projectMember.affiliationId,
      memberRoleIds,
    });

    return response;
  }, [roles, projectId, projectMember]);


  // Handle member details form submission
  const handleFormSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    resetErrors();

    const { fieldErrors: newFieldErrors, hasErrors } = validateForm();
    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      setErrors(extractErrors(newFieldErrors));
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await addProjectMember();

      if (response.redirect) {
        router.push(response.redirect);
        return;
      }

      if (!response.success) {
        const messages =
          response.errors && response.errors.length > 0
            ? response.errors
            : [t('messaging.errors.failedToAddProjectMember')];
        setErrors(messages);
        return;
      }

      if (response.data?.errors) {
        const normalized = Object.fromEntries(
          Object.entries(response.data.errors).map(([k, v]) => [k, v ?? undefined])
        );
        const errs = extractErrors(normalized, [
          'general',
          'affiliationId',
          'email',
          'givenName',
          'memberRoleIds',
          'orcid',
          'projectId',
          'surName',
        ]);

        if (errs.length > 0) {
          setErrors(errs);
          return;
        }
      }

      toastState.add(
        t('messaging.success.addedProjectMember', {
          name: `${projectMember.givenName} ${projectMember.surName}`,
        }),
        { type: 'success' }
      );

      router.push(routePath('projects.members.index', { projectId }));
    } finally {
      setIsSubmitting(false);
    }
  }, [resetErrors, validateForm, isSubmitting, addProjectMember, router, projectId, t, toastState, projectMember.givenName, projectMember.surName]);

  // Handle member role checkbox changes
  const handleCheckboxChange = useCallback((values: string[]) => {
    resetErrors();
    setRoles(values);
  }, [resetErrors]);


  return {
    projectMember,
    setProjectMember,
    roles,
    memberRoles,
    memberRolesLoading,
    memberRolesError,
    refetchMemberRoles,
    isSubmitting,
    errors,
    fieldErrors,
    handleCheckboxChange,
    handleFormSubmit,
    resetErrors,
    updateAffiliationFormData,
    clearAllFieldErrors,
    clearAllFormFields,
    setErrors,
  };
};
