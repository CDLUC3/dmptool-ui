'use client'

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useTranslations } from 'next-intl';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Form,
  Link,
} from 'react-aria-components';

// GraphQL
import {
  MeDocument,
  SubmitContactFormDocument,
} from "@/generated/graphql";


// Components
// Layout
import {
  ContentContainer,
  LayoutWithPanel,
  SidebarPanel
} from '@/components/Container';
import PageHeader from '@/components/PageHeader';
import ErrorMessages from '@/components/ErrorMessages';
import FormInput from '@/components/Form/FormInput';
import Loading from '@/components/Loading';

// Utils and other
import { useToast } from "@/context/ToastContext";
import { useAuthContext } from "@/context/AuthContext";
import {
  logECS,
  routePath
} from "@/utils/index";

interface ContactFormInterface {
  email: string;
  name: string;
  subject: string;
  message: string;
}

const ContactUsPage: React.FC = () => {
  //Hooks
  const toastState = useToast();
  const errorRef = useRef<HTMLDivElement | null>(null);
  const {
    isAuthenticated,
  } = useAuthContext();

  // Localization
  const t = useTranslations('Contact');
  const Global = useTranslations('Global');

  // State
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  // Contact form data state
  const [contactFormData, setContactFormData] = useState<ContactFormInterface>({
    email: "",
    name: "",
    subject: "",
    message: ""
  });

  // Field errors
  const [fieldErrors, setFieldErrors] = useState<ContactFormInterface>({
    email: "",
    name: "",
    subject: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // GraphQL queries and mutations
  const { data: meData } = useQuery(MeDocument, {
    skip: !isAuthenticated
  });

  const [submitContactFormMutation] = useMutation(SubmitContactFormDocument);

  const showSuccessToast = () => {
    const successMessage = t("messages.success.messageSent");
    toastState.add(successMessage, { type: "success" });
  };

  // Clear all error messages
  const clearAllErrorMessages = () => {
    setErrorMessages([]);
    setFieldErrors({
      email: "",
      name: "",
      subject: "",
      message: ""
    });
  };

  // Handle any changes to Contact form field values
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    clearAllErrorMessages();
    setIsSubmitting(false);
    setContactFormData({ ...contactFormData, [name]: value });
  };

  // Client-side validation of required form fields
  const validateField = (name: string, value: string | string[] | undefined) => {
    let error = '';
    switch (name) {
      case "subject":
        if (!value || value.length <= 2) {
          error = t("messages.errors.invalidSubject");
        }
        break;
      case "message":
        if (!value || value.length <= 2) {
          error = t("messages.errors.invalidMessage");
        }
        break;

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
    Object.keys(contactFormData).forEach((key) => {
      const name = key as keyof ContactFormInterface;
      const value = contactFormData[name];

      // Call validateField to update errors for each field
      const error = validateField(name, value);
      if (error) {
        isValid = false;
      }
    });
    return isValid;
  };

  // Submit contact form info
  const sendMessage = async () => {
    try {
      const response = await submitContactFormMutation({
        variables: {
          input: {
            name: contactFormData.name,
            email: contactFormData.email,
            subject: contactFormData.subject,
            message: contactFormData.message,
          },
        },
      });

      if (response.data) {
        const success = response.data.submitContactForm;

        if (!success) {
          setErrorMessages([t("messages.errors.formSubmittalFailed")]);
          logECS("error", "ContactUsPage.sendMessage", {
            errors: "Form submission failed",
            url: { path: routePath("app.contact") },
          });
          return;
        }
        showSuccessToast();
      }
    } catch (error) {
      logECS("error", "ContactUsPage.sendMessage", {
        errors: error,
        url: { path: routePath("app.contact") },
      });
      setErrorMessages([t("messages.errors.formSubmittalFailed")]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handles the form submission for sending message
  const handleContactFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    // Clear previous error messages
    clearAllErrorMessages();
    setErrorMessages([]);

    if (isFormValid()) {
      await sendMessage();
    } else {
      setErrorMessages([t('messages.errors.formSubmittalFailed')])
    }
  };

  // set contact form data with user name and email if user is authenticated
  useEffect(() => {
    if (meData?.me) {
      const emails = meData.me.emails ?? [];
      const primaryEmail =
        emails.find((e) => e?.isPrimary)?.email ??
        emails[0]?.email ??
        '';

      setContactFormData((prev) => ({
        ...prev,
        name: `${meData.me?.givenName ?? ''} ${meData.me?.surName ?? ''}`.trim(),
        email: primaryEmail,
      }));
    }
  }, [meData]);


  // Show Loading until we know if user is authenticated or not
  if (isAuthenticated === null) {
    return <Loading message={Global('buttons.loading')} />;
  }



  return (
    <>
      <PageHeader
        title={t('title')}
        description={""}
        showBackButton={true}
        breadcrumbs={
          < Breadcrumbs >
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb>{t('title')}</Breadcrumb>
          </Breadcrumbs >
        }
      />
      < LayoutWithPanel >
        <ContentContainer>
          <ErrorMessages errors={errorMessages} ref={errorRef} />
          <p>
            {t.rich('contactDescription', {
              link: (chunks) => (
                <Link href="https://cdlib.org/" target="_blank" rel="noopener noreferrer">
                  {chunks}
                  <span className="hidden-accessibly">({Global('opensInNewTab')})</span>
                </Link>
              )
            })}
            {isAuthenticated && (
              <span> {t('contactDescriptionLoggedOut1')}</span>
            )}
          </p>

          {!isAuthenticated && (
            <p>
              {t('contactDescriptionLoggedOut2')}
            </p>
          )}
          {isAuthenticated && (
            <Form onSubmit={handleContactFormSubmit}>
              <div className="sectionContainer mt-0">
                <div className="sectionContent">
                  <FormInput
                    name="name"
                    id="name"
                    type="text"
                    label={t("form.labels.name")}
                    value={contactFormData.name || ''}
                    disabled={true}
                  />

                  <FormInput
                    name="email"
                    id="email"
                    type="text"
                    label={t("form.labels.email")}
                    value={contactFormData.email || ''}
                    disabled={true}
                  />

                  <FormInput
                    name="subject"
                    id="subject"
                    type="text"
                    label={t("form.labels.subject")}
                    value={contactFormData.subject || ''}
                    isRequiredVisualOnly={true}
                    onChange={handleInputChange}
                    isInvalid={fieldErrors.subject.length > 0}
                    errorMessage={
                      fieldErrors.subject.length > 0
                        ? fieldErrors.subject
                        : t("messages.errors.invalidSubject")
                    }
                  />

                  <FormInput
                    name="message"
                    id="message"
                    type="text"
                    label={t("form.labels.message")}
                    value={contactFormData.message || ''}
                    isRequiredVisualOnly={true}
                    onChange={handleInputChange}
                    isInvalid={fieldErrors.message.length > 0}
                    errorMessage={
                      fieldErrors.message.length > 0
                        ? fieldErrors.message
                        : t("messages.errors.invalidMessage")
                    }
                  />

                  <Button
                    type="submit"
                    className="button button--primary"
                    isDisabled={isSubmitting}
                  >
                    {isSubmitting ? Global("buttons.submitting") : Global("buttons.submit")}
                  </Button>
                </div>
              </div>
            </Form>
          )}
        </ContentContainer>

        <SidebarPanel>
          <div>
            <address>
              <strong>University of California Curation Center (UC3)</strong><br />
              University of California<br />
              Office of the President<br />
              1111 Franklin Street<br />
              Oakland CA 94607<br />
              USA<br />
            </address>

            <address className="mt-3">
              <strong>Email</strong> <a href="mailto:dmptool@ucop.edu">dmptool@ucop.edu</a>
            </address>

            <div className="mt-3">
              <iframe
                title="UC3 Office Location"
                width="90%"
                height="250"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src="https://www.google.com/maps?q=1111+Franklin+St,+Oakland,+CA+94607&output=embed"
              />
            </div>
          </div>
        </SidebarPanel>
      </LayoutWithPanel >
    </>

  );
}

export default ContactUsPage;