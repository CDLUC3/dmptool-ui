'use client'

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import logECS from '@/utils/clientLogger';
import { useTranslations } from "next-intl";
import {
  Button,
  Form,
} from "react-aria-components";

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
  const [validatedToken, setValidatedToken] = useState<boolean>(false);
  const [validatingToken, setValidatingToken] = useState<boolean>(true);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<fieldErrorsMap>({
    password: "",
    confirmPassword: "",
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

  // Function to handle token verification
  async function handleTokenVerification(): Promise<void> {
    try {
      if (resetToken) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/password-reset/verify`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: resetToken }),
        });

        if (response.ok) {
          setValidatedToken(true);
          logECS("info", "resetPassword", {
            token: resetToken,
            url: { path: routePath("login.resetPassword") },
          });
        }
      }
    } catch (error) {
      logECS("error", "resetPassword", {
        error,
        url: { path: routePath("login.forgotPassword") },
      });
    } finally {
      setValidatingToken(false);
      setIsSubmitting(false);
    }
  }

  // Function to handle password reset
  async function handleResetPassword(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    try {
      if (isValid()) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/password-reset`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: resetToken,
            password,
            passwordConfirmation: confirmPassword,
          }),
        });

        if (response.ok) {
          logECS("info", "resetPassword", {
            token: resetToken,
            url: { path: routePath("login.resetPassword") },
          });
          toastState.add(t("successMessage"), { type: "success", timeout: 3000 });
          setSubmitted(true);
        }
      }
    } catch (error) {
      setErrors([Global('messaging.somethingWentWrong')]);
      logECS("error", "resetPassword", {
        error,
        url: { path: routePath("login.resetPassword") },
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const returnToLogin = () => {
    router.push(routePath('app.login'));
  }

  // Verify the token when the component mounts
  useEffect(() => {
    if (resetToken) {
      handleTokenVerification();
    }
  }, [resetToken]);

  // If the validation fails, redirect to login page or the forgot password page with an error message
  useEffect(() => {
    if (validatingToken) return; // wait for it to resolve

    if (!validatedToken) {
      // If the reset token was present, redirect to the forgot password because it was no longer valid
      toastState.add(t("expiredTokenMessage"), { type: "error", timeout: 3000 });
      router.push(routePath("login.forgotPassword"));
    }
  }, [validatingToken, validatedToken]);


  if (validatingToken) {
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
