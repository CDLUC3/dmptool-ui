'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useParams } from "next/navigation";
import { usePathname } from "@/i18n/routing";
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Form,
  Link,
  ListBoxItem,
  Select,
  Label,
  Popover,
  FieldError,
  SelectValue,
} from 'react-aria-components';

// GraphQL queries and mutations
// Apollo Client
import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react';
import {
  LanguagesDocument,
  MeDocument,
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
  LayoutContainer,
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
import { refreshAuthTokens } from "@/utils/authHelper";
import { routePath } from '@/utils/routes';
import { isValidEmail } from '@/utils/validation';
import { handleApolloError } from '@/utils/apolloErrorHandler';
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

interface UserData {
  email?: string | null;
  givenName?: string | null;
  surName?: string | null;
  affiliation: {
    id: number;
    displayName: string;
    uri: string;
  }
  languageId: string;
}

function OrgUserProfilePage(): React.ReactElement {
  const initialColumns = useMemo<DmpTableColumnSet>(() => [
    { id: 'id', name: 'id', isRowHeader: false },
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
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const userId = String(params.userId); // From route /users/:userId
  const projectId = String(params.projectId); // From route /users/:userId/manage/:projectId
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

  // Localization
  const t = useTranslations('Admin.userProfile');
  const Global = useTranslations('Global');

  // Set URLs
  const ADMIN_USERS_URL = routePath('admin.users');

  // Run queries
  const { data: languageData } = useQuery(LanguagesDocument,);
  const { data: userData } = useQuery(UserDocument, {
    variables: { userId: Number(userId) },
  });

  // Initialize user profile mutation
  const [updateUserInfoMutation, { loading: updateUserInfoLoading }] = useMutation(UpdateUserInfoDocument);

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
    projectId: Number(projectId)
  });

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

  // Clear any errors for the current active field
  const clearActiveFieldError = (name: string) => {
    // Clear error for active field
    setErrorMessages((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  // Update form data
  const handleUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    clearActiveFieldError(name);
    setUserProfileFormData({ ...userProfileFormData, [name]: value });
  };

  // Handle any changes to form field values
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUpdate(e);
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
    console.log("****Validating field***", name, value, error);

    setFieldErrors(prevErrors => ({
      ...prevErrors,
      [name]: error
    }));
    return error;
  }

  // Check whether form is valid before submitting
  const isFormValid = (): boolean => {
    console.log("***Validating form data***", userProfileFormData);
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
    clearActiveFieldError("affiliationId");
    return setUserProfileFormData({
      ...userProfileFormData,
      affiliationName: value,
      affiliationId: id,
    });
  };

  const profileUpdateMutation = async () => {
    console.log("***Updating user profile***", userProfileFormData);
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

    console.log("Profile update response:", response);

    return response.data;
  };

  // Update Profile info
  const updateProfile = async () => {
    try {
      const response = await profileUpdateMutation();
      if (response) {
        // Refresh token to include preferred language in token
        await refreshAuthTokens();
        // Update pathname to match the selected language so user can see page in selected language
        await switchLanguage(userProfileFormData.languageId, true);
      }
    } catch (error) {
      console.log("***Error updating profile***", error);
      // Handle errors
      setErrorMessages((prevErrors) => ({
        ...prevErrors,
        general: t("messages.errors.errorUpdatingProfile"),
      }));
      logECS("error", "Error updating profile", {
        errors: error,
        url: { path: routePath("account.profile") },
      });
    }
  };

  // Handle user profile form submit
  const handleUserProfileFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Clear previous error messages
    clearAllFieldErrors();
    setErrorMessages([]);

    if (isFormValid()) {
      console.log("***Form is valid, submitting***");
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
      setErrorMessages(['An error occurred while searching. Please try again.']);
    }
  };

  // Handle pagination page click
  const handlePageClick = async (page: number) => {
    await fetchPlans({
      page: currentPage, searchTerm: searchTerm
    });
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
        setErrorMessages(['An error occurred while sorting. Please try again.']);
      }
    }
  };

  const clearAllFieldErrors = () => {
    setFieldErrors({
      email: "",
      givenName: "",
      surName: "",
      affiliationName: "",
      affiliationId: "",
      otherAffiliationName: "",
      languageId: "",
    });
  }


  interface PlanRow {
    id: string | null | undefined;
    title: string | null | undefined;
    template: string | null | undefined;
    organization: string | null | undefined;
    owner: string | null | undefined;
    updated: string;
    visibility: string | null | undefined;
  }

  const transformPlans = (data: typeof planData): PlanRow[] => {
    console.log("***Plans data***", data);
    return data?.plans?.items
      ?.filter((plan): plan is NonNullable<typeof plan> => plan !== null)
      .map((plan) => {
        return {
          id: plan.id?.toString(),
          title: plan.title ?? '',
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
          general: "Something went wrong. Please try again.",
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
  return (
    <>
      <PageHeader
        title={t('title', { name: 'User Name' })}
        description=""
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('admin.index')}>Admin</Link></Breadcrumb>
            <Breadcrumb>{t('title', { name: 'User Name' })}</Breadcrumb>
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
      <ErrorMessages errors={errorMessages} ref={errorRef} />
      <LayoutContainer>
        <ContentContainer>
          <h2>Testing</h2>
          {/* Edit organization details section */}
          <div className={styles.userProfileFormContainer}>
            <div className={styles.sectionHeader}>
              <h2>{t('userProfileHeading', { name: 'User Name' })}</h2>
            </div>
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
                    value={userProfileFormData.givenName || ''}
                    onChange={handleInputChange}
                    isInvalid={!!fieldErrors.givenName}
                    errorMessage={fieldErrors.givenName ?? ""}
                  />

                  <FormInput
                    name="surName"
                    type="text"
                    label={t("profileForm.labels.surName")}
                    isRequired={true}
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
                    isRequired={true}
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
                    isRequired
                    name="language"
                    items={languages}
                    errorMessage="A selection is required"
                    helpMessage={t("messages.helpText.language")}
                    onChange={(selected) => setUserProfileFormData({ ...userProfileFormData, languageId: selected as string })}
                    selectedKey={userProfileFormData.languageId}
                  >
                    {languages &&
                      languages.map((language) => {
                        return <ListBoxItem key={language.id}>{language.id}</ListBoxItem>;
                      })}
                  </FormSelect>
                  <Button
                    type="submit"
                    isDisabled={updateUserInfoLoading}
                    className={styles.btn}
                  >
                    {updateUserInfoLoading ? Global("buttons.saving") : Global("buttons.save")}
                  </Button>
                </Form>
              </div>
            </div>

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

            {!plansLoading && plans && plans.length === 0 && (
              <p>{t('userPlansTable.noResults')}</p>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              hasPreviousPage={hasPreviousPage}
              hasNextPage={hasNextPage}
              handlePageClick={handlePageClick}
            />
          </div>
        </ContentContainer>
      </LayoutContainer >
    </>
  );
}

export default OrgUserProfilePage;