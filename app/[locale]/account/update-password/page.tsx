"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Breadcrumb, Breadcrumbs, Button, Form } from "react-aria-components";
import { useMutation, useQuery } from "@apollo/client/react";

import { MeDocument, UpdatePasswordDocument } from "@/generated/graphql";

import PageHeader from "@/components/PageHeader";
import { FormInput } from "@/components/Form";
import { ContentContainer, LayoutWithPanel, SidebarPanel } from "@/components/Container";
import ErrorMessages from "@/components/ErrorMessages";
import PasswordRequirementsList from "@/components/PasswordRequirementsList";
import Loading from "@/components/Loading";

import styles from "./updatePassword.module.scss";
import { routePath } from "@/utils/routes";
import { getPasswordRequirements } from "@/utils/validation";
import { handleApolloError, isAbortError } from "@/utils/apolloErrorHandler";
import logECS from "@/utils/clientLogger";
import { useToast } from "@/context/ToastContext";

type PasswordFields = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const EMPTY_FIELDS: PasswordFields = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const NEW_PASSWORD_ERROR_KEYS: Record<string, string> = {
  minLength: "messages.errors.passwordTooShort",
  hasUppercase: "messages.errors.passwordMissingUppercase",
  hasLowercase: "messages.errors.passwordMissingLowercase",
  hasNumber: "messages.errors.passwordMissingNumber",
  hasSpecialChar: "messages.errors.passwordMissingSpecialChar",
};

const getNewPasswordError = (password: string, t: (key: string) => string): string => {
  if (!password) {
    return t("messages.errors.newPasswordRequired");
  }

  const unmet = getPasswordRequirements(password).find((requirement) => !requirement.isMet);
  if (!unmet) {
    return "";
  }

  return t(NEW_PASSWORD_ERROR_KEYS[unmet.key] ?? "messages.errors.passwordTooShort");
};

const getFieldErrors = (formData: PasswordFields, t: (key: string) => string): PasswordFields => {
  const fieldErrors = { ...EMPTY_FIELDS };

  if (!formData.currentPassword) {
    fieldErrors.currentPassword = t("messages.errors.currentPasswordRequired");
  }

  fieldErrors.newPassword = getNewPasswordError(formData.newPassword, t);

  if (!formData.confirmPassword) {
    fieldErrors.confirmPassword = t("messages.errors.confirmPasswordRequired");
  } else if (formData.newPassword !== formData.confirmPassword) {
    fieldErrors.confirmPassword = t("messages.errors.passwordsDoNotMatch");
  }

  return fieldErrors;
};

const UpdatePasswordPage: React.FC = () => {
  const t = useTranslations("UpdatePassword");
  const globalT = useTranslations("Global");
  const toast = useToast();
  const errorRef = useRef<HTMLDivElement>(null);

  const { data, loading: queryLoading, error: queryError } = useQuery(MeDocument);
  const [updatePasswordMutation] = useMutation(UpdatePasswordDocument);

  const [formData, setFormData] = useState<PasswordFields>(EMPTY_FIELDS);
  const [fieldErrors, setFieldErrors] = useState<PasswordFields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = data?.me?.email?.trim() ?? "";
  const accountLoadFailed = Boolean(queryError) && !isAbortError(queryError);
  const blockingError = email
    ? ""
    : accountLoadFailed
      ? t("messages.errors.errorLoadingAccount")
      : t("messages.errors.emailRequiredToUpdatePassword");

  useEffect(() => {
    if (!queryError || isAbortError(queryError)) {
      return;
    }

    handleApolloError(queryError, "updatePassword.me");
  }, [queryError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name as keyof PasswordFields]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors([]);

    const nextFieldErrors = getFieldErrors(formData, t);
    setFieldErrors(nextFieldErrors);
    if (Object.values(nextFieldErrors).some(Boolean)) {
      setErrors([globalT("messaging.fixBelow")]);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await updatePasswordMutation({
        variables: {
          email,
          oldPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
      });

      const serverErrors = response.data?.updatePassword?.errors;
      if (serverErrors?.password || serverErrors?.general) {
        setFieldErrors({
          ...EMPTY_FIELDS,
          currentPassword: serverErrors.general ? t("messages.errors.incorrectCurrentPassword") : "",
          newPassword: serverErrors.password || "",
        });
        setErrors([t("messages.errors.errorUpdatingPassword")]);
        return;
      }

      setFormData(EMPTY_FIELDS);
      setFieldErrors(EMPTY_FIELDS);
      toast.add(t("messages.passwordUpdateSuccess"), { type: "success", timeout: 3000 });
    } catch (error) {
      const { wasRealError, message } = handleApolloError(error, "updatePassword");
      if (!wasRealError) {
        return;
      }

      logECS("error", "updatePassword", {
        error,
        url: { path: routePath("account.password") },
      });
      setErrors([message || t("messages.errors.errorUpdatingPassword")]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (queryLoading || (queryError && isAbortError(queryError) && !email)) {
    return <Loading variant="page" message={globalT("messaging.loading")} />;
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb>
              <Link href="/">{t("breadcrumbHome")}</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href={routePath("account.profile")}>{t("breadcrumbProfile")}</Link>
            </Breadcrumb>
            <Breadcrumb>{t("title")}</Breadcrumb>
          </Breadcrumbs>
        }
        className="page-template-list"
      />

      <LayoutWithPanel className="page-update-password">
        <ContentContainer>
          {blockingError ? (
            <div className={styles.sectionContainer}>
              <div className={styles.sectionContent}>
                <ErrorMessages
                  errors={[blockingError]}
                  ref={errorRef}
                />
              </div>
            </div>
          ) : (
            <Form
              onSubmit={handleSubmit}
              validationBehavior="aria"
            >
              <div className={styles.sectionContainer}>
                <div className={styles.sectionContent}>
                  <ErrorMessages
                    errors={errors}
                    ref={errorRef}
                  />

                  <FormInput
                    name="currentPassword"
                    type="password"
                    label={t("currentPassword")}
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    isRequired
                    isInvalid={!!fieldErrors.currentPassword}
                    errorMessage={fieldErrors.currentPassword}
                    passwordToggleLabel={t("currentPassword")}
                    data-testid="current-password"
                  />
                  <div className={styles.subSection}>
                    <PasswordRequirementsList password={formData.newPassword} />
                  </div>
                  <FormInput
                    name="newPassword"
                    type="password"
                    label={t("newPassword")}
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    isRequired
                    isInvalid={!!fieldErrors.newPassword}
                    errorMessage={fieldErrors.newPassword}
                    passwordToggleLabel={t("newPassword")}
                    ariaDescribedBy="password-requirements"
                    data-testid="new-password"
                  />
                  <FormInput
                    name="confirmPassword"
                    type="password"
                    label={t("confirmPassword")}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    isRequired
                    isInvalid={!!fieldErrors.confirmPassword}
                    errorMessage={fieldErrors.confirmPassword}
                    passwordToggleLabel={t("confirmPassword")}
                    data-testid="confirm-password"
                  />

                  <div className={styles.formActions}>
                    <Button
                      type="submit"
                      isDisabled={isSubmitting}
                      data-primary={true}
                      data-testid="change-password"
                    >
                      {isSubmitting ? t("btnChangingPassword") : t("btnChangePassword")}
                    </Button>
                  </div>
                </div>
              </div>
            </Form>
          )}
        </ContentContainer>

        <SidebarPanel>
          <div>
            <h2 className={styles.relatedItemsHeading}>{t("headingRelatedActions")}</h2>
            <ul className={styles.relatedItems}>
              <li>
                <Link href={routePath("account.connections")}>{t("linkUpdateConnections")}</Link>
              </li>
              <li>
                <Link href={routePath("account.notifications")}>{t("linkManageNotifications")}</Link>
              </li>
            </ul>
          </div>
        </SidebarPanel>
      </LayoutWithPanel>
    </>
  );
};

export default UpdatePasswordPage;
