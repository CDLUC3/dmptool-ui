'use client'

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import logECS from '@/utils/clientLogger';
import { useTranslations } from "next-intl";
import {
  Button,
  Form,
} from "react-aria-components";

// GraphQL
import { useQuery, useMutation } from "@apollo/client/react";
import {
  ResetPasswordDocument,
  ValidatePasswordResetTokenDocument,
} from "@/generated/graphql";

// Components
import {
  ContentContainer,
  LayoutContainer,
} from '@/components/Container';
import ErrorMessages from "@/components/ErrorMessages";
import { FormInput } from '@/components/Form';
import PasswordRequirementsList from "@/components/PasswordRequirementsList";
import Loading from "@/components/Loading";

// Utils and other
import { useToast } from "@/context/ToastContext";
import { routePath, isValidPassword } from "@/utils/index";

type fieldErrorsMap = {
  password: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  //hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastState = useToast();
  const errorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const resetToken = searchParams.get("token") || "";
  if (!resetToken) {
    // If no token is present, redirect to the login page
    router.push(routePath('app.login'));
  }

  //Localization
  const t = useTranslations('LoginPage.resetPassword');
  const Global = useTranslations('Global');

  //States
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<fieldErrorsMap>({
    password: "",
    confirmPassword: "",
  });

  //initialize the mutation hook for resetting password
  const [resetPasswordMutation, { loading: resetPasswordLoading }] = useMutation(ResetPasswordDocument);

  const { data: validatePasswordResetTokenData, loading: validatePasswordResetTokenLoading, error: validatePasswordResetTokenError } = useQuery(ValidatePasswordResetTokenDocument, {
    variables: {
      token: resetToken
    },
    skip: !resetToken, // Skip the query if resetToken is empty
  });

  function isValid(): boolean {
    const newFieldErrors: fieldErrorsMap = { password: "", confirmPassword: "" };
    let hasErrors = false;

    if (!isValidPassword(password)) {
      newFieldErrors.password = t('passwordRequirements');
      hasErrors = true;
    }
    if (password !== confirmPassword) {
      newFieldErrors.confirmPassword = Global('messaging.errors.passMissMatch');
      hasErrors = true;
    }

    setFieldErrors(newFieldErrors);

    if (hasErrors) {
      setErrors([Global('messaging.fixBelow')]); // always a fresh array, no accumulation possible
    }

    return !hasErrors;
  }

  async function handleResetPassword(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setErrors([]);  // Clear previous errors

    if (!isValid()) {
      return; // don't fire the mutation
    }
    setIsSubmitting(true);

    try {
      await resetPasswordMutation({
        variables: {
          token: resetToken,
          newPassword: password
        }
      });
      setSubmitted(true);
    } catch (error) {
      setErrors([Global('messaging.somethingWentWrong')]);
      logECS('error', 'resetPassword', {
        error,
        url: { path: routePath('login.resetPassword') }
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const returnToLogin = () => {
    router.push(routePath('app.login'));
  }

  // If the validation fails, redirect to login page with an error message
  useEffect(() => {
    if (validatePasswordResetTokenLoading) return; // wait for it to resolve

    if (validatePasswordResetTokenError || !validatePasswordResetTokenData?.validatePasswordResetToken) {
      toastState.add(Global('messaging.somethingWentWrong'), { type: "error", timeout: 3000 });
      router.push(routePath('app.login'));
    }
  }, [validatePasswordResetTokenLoading, validatePasswordResetTokenData, validatePasswordResetTokenError]);


  if (validatePasswordResetTokenLoading || resetPasswordLoading) {
    return <Loading message={Global('messaging.loading')} />;
  }

  return (
    <LayoutContainer className="auth-container">
      <ContentContainer className="auth-card">
        {submitted ? (
          <>
            <h3>{t('passwordUpdatedTitle')}</h3>
            <p>{t('passwordUpdatedMessage')}</p>
            <Button
              type="button"
              onPress={returnToLogin}
            >
              {t('buttons.backToLogin')}
            </Button>
          </>
        ) : (
          <>
            <h3 id="reset-password-title">{t('title')}</h3>

            {/**Skip the browser's built-in validation and defer validation to the frontend by using the validationBehavior prop.*/}
            <Form
              onSubmit={handleResetPassword}
              ref={formRef}
              validationBehavior="aria"
            >
              <ErrorMessages errors={errors} ref={errorRef} />
              <FormInput
                name="password"
                type="password"
                label={t('passwordLabel')}
                ariaLabel={t('passwordLabel')}
                ariaDescribedBy="password-requirements"
                passwordToggleLabel={t('passwordLabel')}
                isRequired
                onChange={(e) => setPassword(e.target.value)}
                isInvalid={!!fieldErrors.password}
                errorMessage={fieldErrors.password}
                data-testid="pass"
              />

              <PasswordRequirementsList password={password} />

              <FormInput
                name="confirmPassword"
                type="password"
                label={t('confirmPasswordLabel')}
                ariaLabel={t('confirmPasswordLabel')}
                passwordToggleLabel={t('confirmPasswordLabel')}
                isRequired
                onChange={(e) => setConfirmPassword(e.target.value)}
                isInvalid={!!fieldErrors.confirmPassword}
                errorMessage={fieldErrors.confirmPassword}
                data-testid="confirmpass"
                ariaDescribedBy="password-requirements"
              />

              <div>
                <Button
                  type="submit"
                  isDisabled={isSubmitting}
                  data-testid="actionContinue"
                >
                  {isSubmitting ? Global('buttons.sending') : t('buttons.changeMyPassword')}
                </Button>
              </div>
            </Form>
          </>
        )}
      </ContentContainer>
    </LayoutContainer>
  );
};

export default ResetPassword;
