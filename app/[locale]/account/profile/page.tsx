"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/routing";
import { Breadcrumb, Breadcrumbs, Button, Form, ListBoxItem, Text } from "react-aria-components";

// GraphQL queries and mutations
import {
  LanguagesDocument,
  MeDocument,
  UserErrors,
  UpdateUserProfileDocument
} from "@/generated/graphql";

// Components
import PageHeader from "@/components/PageHeader";
import UpdateEmailAddress from "@/components/UpdateEmailAddress";
import { TypeAheadWithOther, useAffiliationSearch } from "@/components/Form/TypeAheadWithOther";
import { FormSelect } from "@/components/Form/FormSelect";
import FormInput from "@/components/Form/FormInput";
import { ContentContainer, LayoutWithPanel, SidebarPanel } from "@/components/Container";
import ErrorMessages from "@/components/ErrorMessages";
import Loading from "@/components/Loading";

// Interfaces
import { EmailInterface, LanguageInterface, ProfileDataInterface } from "@/app/types";

// Utils and other
import logECS from "@/utils/clientLogger";
import { refreshAuthTokens } from "@/utils/authHelper";
import { useToast } from "@/context/ToastContext";
import styles from "./profile.module.scss";
import { routePath } from "@/utils/routes";

// Apollo Client
import { useQuery, useMutation } from '@apollo/client/react';


const ProfilePage: React.FC = () => {
  const t = useTranslations("UserProfile");
  const Global = useTranslations("Global");
  const toastState = useToast(); // Access the toast state from context
  const pathname = usePathname();
  const currentLocale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);
  //To control display of showSuccess toast message
  const hasShownToastRef = useRef(false);

  const [otherField, setOtherField] = useState(false);
  // We need to save the original data for when users cancel their form updates
  const [originalData, setOriginalData] = useState<ProfileDataInterface>();
  const [formData, setFormData] = useState<ProfileDataInterface>({
    givenName: "",
    surName: "",
    affiliationName: "",
    affiliationId: "",
    otherAffiliationName: "",
    languageId: "",
    languageName: "",
  });
  const { suggestions, handleSearch, isSearching, searchError } = useAffiliationSearch();
  const [isEditing, setIsEditing] = useState(false);
  // Errors returned from request
  const [errors, setErrors] = useState<UserErrors>({});
  const [emailAddresses, setEmailAddresses] = useState<EmailInterface[]>([]);
  const [languages, setLanguages] = useState<LanguageInterface[]>([]);

  const switchLanguage = async (newLocale: string, showToast = false): Promise<boolean> => {
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
      return true;
    }
    return false;
  };

  // Initialize user profile mutation
  const [updateUserProfileMutation, { loading: updateUserProfileLoading }] = useMutation(UpdateUserProfileDocument);

  // Run queries
  const { data: languageData } = useQuery(LanguagesDocument,);
  const { data, loading: queryLoading, error: queryError, refetch } = useQuery(MeDocument,);

  // Client-side validation of fields
  const validateField = (name: string, value: string) => {
    let error = "";
    switch (name) {
      case "givenName":
        if (!value || value.length <= 2) {
          error = t("messages.errors.givenNameValidation");
        }
        break;
      case "surName":
        if (!value || value.length <= 2) {
          error = t("messages.errors.surNameValidation");
        }
        break;
      case "affiliationId":
        if (formData["affiliationName"] !== "Other" && (!value || value.length <= 2)) {
          error = t("messages.errors.affiliationValidation");
        }
        break;
      case "otherAffiliationName":
        // We only want to validate this field if the user specifically selected this 'Other' option
        if (formData["affiliationName"] === "Other") {
          if (!value || value.length <= 2) {
            error = t("messages.errors.otherAffiliationValidation");
          }
          break;
        }
    }

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
    return error;
  };

  const profileUpdateMutation = async () => {
    const response = await updateUserProfileMutation({
      variables: {
        input: {
          givenName: formData.givenName,
          surName: formData.surName,
          affiliationId: formData.affiliationId,
          otherAffiliationName: formData.otherAffiliationName,
          languageId: formData.languageId,
        },
      },
    });

    return response.data;
  };

  // Show Success Message
  const showSuccessToast = () => {
    const successMessage = t("messages.profileUpdateSuccess");
    toastState.add(successMessage, { type: "success", timeout: 3000 });
  };

  // Update Profile info
  const updateProfile = async () => {
    try {
      const response = await profileUpdateMutation();
      if (response) {
        const selectedLanguage = languages.find((lang) => lang.id === formData.languageId);
        const savedData = {
          ...formData,
          languageName: selectedLanguage?.name ?? formData.languageName,
        };
        setOriginalData(savedData);
        setFormData(savedData);
        setOtherField(savedData.affiliationName === "Other");
        setIsEditing(false);
        // Refresh token to include preferred language in token
        await refreshAuthTokens();
        // Update pathname to match the selected language so user can see page in selected language
        const languageChanged = await switchLanguage(formData.languageId, true);
        if (!languageChanged) {
          showSuccessToast();
        }
      }
    } catch (error) {
      // Handle errors
      setErrors((prevErrors) => ({
        ...prevErrors,
        general: t("messages.errors.errorUpdatingProfile"),
      }));
      logECS("error", "Error updating profile", {
        errors: error,
        url: { path: routePath("account.profile") },
      });
      setIsEditing(false);
    }
  };

  // Handle form submit
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    clearErrors();

    if (isFormValid()) {
      // Update profile
      await updateProfile();
    }
  };

  const clearErrors = () => {
    //Remove all field errors
    setErrors({});
  };

  // Clear any errors for the current active field
  const clearActiveFieldError = (name: string) => {
    // Clear error for active field
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  const cancelEdit = () => {
    // Revert back to original data
    if (originalData) {
      setFormData(originalData);
      setOtherField(originalData.affiliationName === "Other");
    }

    //Hide form
    setIsEditing(false);

    //Remove all field errors
    clearErrors();
  };

  // Check whether form is valid before submitting
  const isFormValid = (): boolean => {
    // Initialize a flag for form validity
    let isValid = true;
    clearErrors();

    // Iterate over formData to validate each field
    Object.keys(formData).forEach((key) => {
      const name = key as keyof ProfileDataInterface;
      const value = formData[name];

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
    return setFormData((prev) => ({
      ...prev,
      affiliationName: value,
      affiliationId: id,
    }));
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
        setErrors((prevErrors) => ({
          ...prevErrors,
          general: "Something went wrong. Please try again.",
        }));
      }
    };

    handleLanguageLoad();
  }, [languageData]);

  useEffect(() => {
    const updateFormData = async () => {
      if (data && data.me && languageData) {
        // Get local languages that are not null (for Type guard)
        const loadedLanguages = (languageData.languages || []).filter((language) => language !== null);

        // Find the selected language or fallback
        const selectedLanguage = loadedLanguages.find((lang) => lang.id === data?.me?.languageId) || {
          id: "",
          name: "",
          isDefault: false,
        };

        // Set user email list from data
        if (data.me.emails) {
          const validEmails = data.me.emails
            .filter((email): email is NonNullable<typeof email> => email !== null)
            .map((email) => ({
              id: email.id ?? undefined,
              email: email.email,
              isPrimary: email.isPrimary,
              isConfirmed: email.isConfirmed,
            }));
          setEmailAddresses(validEmails);
        } else {
          setEmailAddresses([]);
        }

        // Update originalData and formData
        const newOriginalData = {
          givenName: data.me.givenName ?? "",
          surName: data.me.surName ?? "",
          affiliationName: data.me.affiliation?.name ?? "",
          affiliationId: data.me.affiliation?.uri ?? "",
          otherAffiliationName: "",
          languageId: data.me.languageId,
          languageName: selectedLanguage.name,
        };

        setOriginalData(newOriginalData);

        // 👇 derive whether "Other" field should be shown
        if (newOriginalData.affiliationName === "Other") {
          setOtherField(true);
        } else {
          setOtherField(false);
        }

        setFormData((prev) => ({
          ...prev,
          ...newOriginalData,
        }));
      }
    };

    updateFormData();
  }, [data, languageData]);

  // Update form data
  const handleUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    clearActiveFieldError(name);
    setFormData({ ...formData, [name]: value });
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Handle any changes to form field values
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUpdate(e);
  };

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

  // Handle errors from loading of user data
  useEffect(() => {
    if (queryError) {
      refetch();
    }
  }, [queryError, refetch]);

  // Show loading message on first page load when getting user
  const loading = queryLoading;
  if (loading) {
    return <Loading variant="page" message={Global("messaging.loading")} />;
  }

  return (
    <>
      <PageHeader
        title={t("headingUpdateProfile")}
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb>
              <Link href="/">{t("breadcrumbHome")}</Link>
            </Breadcrumb>
            <Breadcrumb>{t("headingUpdateProfile")}</Breadcrumb>
          </Breadcrumbs>
        }
        className="page-template-list"
      />
      <div className={styles.main}>
        <div className={styles.mainContent}>
          <LayoutWithPanel>
            <ContentContainer className={styles.layoutContentContainer}>
              <h2>{t("yourProfile")}</h2>
              <div className="sectionContainer">
                <div className={`sectionContent`}>
                  <Form onSubmit={handleProfileSubmit}>
                    <ErrorMessages
                      errors={errors}
                      ref={errorRef}
                    />
                    <div
                      className={`${isEditing ? styles.formEditingRow : styles.formRow} ${`${isEditing ? styles.twoItemRowIsEditing : styles.twoItemRow}`}`}
                    >
                      {isEditing ? (
                        <FormInput
                          name="givenName"
                          type="text"
                          label={t("givenName")}
                          placeholder={formData.givenName}
                          value={formData.givenName}
                          onChange={handleInputChange}
                          isInvalid={!!errors["givenName"]}
                          errorMessage={errors["givenName"] ?? ""}
                        />
                      ) : (
                        <Text
                          slot="givenName"
                          className={styles.readOnlyField}
                        >
                          <div className="field-label">{t("givenName")}</div>
                          <p className={"py-0 my-2"}>{formData.givenName}</p>
                        </Text>
                      )}

                      {isEditing ? (
                        <FormInput
                          name="surName"
                          type="text"
                          label={t("surName")}
                          placeholder={formData.surName}
                          value={formData.surName}
                          onChange={handleInputChange}
                          isInvalid={!!errors["surName"]}
                          errorMessage={errors["surName"] ?? ""}
                        />
                      ) : (
                        <Text
                          slot="surName"
                          className={styles.readOnlyField}
                        >
                          <div className="field-label">{t("surName")}</div>
                          <p className={"py-0 my-2"}>{formData.surName}</p>
                        </Text>
                      )}
                    </div>

                    <div className={`${styles.formRow} ${styles.oneItemRow}`}>
                      {isEditing ? (
                        <>
                          <TypeAheadWithOther
                            label={t("institution")}
                            fieldName="institution"
                            setOtherField={setOtherField}
                            isRequired={true}
                            error={errors['affiliationId'] ?? searchError ?? ''}
                            helpText={t('helpTextSearchForInstitution')}
                            updateFormData={updateAffiliationFormData}
                            value={formData.affiliationName}
                            suggestions={suggestions}
                            onSearch={handleSearch}
                            isLoading={isSearching}
                          />
                          {otherField && (
                            <div className={`${styles.formRow} ${styles.oneItemRow}`}>
                              <FormInput
                                name="otherAffiliationName"
                                type="text"
                                label={t("otherInstitution")}
                                placeholder={formData.otherAffiliationName}
                                value={formData.otherAffiliationName}
                                onChange={handleInputChange}
                                isInvalid={!!errors["otherAffiliationName"]}
                                errorMessage={errors["otherAffiliationName"] ?? ""}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <Text
                          slot="institution"
                          className={styles.readOnlyField}
                        >
                          <div className="field-label">{t("institution")}</div>
                          <p className={"py-0 my-2"}>{formData.affiliationName?.trim() || "Affiliation not set"}</p>
                        </Text>
                      )}
                    </div>

                    <div className={`${styles.formRow} ${styles.oneItemRow}`}>
                      {isEditing ? (
                        <FormSelect
                          label={t("language")}
                          isRequired
                          name="institution"
                          items={languages}
                          errorMessage="A selection is required"
                          helpMessage={t("helpTextSelectYourLanguage")}
                          onChange={(selected) => setFormData({ ...formData, languageId: selected as string })}
                          selectedKey={formData.languageId.trim()}
                        >
                          {languages &&
                            languages.map((language) => {
                              return <ListBoxItem key={language.id}>{language.id}</ListBoxItem>;
                            })}
                        </FormSelect>
                      ) : (
                        <Text
                          slot="language"
                          className={styles.readOnlyField}
                        >
                          <div className="field-label">{t("language")}</div>
                          <p className={"py-0 my-2"}>{formData.languageName}</p>
                        </Text>
                      )}
                    </div>
                    {isEditing ? (
                      <div className={styles.btnContainer}>
                        <Button
                          className="secondary"
                          onPress={() => cancelEdit()}
                        >
                          {t("btnCancel")}
                        </Button>
                        <Button
                          type="submit"
                          isDisabled={updateUserProfileLoading}
                          className={styles.btn}
                        >
                          {updateUserProfileLoading ? t("btnUpdating") : t("btnUpdate")}
                        </Button>
                      </div>
                    ) : (
                      <div className={styles.btnContainer}>
                        <Button
                          onPress={() => handleEdit()}
                          className={styles.btnEdit}
                        >
                          {t("btnEdit")}
                        </Button>
                      </div>
                    )}
                  </Form>
                </div>
              </div>

              <UpdateEmailAddress emailAddresses={emailAddresses} />
            </ContentContainer>
            <SidebarPanel className={styles.layoutSidebarPanel}>
              <h2 className={styles.relatedItemsHeaading}>{t("headingRelatedActions")}</h2>
              <ul className={styles.relatedItems}>
                <li>
                  <Link href={routePath("account.password")}>{t("linkUpdatePassword")}</Link>
                </li>
                <li>
                  <Link href={routePath("account.connections")}>{t("linkUpdateConnections")}</Link>
                </li>
                <li>
                  <Link href={routePath("account.notifications")}>{t("linkManageNotifications")}</Link>
                </li>
              </ul>
            </SidebarPanel>
          </LayoutWithPanel>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
