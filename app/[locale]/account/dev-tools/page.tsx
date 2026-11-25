"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/context/ToastContext";
import { useCsrf } from "@/context/CsrfContext";
import PageHeader from "@/components/PageHeader";
import { Breadcrumb, Breadcrumbs, Button, Form } from "react-aria-components";
import { Link } from "@/i18n/routing";
import { routePath } from "@/utils/routes";
import styles from "@/app/[locale]/account/dev-tools/devTools.module.scss";
import ErrorMessages from "@/components/ErrorMessages";
import { ContentContainer, LayoutWithPanel } from "@/components/Container";
import { useQuery } from "@apollo/client/react";
import { MeDocument } from "@/generated/graphql";
import Loading from "@/components/Loading";
import FormInput from "../../../../components/Form/FormInput";
import { SanitizeHTML } from "@/utils";
import { isValidEmail} from "@/utils/validation";

interface DeveloperToolsFields {
  clientId?: string;
  clientSecret?: string;
  contactName?: string;
  contactEmail?: string;
}

const EMPTY_FIELDS: DeveloperToolsFields = {
  clientId: "",
  clientSecret: "",
  contactName: "",
  contactEmail: "",
};

const DeveloperToolsPage: React.FC = () => {
  const t = useTranslations("DeveloperTools");
  const globalT = useTranslations("Global");
  const toast = useToast();
  const { getCsrfToken } = useCsrf();
  const errorRef = useRef<HTMLDivElement>(null);

  const { data, loading: queryLoading, error: queryError, refetch } = useQuery(MeDocument);
  const [formData, setFormData] = useState<DeveloperToolsFields>({
    ...EMPTY_FIELDS,
    // Pre-fill contact name and email from the logged-in user
    contactName: [data?.me?.givenName, data?.me?.surName].filter(Boolean).join(" ") || "",
    contactEmail: data?.me?.email || "",
  });
  const [errors, setErrors] = useState<Record<string, string | null | undefined>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isValid: boolean = !!formData.contactEmail && !errors.contactEmail;

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

  // Update form data
  const handleUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    clearActiveFieldError(name);
    setFormData({ ...formData, [name]: value });
  };

  // Handle any changes to form field values
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUpdate(e);
  };

  // Client-side validation of fields
  const validateField = (name: string, value?: string) => {
    let error = "";
    switch (name) {
      case "contactName":
        if (!value || value.length <= 2) {
          error = t("messages.errors.contactNameValidation");
        }
        break;
      case "contactEmail":
        if (!value || isValidEmail(value) === false) {
          error = t("messages.errors.contactEmailValidation");
        }
        break;
      case "clientId":
        if (!value || value.length <= 8) {
          error = t("messages.errors.clientIdValidation");
        }
        break;
      case "clientSecret":
        if (!value || value.length <= 8) {
          error = t("messages.errors.clientSecretValidation");
        }
        break;
    }

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
    return error;
  };

  // Check whether form is valid before submitting
  const isFormValid = (): boolean => {
    // Initialize a flag for form validity
    let isValid = true;
    clearErrors();

    // Iterate over formData to validate each field
    Object.keys(formData).forEach((key) => {
      const name = key as keyof DeveloperToolsFields;
      const value = formData[name];

      // Call validateField to update errors for each field
      const error = validateField(name, value);
      if (error) {
        isValid = false;
      }
    });

    return isValid;
  };

  // Handle the generation of new credentials (clientId and clientSecret)
  function handleCredentialGeneration() {
    if (data && data.me) {
      // Clear any existing errors
      clearErrors();
      setIsSubmitting(true);

      const hasCreds = !!formData.clientId && !!formData.clientSecret;
      const successMsg = hasCreds ? t("credentialsRegenerated") : t("credentialsGenerated");
      const errorMsg = hasCreds ? t("errorRegeneratingCredentials") : t("errorGeneratingCredentials");

      // TODO: Replace with call to the Auth service to generate new clientId and clientSecret
      try {
        const newClientId = `client-${Math.random().toString(36).substring(2, 10)}`;
        const newClientSecret = `secret-${Math.random().toString(36).substring(2, 10)}`;

        setFormData((prevData) => ({
          ...prevData,
          clientId: hasCreds ? prevData.clientId : newClientId,
          clientSecret: newClientSecret,
        }));

        toast.add(successMsg, { type: "success" });
      } catch (error) {
        toast.add(errorMsg, { type: "error" });
      }
      setIsSubmitting(false);
    }
  }

  // Handle form submission
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (data && data.me) {
      event.preventDefault();
      setIsSubmitting(true);
      clearErrors();

      try {
        if (!isFormValid()) {
          setIsSubmitting(false);
          return;
        }

        // TODO: Implement API call to save the developer tools form data (contact name, contact email, etc.)
      } catch (error) {
        // TODO: Handle errors from the API call and set them in the errors state
      }

      setIsSubmitting(false);
    }
  }

  // Check if the user has admin privileges and set the isAdmin state accordingly
  useEffect(() => {
    if (["ADMIN", "SUPERADMIN"].includes(data?.me?.role || "")) {
      setIsAdmin(true);
    }
  }, [data]);

  // Handle errors from loading of user data
  useEffect(() => {
    if (queryError) {
      refetch();
    }
  }, [queryError, refetch]);

  // Generate a link to the API documentation
  function getAPIDocsLink(label: string = "API documentation") {
    const url: string = process.env.NEXT_PUBLIC_API_DOCS_URL || "http://localhost:4060/api/v3/documentation";
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  }

  // Show loading message on first page load when getting user
  const loading = queryLoading;
  if (loading) {
    return (
      <Loading
        variant="page"
        message={globalT("messaging.loading")}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        description={`${t("description")} ${isAdmin ? t("helpTextAdmin") : t("helpTextResearcher")}`}
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
          <div>
            <SanitizeHTML
              html={t("instructions", { link: getAPIDocsLink(t("instructionsLink")) })}
              options={{ allowedTags: ["a"], allowedAttributes: { a: ["href", "target", "rel"] } }}
            />
          </div>
          <div>{t("securityWarning")}</div>

          <div className={styles.sectionContainer}>
            <div className={styles.sectionContent}>
              <ErrorMessages
                errors={errors}
                ref={errorRef}
              />

              <Form
                onSubmit={handleSubmit}
                validationBehavior="aria"
              >
                <div className={`${styles.formRow} ${styles.twoItemRow}`}>
                  <FormInput
                    name="contactName"
                    type="text"
                    label={t("contactName")}
                    placeholder={formData.contactName}
                    value={formData.contactName}
                    onChange={handleInputChange}
                    isInvalid={!!errors["contactName"]}
                    errorMessage={errors["contactName"] ?? ""}
                    helpMessage={t("contactNameHelp")}
                  />

                  <FormInput
                    name="contactEmail"
                    type="email"
                    label={t("contactEmail")}
                    placeholder={formData.contactEmail}
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    isInvalid={!!errors["contactEmail"]}
                    errorMessage={errors["contactEmail"] ?? ""}
                    required={true}
                    helpMessage={t("contactEmailHelp")}
                  />
                </div>
                <div className={styles.btnContainer}>
                  <Button
                    type="submit"
                    isDisabled={!isValid}
                    className={styles.btn}
                  >
                    {isUpdating ? t("btnUpdating") : t("btnUpdate")}
                  </Button>
                </div>

                <div className={`${styles.formRow} ${styles.twoItemRow}`}>
                  <FormInput
                    name="clientId"
                    type="text"
                    label={t("clientId")}
                    value={formData.clientId}
                    isInvalid={!!errors["clientId"]}
                    helpMessage={t("clientIdHelp")}
                    disabled={true}
                  />

                  <FormInput
                    name="clientSecret"
                    type="password"
                    label={t("clientSecret")}
                    value={formData.clientSecret}
                    isInvalid={!!errors["clientSecret"]}
                    helpMessage={t("clientSecretHelp")}
                    disabled={true}
                  />
                </div>
                <div className={styles.btnContainer}>
                  <Button
                    className="secondary"
                    onPress={() => handleCredentialGeneration()}
                    isDisabled={isSubmitting}
                  >
                    {isSubmitting ? t("btnSubmitting") : formData.clientId ? t("btnRegenerate") : t("btnGenerate")}
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </ContentContainer>
      </LayoutWithPanel>
    </>
  );
};;;

export default DeveloperToolsPage;
