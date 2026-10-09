'use client'

import React, { useRef, useState } from "react";
import { useRouter } from '@/i18n/routing';
import logECS from '@/utils/clientLogger';
import { useTranslations } from "next-intl";
import {
  Button,
  Form,
  Link,
} from "react-aria-components";

import {
  ContentContainer,
  LayoutContainer,
} from '@/components/Container';
import { FormInput } from '@/components/Form';
import styles from './forgotPassword.module.scss';
import { routePath, isValidEmail, handleErrors } from "@/utils/index";
import { useCsrf } from "@/context/CsrfContext";
import ErrorMessages from "@/components/ErrorMessages";

const ForgotPassword: React.FC = () => {
  //hooks
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  //Localization
  const t = useTranslations('LoginPage.forgotPassword');
  const Global = useTranslations('Global');

  //States
  const [email, setEmail] = useState("");
  const { csrfToken } = useCsrf();
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrors([]);
    setEmail(e.target.value);
  };

  const handlePasswordResetRequest = async (email: string) => {
    setErrors([]);
    setIsSubmitting(true);

    const resetRequest = async (token: string | null) => {
      return await fetch(`${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/password-reset/token`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": token || "",
        },
        body: JSON.stringify({ email }),
      });
    };

    try {
      const response = await resetRequest(csrfToken).then(res => res.json());

      if (response.status === 502) {
        // There was a fatal error in the auth service
        await handleErrors(response, resetRequest, setErrors, router, routePath("login.forgotPassword"));
        return;
      } else if (response.ok) {
        logECS("info", "sendPasswordResetEmail", {
          email,
          url: { path: routePath("login.forgotPassword") },
        });
      }
      // If it wasn't a fatal error we want to show the success message regardless of whether the email was fo a known
      // user or not, to avoid leaking information about registered emails.
      setSubmitted(true);
    } catch (error) {
      logECS('error', 'sendPasswordResetEmail', {
        error,
        url: { path: routePath('login.forgotPassword') }
      });
      setErrors([Global('messaging.somethingWentWrong')]);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendResetPasswordEmail(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    // Validate on submit, not on change
    if (!isValidEmail(email)) {
      setErrors([t('invalidEmail')]);
      return; // don't fire the mutation
    }
    setIsSubmitting(true);

    try {
      await handlePasswordResetRequest(email);
    } catch (error) {
      logECS('error', 'sendPasswordResetEmail', {
        error,
        url: { path: routePath('login.forgotPassword') }
      });
    }
  }

  const returnToLogin = () => {
    router.push(routePath('app.login'));
  }

  return (
    <LayoutContainer className="auth-container">
      <ContentContainer className="auth-card">
        {submitted ? (
          <>
            <h3>{t("checkEmailTitle")}</h3>
            <p>{t("checkEmailMessage")}</p>
            <Button
              type="button"
              onPress={returnToLogin}
            >
              {t("buttons.backToLogin")}
            </Button>
          </>
        ) : (
          <>
            <h3 id="forgot-password-title">{t("title")}</h3>

            {/**Skip the browser's built-in validation and defer validation to the frontend by using the validationBehavior prop.*/}
            <Form
              className={styles.loginForm}
              onSubmit={handleSendResetPasswordEmail}
              ref={formRef}
              validationBehavior="aria"
            >
              <ErrorMessages errors={errors} ref={errorRef} />
              <FormInput
                id="email"
                name="email"
                type="email"
                label={t("emailLabel")}
                ariaLabel={t("emailLabel")}
                onChange={(e) => handleInputChange(e)}
                value={email}
                isRequiredVisualOnly={true}
                data-testid="emailInput"
                isInvalid={Array.isArray(errors) && errors.length > 0}
                errorMessage={errors.join(', ')}
              />

              <div className={styles.formActions}>
                <Button
                  type="submit"
                  isDisabled={isSubmitting}
                  data-testid="actionContinue"
                >
                  {isSubmitting ? t("buttons.sending") : t("buttons.sendReset")}
                </Button>
              </div>

              <div className={styles.formLinks}>
                <Button
                  type="button"
                  className="secondary"
                  onPress={returnToLogin}
                >
                  {t("buttons.backToLogin")}
                </Button>
                <div>
                  {t.rich("help.problemSigningIn", {
                    link: (chunks) => (
                      <Link
                        href={routePath("app.contact")}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {chunks}
                        <span className="hidden-accessibly">({Global("opensInNewTab")})</span>
                      </Link>
                    ),
                  })}
                </div>
              </div>
            </Form>
          </>
        )}
      </ContentContainer>
    </LayoutContainer>
  );
};

export default ForgotPassword;
