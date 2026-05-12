"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, Radio } from "react-aria-components";
import Link from "next/link";
import { useTranslations } from "next-intl";

// GraphQL
import { useQuery, useMutation } from '@apollo/client/react';
import {
  AffiliationByIdDocument,
  MeDocument,
  UpdateAffiliationDocument
} from '@/generated/graphql';

// Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutWithPanel, SidebarPanel } from "@/components/Container";
import { FormInput, FormTextArea } from "@/components/Form";
import RadioGroupComponent from "@/components/Form/RadioGroup";
import ErrorMessages from '@/components/ErrorMessages';
import Loading from "@/components/Loading";

// Utils and other
import { routePath } from "@/utils/routes";
import { checkErrors, extractErrors } from '@/utils/errorHandler';
import logECS from '@/utils/clientLogger';
import { isEmailListValid } from '@/utils/validation';
import { useToast } from '@/context/ToastContext';
import styles from "./feedbackOptions.module.scss";

const FeedbackOptions: React.FC = () => {
  // error reference for error messages
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Toast context
  const toastState = useToast();

  // Localization
  const t = useTranslations("FeedbackOptions");
  const Global = useTranslations("Global");
  const Admin = useTranslations("Admin");

  // State management
  const [feedbackForm, setFeedbackForm] = useState({
    feedbackEnabled: "on",
    feedbackEmails: "",
    feedbackMessage: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // GraphQL queries and mutations
  // Need to get user's affiliation id
  const { data: meData,
    loading: meLoading,
    error: meError
  } = useQuery(MeDocument);

  // Retrieve feedback data for user's affiliation
  const {
    data: affiliationData,
    loading: affiliationLoading,
    error: affiliationError,
    refetch: refetchFeedbackStatus
  } = useQuery(AffiliationByIdDocument, {
    variables: { affiliationId: Number(meData?.me?.affiliation?.id) },
    skip: !meData?.me?.affiliation?.id,
  });

  // Initialize mutation
  const [UpdateAffiliationMutation] = useMutation(UpdateAffiliationDocument);


  const radioButtonData = [
    {
      value: "on",
      label: t("fields.feedbackEnabled.options.on"),
    },
    {
      value: "off",
      label: t("fields.feedbackEnabled.options.off"),
    },
  ];

  const handleChange = (field: keyof typeof feedbackForm, value: string) => {
    setFeedbackForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessages([]);
    setIsSubmitting(true);


    try {
      const emails = feedbackForm.feedbackEmails
        .split(",")
        .map(email => email.trim())
        .filter(email => email !== "");

      const response = await UpdateAffiliationMutation({
        variables: {
          input: {
            id: Number(affiliationData?.affiliationById?.id),
            name: affiliationData?.affiliationById?.name ?? "",
            feedbackEnabled: feedbackForm.feedbackEnabled === "on",
            feedbackMessage: feedbackForm.feedbackMessage,
            feedbackEmails: emails,

          },
        }
      });

      const [hasErrors, errs] = checkErrors(
        response.data?.updateAffiliation?.errors as Record<string, string | null | undefined>,
        ['general', 'feedbackEmails', 'feedbackMessage']
      );

      if (hasErrors) {
        const errorList = extractErrors(errs, ['general', 'feedbackEmails', 'feedbackMessage']);
        setErrorMessages(errorList.length > 0 ? errorList : [Global('messaging.somethingWentWrong')]);
        logECS('error', 'requestFeedback', {
          error: errs,
          url: { path: routePath('admin.feedbackOptions') }
        });
        return;
      }

      // Success so try and refetch feedback status to update UI
      try {
        await refetchFeedbackStatus();
        toastState.add(t('messages.success.feedbackOptionsUpdated'), { type: 'success' });
      } catch (error) {
        setErrorMessages([Global('messaging.somethingWentWrong')]);
        logECS('error', 'requestFeedback', {
          error,
          url: { path: routePath('admin.feedbackOptions') }
        });
      }
    } catch (error) {
      setErrorMessages([Global('messaging.somethingWentWrong')]);
      logECS('error', 'requestFeedback', {
        error,
        url: { path: routePath('admin.feedbackOptions') }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (affiliationData?.affiliationById) {
      const aff = affiliationData.affiliationById;
      setFeedbackForm({
        feedbackEnabled: aff.feedbackEnabled ? "on" : "off",
        feedbackEmails: aff.feedbackEmails ? aff.feedbackEmails.join(", ") : "",
        feedbackMessage: aff.feedbackMessage ?? ""
      });
    }
  }, [affiliationData]);

  useEffect(() => {
    if (meError) {
      setErrorMessages(prev => [...prev, meError.message]);
    }
  }, [meError]);

  useEffect(() => {
    if (affiliationError) {
      setErrorMessages(prev => [...prev, affiliationError.message]);
    }
  }, [affiliationError]);

  if (meLoading || affiliationLoading) {
    return <Loading message={Global('messaging.loading')} />;
  }


  return (
    <>
      <PageHeader
        title={t("title")}
        showBackButton={true}
        className="page-feedback-options-header"
      />

      <LayoutWithPanel className={"page-feedback-options"}>
        <ContentContainer>
          <ErrorMessages errors={errorMessages} ref={errorRef} />

          <form onSubmit={handleSubmit}>
            {/* Introduction text */}
            <div className={styles.sectionContainer}>
              <div className={styles.sectionContent}>
                <p>{t("description")}</p>

                <RadioGroupComponent
                  name="feedbackEnabled"
                  radioGroupLabel={t("fields.feedbackEnabled.label")}
                  value={feedbackForm.feedbackEnabled}
                  onChange={(value) => handleChange("feedbackEnabled", value)}
                >
                  {radioButtonData.map((radioButton, index) => (
                    <div key={index}>
                      <Radio value={radioButton.value}>{radioButton.label}</Radio>
                    </div>
                  ))}
                </RadioGroupComponent>

                {/* Screen reader announcement for state changes */}
                <div
                  aria-live="polite"
                  aria-atomic="true"
                  className={"hidden-accessibly"}
                >
                  {feedbackForm.feedbackEnabled === "on" ? t("screenReader.feedbackEnabled") : t("screenReader.feedbackDisabled")}
                </div>

                {/* Feedback email address section - only show when enabled */}
                <div
                  id="feedback-email-section"
                  role="region"
                  aria-label={t("fields.feedbackEmail.label")}
                  aria-live="polite"
                  className={`${styles.conditionalRegion} ${feedbackForm.feedbackEnabled !== "on" ? styles.hidden : styles.visible}`}
                >
                  {feedbackForm.feedbackEnabled === "on" && (
                    <FormInput
                      name="feedbackEmail"
                      label={t("fields.feedbackEmail.label")}
                      description={t("fields.feedbackEmail.description")}
                      placeholder={t("fields.feedbackEmail.placeholder")}
                      value={feedbackForm.feedbackEmails}
                      onChange={(e) => handleChange("feedbackEmails", e.target.value)}
                      isRequired={true}
                      helpMessage={t("fields.feedbackEmail.helpText")}
                      isInvalid={!isEmailListValid(feedbackForm.feedbackEmails)}
                      errorMessage={t("fields.feedbackEmail.invalidEmail")}
                    />
                  )}
                </div>

                {/* Request Expert Feedback section - only show when enabled */}
                <div
                  id="expert-feedback-section"
                  role="region"
                  aria-label={t("fields.feedbackText.label")}
                  aria-live="polite"
                  className={`${styles.conditionalRegion} ${feedbackForm.feedbackEnabled !== "on" ? styles.hidden : styles.visible}`}
                >
                  {feedbackForm.feedbackEnabled === "on" && (
                    <FormTextArea
                      name="feedbackText"
                      label={t("fields.feedbackText.label")}
                      description={t("fields.feedbackText.description")}
                      helpMessage={t.rich('fields.feedbackText.helpText', {
                        mailtoLink: (chunks) => (
                          <a href="mailto:dmptool@ucop.edu">{chunks}</a>
                        ),
                      })}
                      richText={true}
                      value={feedbackForm.feedbackMessage}
                      onChange={(value) => handleChange("feedbackMessage", value)}
                      isRequired={true}
                    />
                  )}
                </div>

                {/* Save button */}
                <div className={styles.saveButton}>
                  <Button
                    type="submit"
                    isDisabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className={styles.loadingSpinner} aria-hidden="true"></span>
                        <span className="sr-only">{Global('messaging.submittingSROnly')}</span>
                        {Global('messaging.saving')}
                      </>
                    ) : (
                      t('actions.save')
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </ContentContainer>

        <SidebarPanel>
          <div>
            <h2 className={styles.relatedItemsHeading}>{Admin("headingRelatedActions")}</h2>
            <ul className={styles.relatedItems}>
              <li>
                <Link href={routePath("admin.organizationDetails")}>
                  {Admin("sections.organizationSettings.items.editOrganizationDetails.title")}
                </Link>
              </li>
              <li>
                <Link href={routePath("admin.users")}>
                  {Admin("sections.organizationSettings.items.manageUserAccounts.title")}
                </Link>
              </li>
              <li>
                <Link href={routePath("admin.emailPreferences")}>
                  {Admin("sections.organizationSettings.items.customizeEmailText.title")}
                </Link>
              </li>
              <li>
                <Link href={routePath("admin.feedbackOptions")}>
                  {Admin("sections.organizationSettings.items.requestFeedbackOptions.title")}
                </Link>
              </li>
            </ul>
          </div>
        </SidebarPanel>
      </LayoutWithPanel>
    </>
  );
};

export default FeedbackOptions;
