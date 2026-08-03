'use client'

import React, { useRef, useState } from "react";
import { useRouter } from 'next/navigation';
import logECS from '@/utils/clientLogger';
import { useTranslations } from "next-intl";
import {
  Button,
  Form,
  Link,
} from "react-aria-components";

// GraphQL
import { useMutation } from "@apollo/client/react";
import {
  SendPasswordResetEmailDocument,
} from "@/generated/graphql";

import {
  ContentContainer,
  LayoutContainer,
} from '@/components/Container';
import { FormInput } from '@/components/Form';
import styles from './forgotPassword.module.scss';
import { routePath, isValidEmail } from "@/utils/index";

const ForgotPassword: React.FC = () => {
  //hooks
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  //Localization
  const t = useTranslations('LoginPage.forgotPassword');
  const Global = useTranslations('Global');

  //States
  const [email, setEmail] = useState("");
  const [emailFieldError, setEmailFieldError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  //initialize the mutation hook for sending password reset email
  const [sendPasswordResetEmailMutation, { loading: sendPasswordResetEmailLoading }] = useMutation(SendPasswordResetEmailDocument);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailFieldError(undefined);
    setEmail(e.target.value);
  };

  async function handleSendResetPasswordEmail(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    // Validate on submit, not on change
    if (!isValidEmail(email)) {
      setEmailFieldError(t('invalidEmail'));
      return; // don't fire the mutation
    }
    setIsSubmitting(true);

    try {
      await sendPasswordResetEmailMutation({
        variables: {
          email
        }
      });
      logECS('info', 'sendPasswordResetEmail', {
        email,
        url: { path: routePath('login.forgotPassword') }
      });
    } catch (error) {
      logECS('error', 'sendPasswordResetEmail', {
        error,
        url: { path: routePath('login.forgotPassword') }
      });
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
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
            <h3>{t('checkEmailTitle')}</h3>
            <p>{t('checkEmailMessage')}</p>
            <Button
              type="button"
              onPress={returnToLogin}
            >
              {t('buttons.backToLogin')}
            </Button>
          </>
        ) : (
          <>
            <h3 id="forgot-password-title">{t('title')}</h3>

            {/**Skip the browser's built-in validation and defer validation to the frontend by using the validationBehavior prop.*/}
            <Form
              className={styles.loginForm}
              onSubmit={handleSendResetPasswordEmail}
              ref={formRef}
              validationBehavior="aria"
            >
              <FormInput
                id="email"
                name="email"
                type="email"
                label={t('emailLabel')}
                ariaLabel={t('emailLabel')}
                onChange={(e) => handleInputChange(e)}
                value={email}
                isRequiredVisualOnly={true}
                data-testid="emailInput"
                isInvalid={!!emailFieldError}
                errorMessage={emailFieldError}
              />

              <div className={styles.formActions}>
                <Button
                  type="submit"
                  isDisabled={isSubmitting || sendPasswordResetEmailLoading}
                  data-testid="actionContinue"
                >
                  {isSubmitting || sendPasswordResetEmailLoading ? t('buttons.sending') : t('buttons.sendReset')}
                </Button>
              </div>

              <div className={styles.formLinks}>
                <Button type="button" className="secondary" onPress={returnToLogin}>{t('buttons.backToLogin')}</Button>
                <div>
                  {t.rich('help.problemSigningIn', {
                    link: (chunks) => (
                      <Link href={routePath('app.contact')} target="_blank" rel="noopener noreferrer">
                        {chunks}
                        <span className="hidden-accessibly">({Global('opensInNewTab')})</span>
                      </Link>
                    )
                  })
                  }
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
