"use client";

import React, { useRef, useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Breadcrumb, Breadcrumbs, Button, Form } from "react-aria-components";
import PageHeader from "@/components/PageHeader";
import { FormInput } from "@/components/Form";
import { ContentContainer, LayoutWithPanel, SidebarPanel } from "@/components/Container";
import ErrorMessages from "@/components/ErrorMessages";
import PasswordRequirementsList from "@/components/PasswordRequirementsList";

import styles from "./updatePassword.module.scss";
import { routePath } from "@/utils/routes";
import { getPasswordRequirements } from "@/utils/validation";
import logECS from "@/utils/clientLogger";
import { useToast } from "@/context/ToastContext";
import { useCsrf } from "@/context/CsrfContext";

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

// Maps the Auth service's /change-password 400 and 401 messages onto the form fields
const SERVER_FIELD_ERRORS: Record<string, [keyof PasswordFields, string]> = {
  "Invalid current password": ["currentPassword", "messages.errors.incorrectCurrentPassword"],
  "Invalid password format": ["newPassword", "messages.errors.passwordDoesNotMeetRequirements"],
  "Passwords do not match": ["confirmPassword", "messages.errors.passwordsDoNotMatch"],
};

const getResponseMessage = async (response: Response): Promise<string> => {
  try {
    const { message } = await response.json();
    return typeof message === "string" ? message : "";
  } catch {
    return "";
  }
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
  const { getCsrfToken } = useCsrf();
  const errorRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<PasswordFields>(EMPTY_FIELDS);
  const [fieldErrors, setFieldErrors] = useState<PasswordFields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const changePasswordRequest = async (csrfToken: string | null) => {
      return await fetch(`${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/change-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken || "",
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          newPasswordConfirmation: formData.confirmPassword,
        }),
      });
    };

    try {
      let response = await changePasswordRequest(await getCsrfToken());
      // CSRF tokens are single-use, so retry once with a fresh token if this one was rejected
      if (response.status === 403) {
        response = await changePasswordRequest(await getCsrfToken());
      }

      if (!response.ok) {
        const message = await getResponseMessage(response);
        const fieldError = [400, 401].includes(response.status) ? SERVER_FIELD_ERRORS[message] : undefined;
        if (fieldError) {
          const [field, key] = fieldError;
          setFieldErrors({ ...EMPTY_FIELDS, [field]: t(key) });
        } else {
          logECS("error", "updatePassword", {
            status: response.status,
            message,
            url: { path: routePath("account.password") },
          });
        }
        setErrors([t("messages.errors.errorUpdatingPassword")]);
        return;
      }

      setFormData(EMPTY_FIELDS);
      setFieldErrors(EMPTY_FIELDS);
      toast.add(t("messages.passwordUpdateSuccess"), { type: "success", timeout: 3000 });
    } catch (error) {
      logECS("error", "updatePassword", {
        error,
        url: { path: routePath("account.password") },
      });
      setErrors([t("messages.errors.errorUpdatingPassword")]);
    } finally {
      setIsSubmitting(false);
    }
  };

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
