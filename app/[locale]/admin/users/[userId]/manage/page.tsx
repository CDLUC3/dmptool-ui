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
} from 'react-aria-components';

// GraphQL queries and mutations
import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react';
import {
  ArchiveUserDocument,
  LanguagesDocument,
  UserErrors,
  UserDocument,
  UpdateUserInfoDocument,
  PlansDocument,
  UserQuery
} from "@/generated/graphql";

// Components
import PageHeader from '@/components/PageHeader';
import ErrorMessages from '@/components/ErrorMessages';
import Pagination from '@/components/Pagination';
import { FormInput, FormSelect } from "@/components/Form";
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
  refreshAuthTokens,
  routePath
} from "@/utils/index";
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

function OrgUserProfilePage(): React.ReactElement {
  const initialColumns = useMemo<DmpTableColumnSet>(() => [
    { id: 'title', name: 'Project Title', isRowHeader: true, allowsSorting: true, direction: "" as const },
    { id: 'template', name: 'Template', isRowHeader: true, allowsSorting: true, direction: "" as const },
    { id: 'organization', name: 'Organization', isRowHeader: true, allowsSorting: false, direction: "" as const },
    { id: 'owner', name: 'Owner', isRowHeader: true, allowsSorting: false, direction: "" as const },
    { id: 'updated', name: 'Updated', isRowHeader: true, allowsSorting: true, direction: "" as const },
  ], []);

  const SORT_FIELD_MAP: Record<string, string> = {
    title: 'p.title',
    template: 'p.template',
    visibility: 'p.visibility',
  };

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

  // State
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [userProfileFormData, setUserProfileFormData] = useState<UserProfileFormInterface>({
    email: "",
    givenName: "",
    surName: "",
    affiliationName: "",
    affiliationId: "",
    otherAffiliationName: "",
    languageId: "",
  });
  const [otherField, setOtherField] = useState(false);
  const { suggestions, handleSearch } = useAffiliationSearch();
  const [languages, setLanguages] = useState<LanguageInterface[]>([]);

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

  // Flag to indicate if this is the initial load of the page
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [columns, setColumns] = useState<DmpTableColumnSet>(initialColumns);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<string>('DESC');
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [user, setUser] = useState<NonNullable<UserQuery['user']> | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // For pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean | null>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean | null>(false);

  // For merging accounts
  const [mergeSearchTerm, setMergeSearchTerm] = useState<string>('');
  const [mergeSearchResults, setMergeSearchResults] = useState<{ id: string; email: string, name: string }[]>([]);
  const [selectedMergeUser, setSelectedMergeUser] = useState<{ id: string; email: string, name: string } | null>(null);
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);

  // Localization
  const t = useTranslations('Admin.userProfile');
  const Global = useTranslations('Global');

  // Set URLs
  const ADMIN_USERS_URL = routePath('admin.users');

  // Run queries
  const { data: languageData } = useQuery(LanguagesDocument);
  const { data: userData, loading: userLoading } = useQuery(UserDocument, {
    variables: { userId: Number(userId) },
  });

  const [archiveUserMutation] = useMutation(ArchiveUserDocument);

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

  // Fetch users based on page, filters and search term criteria
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
      sortField: sortField ? SORT_FIELD_MAP[sortField] : undefined,
    },
    term: searchTerm,
    userId: Number(userId),
  });

  const showSuccessToast = () => {
    const successMessage = t("messages.success.profileUpdateSuccess");
    toastState.add(successMessage, { type: "success" });
  };

  const switchLanguage = async (newLocale: string, showToast = false) => {
    if (newLocale !== currentLocale) {
      const params = new URLSearchParams();
      // There was an issue with the toast message disappearing when switching languages,
      // so we added a query parameter to the URL to indicate that the profile was updated
      if (showToast) {
        params.set("profileUpdated", "true");
      }
      const queryString = params.toString();
      const basePath = `/${newLocale}${pathname}`;
      const newPath = queryString ? `${basePath}?${queryString}` : basePath;
      router.push(newPath);
    }
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

  // Handle any changes to form field values
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    clearAllErrorMessages();
    setUserProfileFormData({ ...userProfileFormData, [name]: value });
  };

  // Client-side validation of fields
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

  // Check whether form is valid before submitting
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

  /* This function is called by the child component, UpdateEmailAddress
when affiliation/institution is changed */
  const updateAffiliationFormData = async (id: string, value: string) => {
    clearAllErrorMessages();
    return setUserProfileFormData({
      ...userProfileFormData,
      affiliationName: value,
      affiliationId: id,
    });
  };

  const profileUpdateMutation = async () => {
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

    return response.data;
  };

  // Update Profile info
  const updateProfile = async () => {
    try {
      const response = await profileUpdateMutation();

      if (response) {
        const userErrors = response.updateUserInfo?.errors;

        if (userErrors) {
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

        // No errors — proceed
        await refreshAuthTokens();
        await switchLanguage(userProfileFormData.languageId, true);
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

  // Handle user profile form submit
  const handleUserProfileFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Clear previous error messages
    clearAllErrorMessages();
    setErrorMessages([]);

    if (isFormValid()) {
      // Add new project member
      await updateProfile();
    } else {
      setErrorMessages([t('messages.errors.errorUpdatingProfile')])
    }
  };


  // Just updates the search term
  const handleSearchInput = async (term: string) => {
    setSearchTerm(term);
    // If the search term is cleared, fetch all users again to refresh the data.
    if (term === '') {
      await fetchUserPlanData({ variables: buildQueryVars(1, '', sortField, sortDir) });
    }
  }

  // Only fires when the button is pressed
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

  // Handle pagination page click
  const handlePageClick = async (page: number) => {
    await fetchPlans({
      page: currentPage, searchTerm: searchTerm
    });
  };

  const handleMergeSearchInput = (term: string) => {
    setMergeSearchTerm(term);
  };

  const handleMergeSearchSubmit = async () => {
    // Dummy response until backend is ready
    setMergeSearchResults([
      { id: "99", email: 'dummy.user@example.com', name: 'Dummy User' },
      { id: "100", email: 'test.user@example.com', name: 'Test User' },
    ]);
    setShowMergeConfirm(false);
    setSelectedMergeUser(null);
  };

  const handleMergeSubmit = async () => {
    // TODO: wire up mergeUsers mutation once backend is complete
    toastState.add(t('mergeAccounts.successMessage'), { type: 'success' });
    setShowMergeConfirm(false);
    setSelectedMergeUser(null);
    setMergeSearchResults([]);
    setMergeSearchTerm('');
  };

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


  interface PlanRow {
    id: string | null | undefined;
    title: React.ReactNode;
    template: string | null | undefined;
    organization: string | null | undefined;
    owner: string | null | undefined;
    updated: string;
    visibility: string | null | undefined;
  }

  const transformPlans = (data: typeof planData): PlanRow[] => {
    return data?.plans?.items
      ?.filter((plan): plan is NonNullable<typeof plan> => plan !== null)
      .map((plan) => {
        return {
          id: plan.id?.toString(),
          title: (
            <Link href={routePath('admin.users.projects', { userId: userId })}>
              {plan.title}
            </Link>
          ),
          template: plan.templateTitle ?? '',
          organization: plan.templateOwnerAffiliationName ?? '',
          owner: `${plan?.user?.givenName} ${plan?.user?.surName}`,
          updated: formatDate(plan.modified) ?? '',
          visibility: plan.visibility ?? '',
        };
      }) ?? [];
  };


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


  // Load on mount
  useEffect(() => {
    fetchPlans({ page: currentPage, searchTerm: '' });
  }, []);

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
    }
  }, [userData]);

  // Check for query param to display toast message after page load/navigation
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

  const isPageLoading = userLoading || isInitialLoad;
  const userName = userData?.user
    ? `${userData.user.givenName} ${userData.user.surName}`
    : undefined;
  return (
    <>
      {userName && (
        <PageHeader
          title={t('title', { name: `${user?.givenName} ${user?.surName}` })}
          description=""
          showBackButton={true}
          breadcrumbs={
            <Breadcrumbs>
              <Breadcrumb><Link href={routePath('admin.index')}>Admin</Link></Breadcrumb>
              <Breadcrumb>{t('title', { name: `${user?.givenName} ${user?.surName}` })}</Breadcrumb>
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
              {/* Edit organization details section */}
              <div className={styles.formSection}>
                <h2>{t('userProfileHeading', { name: 'User Name' })}</h2>
                <div className="sectionContainer">
                  <div className={`sectionContent`}>
                    <Form onSubmit={handleUserProfileFormSubmit}>
                      <FormInput
                        name="email"
                        type="text"
                        label={t("profileForm.labels.email")}
                        value={userProfileFormData.email || ''}
                        isRequired={true}
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
                      <div className={styles.buttonContainer}>
                        <Button
                          type="submit"
                          isDisabled={updateUserInfoLoading}
                          className={styles.btn}
                        >
                          {updateUserInfoLoading ? Global("buttons.saving") : Global("buttons.save")}
                        </Button>
                        <Button
                          type="button"
                          className="secondary"
                          onPress={handleArchiveUser}
                        >
                          {Global("buttons.archive")}
                        </Button>

                      </div>

                    </Form>
                  </div>
                </div>
              </div>
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

              {/* Merge Accounts */}
              <div className={styles.formSection}>
                <h2>{t('headings.mergeAccounts')}</h2>
                <div className="sectionContainer">
                  <div className={`sectionContent`}>
                    <div className={styles.pageTools} role="search">
                      <>
                        <FormInput
                          name="mergeSearch"
                          type="search"
                          data-testid="search-input"
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
            </ContentContainer>
          </LayoutWithPanel>


          {/**Plans table */}
          <FullWidthSection>
            <h2>Plans</h2>
            <div className={styles.pageTools} role="search" ref={topRef}>
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

            {!plansLoading && plans && plans.length === 0 && !isInitialLoad && (
              <p>{t('userPlansTable.noResults')}</p>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              hasPreviousPage={hasPreviousPage}
              hasNextPage={hasNextPage}
              handlePageClick={handlePageClick}
            />

          </FullWidthSection>
        </LayoutSplitPanel >
      )}
    </>
  );
}

export default OrgUserProfilePage;