'use client'

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/navigation';
import logECS from '@/utils/clientLogger';
import { useCsrf } from '@/context/CsrfContext';
import { handleErrors } from '@/utils/errorHandler';
import { useAuthContext } from '@/context/AuthContext';
import { useTranslations } from "next-intl";
import {
  Button,
  Form,
  Link,
} from "react-aria-components";
import {
  ContentContainer,
  LayoutContainer,
  ToolbarContainer,
} from '@/components/Container';
import ErrorMessages from "@/components/ErrorMessages";
import { FormInput } from '@/components/Form';
import styles from './login.module.scss';
import { routePath } from "@/utils/index";


type LoginSteps =
  | "email"
  | "sso"
  | "password";


const LoginPage: React.FC = () => {
  const t = useTranslations('LoginPage');
  const Global = useTranslations('Global');
  const errorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [step, setStep] = useState<LoginSteps>("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { csrfToken } = useCsrf();
  const router = useRouter();

  const { setIsAuthenticated, clearCache } = useAuthContext();

  const returnToEmail = () => {
    setStep("email");
  };

  const handleLogin = async () => {
    setLoading(true);
    setErrors([]);  // Clear previous errors

    const loginRequest = async (token: string | null) => {
      return await fetch(`${process.env.NEXT_PUBLIC_SERVER_ENDPOINT}/apollo-signin`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token || '',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    try {
      const response = await loginRequest(csrfToken);

      if (response.ok) {
        // Clear any cached data
        await clearCache();
        setIsAuthenticated(true);
        router.push('/')
      } else {
        await handleErrors(response, loginRequest, setErrors, router, '/login');
      }

    } catch (err: any) {
      logECS('error', 'Login error', {
        error: err,
        url: { path: '/apollo-signin' }
      });
      setErrors([t('loginError')]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();

    switch (step) {
      case "email":
        // TODO: Detect SSO email and redirect to that page. For now just
        // go to normal login step.
        setStep("password");
        break;

      case "password":
        handleLogin();
        break;
    }
  }

  function reFocusForm() {
    if (formRef.current) {
      // Focus the first input in the form.
      const formEl = formRef.current as HTMLElement;
      const inputEl = formEl.querySelector('input') as HTMLElement;
      if (inputEl) inputEl.focus();
    }
  }

  useEffect(() => {
    reFocusForm();
  }, [errors])

  useEffect(() => {
    if (step === "password") {
      if (formRef.current) {
        const formEl = formRef.current as HTMLElement;
        const inputEl = formEl.querySelector('#password') as HTMLElement;
        if (inputEl) inputEl.focus();
      }
    }
  }, [step]);

  useEffect(() => {
    document.title = `${t('pageTitle')} | DMP Tool`;
  }, []);

  return (
    <LayoutContainer className="auth-container">
      <ContentContainer className="auth-card">
        <h3>{t('pageTitle')}</h3>

        <Form
          className={styles.loginForm}
          onSubmit={handleSubmit}
          ref={formRef}
          data-step={step}
        >
          <ErrorMessages errors={errors} ref={errorRef} />
          {(step === "email" || step === "password") && (
            <FormInput
              name="email"
              type="email"
              label={t('emailAddress')}
              ariaLabel={t('emailAddress')}
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              isRequired
              readOnly={step === "password"}
              autoComplete={step === "password" ? "off" : "email"}
              inputClasses={step === "password" ? "disabled-look" : ""}
              helpMessage={step === "email" ? t('singleSignOn') : undefined}
              data-testid="emailInput"
            />
          )}

          {(step === "password") && (
            <FormInput
              id="password"
              name="password"
              type="password"
              label={t('password')}
              ariaLabel={t('password')}
              onChange={(e) => setPassword(e.target.value)}
              isRequired
              helpMessage={(
                <Link href={routePath('login.forgotPassword')} className={styles.forgotPasswordLink}>
                  {t('forgotPassword.title')}
                </Link>
              )}
              data-testid="passInput"
            />
          )}

          <ToolbarContainer className={styles.formActions}>
            {(step === "email") && (
              <Button
                type="submit"
                isDisabled={loading}
                data-testid="actionContinue"
              >
                {loading ? '...' : t('continue')}
              </Button>
            )}

            {(step === "password") && (
              <div className="button-container">
                <Button type="button" className="secondary" onPress={returnToEmail}>{Global('buttons.back')}</Button>
                <Button
                  type="submit"
                  isDisabled={loading}
                  data-testid="actionSubmit"
                >
                  {loading ? '...' : t('login')}
                </Button>
              </div>
            )}
          </ToolbarContainer>

          <div className={styles.formLinks}>
            {(step === "email") && (
              <Link href="/signup/">{t('signupText')}</Link>
            )}
            <Link href="#">{t('getHelpText')}</Link>
          </div>
        </Form>
      </ContentContainer>
    </LayoutContainer>
  );
};

export default LoginPage;
