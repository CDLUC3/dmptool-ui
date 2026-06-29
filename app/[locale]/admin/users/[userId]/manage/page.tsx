'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/routing";
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Form,
  ListBoxItem,
  Radio
} from 'react-aria-components';

// GraphQL queries and mutations
import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react';
import {
  ArchiveUserDocument,
  LanguagesDocument,
  MeDocument,
  PlansDocument,
  UpdateUserInfoDocument,
  UpdateUserRoleDocument,
  UserDocument,
  UserErrors,
  UserRole,
  UserQuery
} from "@/generated/graphql";

// Components
import PageHeader from '@/components/PageHeader';
import ErrorMessages from '@/components/ErrorMessages';
import Pagination from '@/components/Pagination';
import {
  FormInput,
  FormSelect,
  RadioGroupComponent
} from "@/components/Form";
import {
  ContentContainer,
  LayoutWithPanel,
  LayoutSplitPanel,
  FullWidthSection,
} from '@/components/Container';
import { TypeAheadWithOther, useAffiliationSearch } from "@/components/Form/TypeAheadWithOther";
import Loading from '@/components/Loading';
import {
  DmpTable,
  DmpTableColumnSet,
} from '@/components/Table';
import { useFormatDate } from "@/hooks/useFormatDate";

// Utils and other
import logECS from "@/utils/clientLogger";
import { LanguageInterface } from "@/app/types";
import {
  extractErrors,
  handleApolloError,
  isValidEmail,
  routePath
} from "@/utils/index";
import { RoleOptions } from "@/lib/constants";
import { useToast } from "@/context/ToastContext";
import styles from './userProfile.module.scss';

const LIMIT = 5;

interface UserProfileFormInterface {
  email: string;
  givenName: string;
  surName: string;
  affiliationName: string;
  affiliationId: string;
  otherAffiliationName: string;
  languageId: string;
}
interface UserProfileErrorInterface {
  email: string;
  givenName: string;
  surName: string;
  affiliationName: string;
  affiliationId: string;
  otherAffiliationName: string;
  languageId: string;
}

interface PlanRow {
  id: string | null | undefined;
  title: React.ReactNode;
  template: string | null | undefined;
  organization: string | null | undefined;
  owner: string | null | undefined;
  updated: string;
  visibility: string | null | undefined;
}



function OrgUserProfilePage(): React.ReactElement {
  const initialColumns = useMemo<DmpTableColumnSet>(() => [
    { id: 'title', name: 'Project Title', isRowHeader: true, allowsSorting: true, direction: "" as const },
    { id: 'template', name: 'Template', isRowHeader: true, allowsSorting: true, direction: "" as const },
    { id: 'organization', name: 'Organization', isRowHeader: true, allowsSorting: false, direction: "" as const },
    { id: 'owner', name: 'Owner', isRowHeader: true, allowsSorting: false, direction: "" as const },
    { id: 'updated', name: 'Updated', isRowHeader: true, allowsSorting: true, direction: "" as const },
  ], []);

  const errorRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  //To control display of showSuccess toast message
  const hasShownToastRef = useRef(false);
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const toastState = useToast();
  const searchParams = useSearchParams();
  const params = useParams();
  const userId = String(params.userId); // From route /users/:userId
  const formatDate = useFormatDate();

  // States
  // Flag to indicate if this is the initial load of the page
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [otherField, setOtherField] = useState(false);
  const [languages, setLanguages] = useState<LanguageInterface[]>([]);
  // User profile form data state
  const [userProfileFormData, setUserProfileFormData] = useState<UserProfileFormInterface>({
    email: "",
    givenName: "",
    surName: "",
    affiliationName: "",
    affiliationId: "",
    otherAffiliationName: "",
    languageId: "",
  });
  // Field errors
  const [fieldErrors, setFieldErrors] = useState<UserProfileErrorInterface>({
    email: "",
    givenName: "",
    surName: "",
    affiliationName: "",
    affiliationId: "",
    otherAffiliationName: "",
    languageId: "",
  });

  // States for plans table
  const [columns, setColumns] = useState<DmpTableColumnSet>(initialColumns);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<string>('DESC');
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [user, setUser] = useState<NonNullable<UserQuery['user']> | null>(null);

  // States for search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { suggestions, handleSearch } = useAffiliationSearch();

  // States for pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean | null>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean | null>(false);

  // States for merging accounts
  const [mergeSearchTerm, setMergeSearchTerm] = useState<string>('');
  const [mergeSearchResults, setMergeSearchResults] = useState<{ id: string; email: string, name: string }[]>([]);
  const [selectedMergeUser, setSelectedMergeUser] = useState<{ id: string; email: string, name: string } | null>(null);
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);

  // State for changing a user's role
  const [selectedRole, setSelectedRole] = useState<string>('');



  // Localization
  const t = useTranslations('Admin.userProfile');
  const Global = useTranslations('Global');

  // URL that directs users back to admin/users page after they archive a user. 
  const ADMIN_USERS_URL = routePath('admin.users');

  // GraphQL queries and mutations
  // Run queries
  const { data: languageData } = useQuery(LanguagesDocument);
  const { data: meData } = useQuery(MeDocument);
  const { data: userData, loading: userLoading } = useQuery(UserDocument, {
    variables: { userId: Number(userId) },
  });

  // Mutations
  const [archiveUserMutation] = useMutation(ArchiveUserDocument);
  const [updateUserRoleMutation] = useMutation(UpdateUserRoleDocument);
  // Initialize user profile mutation
  const [updateUserInfoMutation, { loading: updateUserInfoLoading }] = useMutation(UpdateUserInfoDocument, {
    refetchQueries: [
      {
        query: UserDocument,
        variables: { userId: Number(userId) },
      }
    ],
    awaitRefetchQueries: true,
  });

  // Initialize user plans query
  const [fetchUserPlanData, { data: planData, loading: plansLoading, error: plansError }] = useLazyQuery(PlansDocument, {
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'no-cache',
  });


  // Fetch plans based on pagination page, filters and search term criteria
  const fetchPlans = async ({
    page,
    searchTerm = ''
  }: {
    page?: number;
    searchTerm?: string;
  }): Promise<void> => {
    if (page) {
      setCurrentPage(page);
    }

    try {
      await fetchUserPlanData({
        variables: buildQueryVars(page ?? currentPage, searchTerm, sortField, sortDir)
      });
    } catch (err) {
      handleApolloError(err, 'OrgUserAccountsPage.fetchUserData');
    }
  };

  // Builds the query variables for fetching user plans based on pagination, 
  // search term, and sorting criteria
  const buildQueryVars = (
    page: number,
    searchTerm: string,
    sortField?: string,
    sortDir?: string,
  ) => ({
    paginationOptions: {
      offset: (page - 1) * LIMIT,
      limit: LIMIT,
      type: "OFFSET",
      sortDir: sortDir ?? "DESC",
      sortField
    },
    term: searchTerm,
    userId: Number(userId),
  });

  const showSuccessToast = () => {
    const successMessage = t("messages.success.profileUpdateSuccess");
    toastState.add(successMessage, { type: "success" });
  };

  // Clear all error messages
  const clearAllErrorMessages = () => {
    setErrorMessages([]);
    setFieldErrors({
      email: "",
      givenName: "",
      surName: "",
      affiliationName: "",
      affiliationId: "",
      otherAffiliationName: "",
      languageId: "",
    });
  };

  // Handle any changes to User Profile form field values
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    clearAllErrorMessages();
    setUserProfileFormData({ ...userProfileFormData, [name]: value });
  };

  // Client-side validation of required form fields
  const validateField = (name: string, value: string | string[] | undefined) => {
    let error = '';
    switch (name) {
      case 'givenName':
        if (!value || value.length <= 2) {
          error = t('messages.errors.givenName');
        }
        break;
      case 'surName':
        if (!value || value.length <= 2) {
          error = t('messages.errors.surName');
        }
        break;
      case 'email':
        if (!value || !isValidEmail(value as string)) {
          error = t('messages.errors.invalidEmail');
        }
        break;
      case "affiliationId":
        if (userProfileFormData["affiliationName"] !== "Other" && (!value || value.length <= 2)) {
          error = t("messages.errors.affiliationValidation");
        }
        break;
      case "otherAffiliationName":
        // We only want to validate this field if the user specifically selected this 'Other' option
        if (userProfileFormData["affiliationName"] === "Other") {
          if (!value || value.length <= 2) {
            error = t("messages.errors.otherAffiliationValidation");
          }
          break;
        }
    }

    setFieldErrors(prevErrors => ({
      ...prevErrors,
      [name]: error
    }));
    return error;
  }

  // Identifies field-level errors and returns a boolean indicating if the form is valid or not
  const isFormValid = (): boolean => {
    // Initialize a flag for form validity
    let isValid = true;

    // Iterate over formData to validate each field
    Object.keys(userProfileFormData).forEach((key) => {
      const name = key as keyof UserProfileFormInterface;
      const value = userProfileFormData[name];

      // Call validateField to update errors for each field
      const error = validateField(name, value);
      if (error) {
        isValid = false;
      }
    });
    return isValid;
  };

  /* This function is called by the affiliation typeahead component
when affiliation/institution is changed */
  const updateAffiliationFormData = async (id: string, value: string) => {
    clearAllErrorMessages();
    return setUserProfileFormData({
      ...userProfileFormData,
      affiliationName: value,
      affiliationId: id,
    });
  };

  // Update Profile info
  const updateProfile = async () => {
    try {
      const response = await updateUserInfoMutation({
        variables: {
          input: {
            userId: Number(userId),
            email: userProfileFormData.email,
            givenName: userProfileFormData.givenName,
            surName: userProfileFormData.surName,
            affiliationId: userProfileFormData.affiliationId,
            otherAffiliationName: userProfileFormData.otherAffiliationName,
            languageId: userProfileFormData.languageId,
          },
        },
      });

      if (response.data) {
        const userErrors = response.data.updateUserInfo?.errors;

        if (userErrors) {
          // Checks for errors for these fields and extracts them into an array of error messages
          const errs = extractErrors<UserErrors>(userErrors, ["general", "email", "givenName", "surName"]);

          if (errs.length > 0) {
            setErrorMessages(errs);
            logECS("error", "OrgUserProfilePage.updateProfile", {
              errors: errs,
              url: { path: routePath("admin.users.manage") },
            });
            return;
          }
        }
        showSuccessToast();
      }
    } catch (error) {
      logECS("error", "OrgUserProfilePage.updateProfile", {
        errors: error,
        url: { path: routePath("admin.users.manage") },
      });
      setErrorMessages([t("messages.errors.errorUpdatingProfile")]);
    }
  };

  // Handles the form submission for updating user profile information
  const handleUserProfileFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Clear previous error messages
    clearAllErrorMessages();
    setErrorMessages([]);

    if (isFormValid()) {
      await updateProfile();
    } else {
      setErrorMessages([t('messages.errors.errorUpdatingProfile')])
    }
  };


  // Handles search input changes - updates the search term state and fetches 
  // all users if the search term is cleared
  const handleSearchInput = async (term: string) => {
    setSearchTerm(term);
    // If the search term is cleared, fetch all users again to refresh the data.
    if (term === '') {
      await fetchUserPlanData({ variables: buildQueryVars(1, '', sortField, sortDir) });
    }
  }

  // Handles the search submit button click - resets to page 1 and queries plans based on search term
  const handleSearchSubmit = async () => {
    setErrorMessages([]);
    setCurrentPage(1);
    try {
      await fetchUserPlanData({ variables: buildQueryVars(1, searchTerm, sortField, sortDir) });
    } catch (err) {
      logECS('error', 'OrgUserAccountsPage.handleSearchSubmit', {
        error: err,
        url: { path: routePath('admin.users') },
      });
      setErrorMessages([t("messages.errors.searchError")]);
    }
  };

  // Handle pagination page click - query plans when pagination page is changed
  const handlePageClick = async (page: number) => {
    await fetchPlans({
      page, searchTerm
    });
  };

  // Handle changes to the merge search input
  const handleMergeSearchInput = (term: string) => {
    setMergeSearchTerm(term);
  };

  // Dummy function to simulate searching for users to merge
  const handleMergeSearchSubmit = async () => {
    // Dummy response until backend is ready
    // TODO: Replace this with actual search results from backend once the mergeUsers mutation is implemented
    setMergeSearchResults([
      { id: "99", email: 'dummy.user@example.com', name: 'Dummy User' },
      { id: "100", email: 'test.user@example.com', name: 'Test User' },
    ]);
    setShowMergeConfirm(false);
    setSelectedMergeUser(null);
  };

  // Handle merging accounts
  const handleMergeSubmit = async () => {
    // TODO: wire up mergeUsers mutation once backend is complete
    toastState.add(t('mergeAccounts.successMessage'), { type: 'success' });
    setShowMergeConfirm(false);
    setSelectedMergeUser(null);
    setMergeSearchResults([]);
    setMergeSearchTerm('');
  };

  // Handle archiving a user
  const handleArchiveUser = async () => {
    try {
      const response = await archiveUserMutation({
        variables: { userId: Number(userId) },
      });

      const userErrors = response.data?.archiveUser?.errors;
      if (userErrors && Object.keys(userErrors).length > 0) {
        const errs = extractErrors<UserErrors>(userErrors, ["general"]);
        if (errs.length > 0) {
          setErrorMessages(errs);
          return;
        }
      }

      toastState.add(t('messages.success.archiveSuccess'), { type: 'success' });
      router.push(ADMIN_USERS_URL);
    } catch (err) {
      logECS('error', 'OrgUserProfilePage.handleArchiveUser', {
        error: err,
        url: { path: routePath('admin.users') },
      });
      setErrorMessages([t('messages.errors.errorArchivingUser')]);
    }
  };

  // Update user role
  const handleRoleChange = async (newRole: string) => {
    try {
      const response = await updateUserRoleMutation({
        variables: {
          input: {
            userId: Number(userId),
            role: newRole as UserRole,
          }
        }
      });

      if (response.data) {
        const userErrors = response.data.updateUserRole?.errors;

        if (userErrors) {
          // Checks for errors for these fields and extracts them into an array of error messages
          const errs = extractErrors<UserErrors>(userErrors, ["general", "role"]);

          if (errs.length > 0) {
            setErrorMessages(errs);
            logECS("error", "OrgUserProfilePage.handleRoleChange", {
              errors: errs,
              url: { path: routePath("admin.users.manage") },
            });
            return;
          }
        }

        showSuccessToast();
      }
    } catch (err) {
      logECS("error", "OrgUserProfilePage.handleRoleChange", {
        errors: err,
        url: { path: routePath("admin.users.manage") },
      });
      setErrorMessages([t("messages.errors.errorUpdatingUserRole")]);
    }
  };

  // Handle sorting changes in the table
  const onSortChangeHandler = async (newColumns: DmpTableColumnSet) => {
    setColumns(newColumns);
    const activeSort = Array.from(newColumns).find(col => col.allowsSorting && col.direction !== '');
    if (activeSort) {
      const newSortField = activeSort.id;
      const newSortDir = activeSort.direction === 'ascending' ? 'ASC' : 'DESC';
      setSortField(newSortField);
      setSortDir(newSortDir);
      try {
        await fetchUserPlanData({ variables: buildQueryVars(currentPage, searchTerm, newSortField, newSortDir) });
      } catch (err) {
        logECS('error', 'OrgUserAccountsPage.onSortChangeHandler', {
          error: err,
          url: { path: routePath('admin.users') },
        });
        setErrorMessages([t("messages.errors.searchError")]);
      }
    }
  };

  // Transform the plan data from the GraphQL query into a format suitable for the table
  const transformPlans = (data: typeof planData): PlanRow[] => {
    return data?.plans?.items
      ?.filter((plan): plan is NonNullable<typeof plan> => plan !== null)
      .map((plan) => {
        return {
          id: plan.id?.toString(),
          title: (
            <Link href={routePath('admin.users.projects', { userId })}>
              {plan.title}
            </Link>
          ),
          template: plan.templateTitle ?? '',
          organization: plan.templateOwnerAffiliationName ?? '',
          owner: `${plan?.planCreator?.givenName} ${plan?.planCreator?.surName}`,
          updated: formatDate(plan.modified) ?? '',
          visibility: plan.visibility ?? '',
        };
      }) ?? [];
  };

  // Set languages when languageData is loaded or changes
  useEffect(() => {
    const handleLanguageLoad = async () => {
      try {
        if (languageData) {
          const languages = (languageData?.languages || []).filter((language) => language !== null);
          setLanguages(languages);
        }
      } catch (err) {
        logECS("error", "loading languages", {
          error: err,
          url: { path: routePath("account.profile") },
        });
        setErrorMessages((prevErrors) => ({
          ...prevErrors,
          general: Global("messaging.somethingWentWrong"),
        }));
      }
    };

    handleLanguageLoad();
  }, [languageData]);


  // Load plans on mount
  useEffect(() => {
    fetchPlans({ page: currentPage, searchTerm: '' });
  }, []);

  // Update plans state when planData changes, and set pagination info
  useEffect(() => {
    if (planData?.plans?.items) {
      setIsInitialLoad(false);
      const totalCount = planData.plans.totalCount ?? 0;
      setTotalPages(Math.ceil(totalCount / LIMIT));
      setHasNextPage(planData.plans.hasNextPage ?? false);
      setHasPreviousPage(planData.plans.hasPreviousPage ?? false);
      const transformed = transformPlans(planData);
      setPlans(transformed);
    }
  }, [planData]);

  // Update user profile form data when userData changes
  useEffect(() => {
    if (userData?.user) {
      setUser(userData.user);
      setUserProfileFormData({
        email: userData.user.email ?? '',
        givenName: userData.user.givenName ?? '',
        surName: userData.user.surName ?? '',
        affiliationName: userData.user.affiliation?.displayName ?? '',
        affiliationId: userData.user.affiliation?.uri ?? '',
        otherAffiliationName: '',
        languageId: userData.user.languageId ?? '',
      });
      setSelectedRole(userData.user.role ?? '');
    }
  }, [userData]);

  // This is needed because the toast message is wiped out when the user changes their language/locale.
  // So we added a workaround, where we add the 'profileUpdated' query param, and display toast message after page load/navigation
  useEffect(() => {
    // Check if the toast has already been shown
    if (hasShownToastRef.current) return;

    const profileUpdated = searchParams.get("profileUpdated");
    // If the profile was updated, show the success toast once
    if (profileUpdated === "true") {
      hasShownToastRef.current = true; // Prevent showing the toast again
      showSuccessToast();
      // Clean up the URL parameter
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("profileUpdated");
      const basePath = `/${currentLocale}${pathname}`;
      const newUrl = `${basePath}${newParams.toString() ? `?${newParams.toString()}` : ""}`;
      router.replace(newUrl);
    }
  }, [searchParams, currentLocale, pathname]);

  useEffect(() => {
    if (plansError) {
      logECS('error', 'OrgUserProfilePage.fetchPlans', {
        error: plansError,
        url: { path: routePath('admin.users.manage') },
      });
      setErrorMessages([t('messages.errors.searchError')]);
    }
  }, [plansError]);


  // Set whether page should be read-only based on the current user's role
  const isReadOnly = meData?.me?.role !== UserRole.Superadmin;

  // This is to show the loading spinner for initial load or when user data is being fetched
  const isPageLoading = userLoading || isInitialLoad;

  // Derive the available roles based on the current user's role and current user's role
  const availableRoles = RoleOptions.filter(option => {
    if (option.value === '') return false; // exclude 'All Roles'
    if (meData?.me?.role !== UserRole.Superadmin) {
      return option.value !== UserRole.Superadmin; // Org Admins can't assign Superadmin
    }
    return true;
  });

  // Assemble user name since it's used in multiple places
  const userName = userData?.user
    ? `${userData.user.givenName} ${userData.user.surName}`
    : t('userProfile')

  return (
    <>
      {userData?.user && (
        <PageHeader
          title={t('title', { name: userName })}
          description=""
          showBackButton={true}
          breadcrumbs={
            <Breadcrumbs>
              <Breadcrumb><Link href={routePath('admin.index')}>Admin</Link></Breadcrumb>
              <Breadcrumb>{t('title', { name: userName })}</Breadcrumb>
            </Breadcrumbs>
          }
          actions={
            <>
              <Link
                href={ADMIN_USERS_URL}
                className="button-link button--primary"
              >
                {t('buttons.viewAllUsers')}
              </Link>
            </>
          }
          className="page-organization-users-dashboard-header"
        />
      )}

      <ErrorMessages errors={errorMessages} ref={errorRef} />
      {isPageLoading ? (
        <Loading message={Global('buttons.loading')} />
      ) : (
        <LayoutSplitPanel>
          <LayoutWithPanel>
            <ContentContainer>
              {/* Edit user details section */}
              <div className={styles.formSection}>
                <h2>{t('userProfileHeading', { name: userName })}</h2>
                <div className="sectionContainer">
                  <div className={`sectionContent`}>
                    <Form onSubmit={handleUserProfileFormSubmit}>
                      <FormInput
                        name="email"
                        type="text"
                        label={t("profileForm.labels.email")}
                        value={userProfileFormData.email || ''}
                        isRequiredVisualOnly={true}
                        disabled={isReadOnly}
                        onChange={handleInputChange}
                        isInvalid={fieldErrors.email.length > 0}
                        errorMessage={
                          fieldErrors.email.length > 0
                            ? fieldErrors.email
                            : t("messages.errors.invalidEmail")
                        }
                      />

                      <FormInput
                        name="givenName"
                        type="text"
                        label={t("profileForm.labels.givenName")}
                        isRequiredVisualOnly={true}
                        disabled={isReadOnly}
                        value={userProfileFormData.givenName || ''}
                        onChange={handleInputChange}
                        isInvalid={!!fieldErrors.givenName}
                        errorMessage={fieldErrors.givenName ?? ""}
                      />

                      <FormInput
                        name="surName"
                        type="text"
                        label={t("profileForm.labels.surName")}
                        isRequiredVisualOnly={true}
                        disabled={isReadOnly}
                        placeholder={userProfileFormData.surName}
                        value={userProfileFormData.surName || ''}
                        onChange={handleInputChange}
                        isInvalid={!!fieldErrors.surName}
                        errorMessage={fieldErrors.surName ?? ""}
                      />

                      <TypeAheadWithOther
                        label={t("profileForm.labels.institution")}
                        fieldName="institution"
                        setOtherField={setOtherField}
                        isRequiredVisualOnly={true}
                        isDisabled={isReadOnly}
                        error={fieldErrors.affiliationId ?? ''}
                        helpText={t('messages.helpText.institution')}
                        updateFormData={updateAffiliationFormData}
                        value={userProfileFormData.affiliationName}
                        suggestions={suggestions}
                        onSearch={handleSearch}
                      />
                      {otherField && (
                        <div className={`${styles.formRow} ${styles.oneItemRow}`}>
                          <FormInput
                            name="otherAffiliationName"
                            type="text"
                            label={t("profileForm.labels.otherInstitution")}
                            placeholder={userProfileFormData.otherAffiliationName}
                            value={userProfileFormData.otherAffiliationName}
                            onChange={handleInputChange}
                            isInvalid={!!fieldErrors["otherAffiliationName"]}
                            errorMessage={fieldErrors["otherAffiliationName"] ?? ""}
                          />
                        </div>
                      )}

                      <FormSelect
                        label={t("profileForm.labels.language")}
                        name="language"
                        items={languages}
                        isDisabled={isReadOnly}
                        errorMessage="A selection is required"
                        helpMessage={t("messages.helpText.language")}
                        onChange={(selected) => setUserProfileFormData({ ...userProfileFormData, languageId: selected as string })}
                        selectedKey={userProfileFormData.languageId}
                      >
                        {languages &&
                          languages.map((language) => {
                            return <ListBoxItem key={language.id} id={language.id}>{language.id}</ListBoxItem>;
                          })}
                      </FormSelect>
                      {!isReadOnly && (
                        <div className={styles.buttonContainer}>
                          <Button
                            type="submit"
                            data-testid="save-profile-button"
                            isDisabled={updateUserInfoLoading}
                            className={styles.btn}
                          >
                            {updateUserInfoLoading ? Global("buttons.saving") : Global("buttons.save")}
                          </Button>
                          <Button
                            type="button"
                            className="secondary"
                            data-testid="archive-user-button"
                            onPress={handleArchiveUser}
                          >
                            {Global("buttons.archive")}
                          </Button>
                        </div>
                      )}
                    </Form>
                  </div>
                </div>
              </div>

              {/** Identifiers */}
              {user?.ssoId || user?.orcid && (
                <div className={styles.formSection}>
                  <h2>{t("headings.identifiers")}</h2>
                  <dl>
                    <div role="presentation" className={styles.definitionListItem}>
                      <dt>{t("definitions.ssoId")}:{' '}</dt>
                      <dd>{user?.ssoId}</dd>
                    </div>
                    <div role="presentation" className={styles.definitionListItem}>
                      <dt>{t("definitions.orcid")}:{' '}</dt>
                      <dd>
                        {user?.orcid
                          ? <a href={user.orcid} target="_blank" rel="noreferrer noopener">{user.orcid}</a>
                          : null}
                      </dd>

                    </div>
                  </dl>
                </div>
              )}

              {/* Merge Accounts only displays for SuperAdmin */}
              {!isReadOnly && (
                <div className={styles.formSection}>
                  <h2>{t('headings.mergeAccounts')}</h2>
                  <div className="sectionContainer">
                    <div className={`sectionContent`}>
                      <div className={styles.pageTools} role="search" aria-label={t('mergeAccounts.searchUsers')}>
                        <>
                          <FormInput
                            name="mergeSearch"
                            type="search"
                            data-testid="search-merge-input"
                            className={styles.searchInput}
                            label={Global('buttons.search')}
                            onChange={e => handleMergeSearchInput(e.target.value)}
                            value={mergeSearchTerm}
                          />

                          <Button
                            onPress={handleMergeSearchSubmit}
                            isDisabled={plansLoading}
                            className={styles.searchButton}
                          >
                            {plansLoading ? Global('buttons.searching') : Global('buttons.search')}
                          </Button>
                        </>
                      </div>
                      {/** Dummy results */}
                      {mergeSearchResults.length > 0 && !showMergeConfirm && (
                        <div className={styles.mergeResults}>
                          <FormSelect
                            label={t('mergeAccounts.selectUser')}
                            name="mergeUser"
                            items={mergeSearchResults}
                            onChange={(key) => {
                              const found = mergeSearchResults.find(u => u.id === String(key));
                              setSelectedMergeUser(found ?? null);
                            }}
                          >
                            {mergeSearchResults.map(u => (
                              <ListBoxItem key={u.id} id={String(u.id)}>{u.email}</ListBoxItem>
                            ))}
                          </FormSelect>

                          <div className={styles.buttonContainer}>
                            <Button
                              onPress={() => handleMergeSubmit()}
                              isDisabled={!selectedMergeUser}
                              className={styles.btn}
                            >
                              {t('mergeAccounts.merge')}
                            </Button>
                            <Button
                              onPress={() => {
                                setShowMergeConfirm(false);
                                setSelectedMergeUser(null);
                                setMergeSearchResults([]);
                                setMergeSearchTerm('');
                              }}
                              className="secondary"
                            >
                              {Global('buttons.cancel')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Change user roles - different options based on user permissions */}
              <div className={styles.formSection}>
                <h2>{t('headings.role')}</h2>
                <div className="sectionContainer">
                  <div className="sectionContent">
                    <RadioGroupComponent
                      name="role"
                      value={selectedRole}
                      radioGroupLabel={t('roleRadioLabel')}
                      onChange={(value) => setSelectedRole(value as UserRole)}
                    >
                      {availableRoles.map(({ label, value }) => (
                        <div key={value}>
                          <Radio value={value}>{label}</Radio>
                        </div>
                      ))}
                    </RadioGroupComponent>
                    <div className={styles.buttonContainer}>
                      <Button
                        type="button"
                        onPress={() => handleRoleChange(selectedRole)}
                      >
                        {Global('buttons.save')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </ContentContainer>
          </LayoutWithPanel>


          {/**Plans table */}
          <FullWidthSection>
            <h2>Plans</h2>
            <div className={styles.pageTools} role="search" ref={topRef} aria-label={t('userPlansTable.searchPlans')}>
              <>
                <FormInput
                  name="search"
                  type="search"
                  data-testid="search-input"
                  className={styles.searchInput}
                  label={Global('buttons.search')}
                  onChange={e => handleSearchInput(e.target.value)}
                  value={searchTerm}
                />

                <Button
                  onPress={handleSearchSubmit}
                  isDisabled={plansLoading}
                  data-testid="plans-search-button"
                  className={styles.searchButton}
                >
                  {plansLoading ? Global('buttons.searching') : Global('buttons.search')}
                </Button>
              </>
            </div>
            {isInitialLoad
              ? <Loading message={Global('buttons.loading')} />
              : <DmpTable
                label={t('userPlansTable.label')}
                className={styles.userList}
                columnData={columns}
                rowData={plans}
                onDmpSortChange={onSortChangeHandler}
              />
            }

            {/**Don't display pagination if there are no results. Just display the message with the table headings */}
            {!plansLoading && plans && plans.length === 0 && !isInitialLoad ? (
              <p>{t('userPlansTable.noResults')}</p>
            ) :
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                hasPreviousPage={hasPreviousPage}
                hasNextPage={hasNextPage}
                handlePageClick={handlePageClick}
              />
            }
          </FullWidthSection>
        </LayoutSplitPanel >
      )}
    </>
  );
}

export default OrgUserProfilePage;