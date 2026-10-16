'use client'

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from '@/i18n/routing';
import logECS from '@/utils/clientLogger';
import { useCsrf } from "@/context/CsrfContext";
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
  const t = useTranslations("LoginPage");
  const Global = useTranslations("Global");
  const errorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [step, setStep] = useState<LoginSteps>("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ssoEntityId, setSsoEntityId] = useState<string | null>(null);
  const [affiliationName, setAffiliationName] = useState<string | null>(null);

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { getCsrfToken } = useCsrf();
  const router = useRouter();

  const { setIsAuthenticated, clearCache } = useAuthContext();

  const returnToEmail = () => {
    setStep("email");
  };

  const onLoginSuccess = async () => {
    // Clear any cached data
    await clearCache();
    setIsAuthenticated(true);
    // Full navigation to a URL with no locale, so the middleware can choose
    // the user's saved language from their new JWT (languageId)
    window.location.assign(routePath("app.home"));
  };

  // 1st phase of the login process: check if the email is associated with an SSO provider.
  const ssoCheck = async () => {
    setLoading(true);
    setErrors([]); // Clear previous errors

    const ssoCheckRequest = async (token: string | null) => {
      return await fetch(`${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/sso-check`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": token || "",
        },
        body: JSON.stringify({
          email,
        }),
      });
    };

    /* eslint-disable @typescript-eslint/no-explicit-any */
    try {
      const response = await ssoCheckRequest(await getCsrfToken());

      if (response.ok) {
        // If successful, the response will contain the affiliationId and displayName for the SSO provider.
        const json = await response.json();
        setStep("sso");

        setSsoEntityId(json.entityId);
        setAffiliationName(json.displayName);
      } else if (response.status === 404) {
        // If the email is not associated with an SSO provider, we can proceed to the password step.
        setStep("password");
      } else {
        // CSRF tokens are single-use, so a token already used by sign-up or logout gets a 403 here.
        // handleErrors retries with a fresh token, and must finish the login the same way on success.
        await handleErrors(response, ssoCheckRequest, setErrors, router, "/login", onLoginSuccess);
      }
    } catch (err: any) {
      logECS("error", "SSO Check error", {
        error: err,
        url: { path: "/sso-check" },
      });
      // The SSO check failed for some reason, Log the error and return to the password step so the user can try to
      // log in via that route.
      setErrors([t("ssoCheckError")]);
      setStep("password");
    } finally {
      setLoading(false);
    }
  };

  // 2nd phase of the login process: submit the email and password to the server for authentication or redirect them to their IdP for SSO.
  const handleLogin = async () => {
    setLoading(true);
    setErrors([]); // Clear previous errors

    // Email + password login request
    const passwordLoginRequest = async (token: string | null) => {
      return await fetch(`${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/sign-in`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": token || "",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
    };

    // SSO login request
    const ssoLoginRequest = async (token: string | null) => {
      return await fetch(`${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/sso/passthru`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": token || "",
        },
        body: JSON.stringify({
          email,
          entityId: ssoEntityId,
        }),
      });
    };

    /* eslint-disable @typescript-eslint/no-explicit-any */
    try {

console.log('LOGIN STEP:', step);

      const response = step === "sso"
        ? await ssoLoginRequest(await getCsrfToken())
        : await passwordLoginRequest(await getCsrfToken());

      if (response.ok) {
        await onLoginSuccess();
      } else {
        // CSRF tokens are single-use, so a token already used by sign-up or logout gets a 403 here.
        // handleErrors retries with a fresh token, and must finish the login the same way on success.
        await handleErrors(response, step === "sso" ? ssoLoginRequest : passwordLoginRequest, setErrors, router, "/login", onLoginSuccess);
      }
    } catch (err: any) {
      logECS("error", "Login error", {
        error: err,
        url: { path: step === "sso" ? "/sso/passthru" : "/sign-in" },
      });
      setErrors([t(step === "sso" ? "ssoError" : "loginError")]);

      if (step === "sso") {
        // If the SSO login failed for some reason, log the error and return to the password step so the user can try to
        // log in via that route.
        setStep("password");
      }
    } finally {
      setLoading(false);
    }
  };

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();

    switch (step) {
      case "email":
        await ssoCheck();
        break;

      case "password":
      case "sso":
        handleLogin();
        break;
    }
  }

  function reFocusForm() {
    if (formRef.current) {
      // Focus the first input in the form.
      const formEl = formRef.current as HTMLElement;
      const inputEl = formEl.querySelector("input") as HTMLElement;
      if (inputEl) inputEl.focus();
    }
  }

  useEffect(() => {
    reFocusForm();
  }, [errors]);

  useEffect(() => {
    if (step === "password") {
      if (formRef.current) {
        const formEl = formRef.current as HTMLElement;
        const inputEl = formEl.querySelector("#password") as HTMLElement;
        if (inputEl) inputEl.focus();
      }
    }
  }, [step]);

  useEffect(() => {
    document.title = `${t("pageTitle")} | DMP Tool`;
  }, []);

  return (
    <LayoutContainer className="auth-container">
      <ContentContainer className="auth-card">
        <h3>{t("pageTitle")}</h3>

        <Form
          className={styles.loginForm}
          onSubmit={handleSubmit}
          ref={formRef}
          data-step={step}
        >
          <ErrorMessages
            errors={errors}
            ref={errorRef}
          />

          <FormInput
            name="email"
            type="email"
            label={t("emailAddress")}
            ariaLabel={t("emailAddress")}
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            isRequired
            readOnly={["password", "sso"].includes(step)}
            autoComplete={step === "password" ? "off" : "email"}
            inputClasses={["password", "sso"].includes(step) ? "disabled-look" : ""}
            helpMessage={step === "email" ? t("singleSignOn") : undefined}
            data-testid="emailInput"
          />

          {step === "password" && (
            <FormInput
              id="password"
              name="password"
              type="password"
              label={t("password")}
              ariaLabel={t("password")}
              onChange={(e) => setPassword(e.target.value)}
              isRequired
              helpMessage={
                <Link
                  href={routePath("login.forgotPassword")}
                  className={styles.forgotPasswordLink}
                >
                  {t("forgotPassword.title")}
                </Link>
              }
              data-testid="passInput"
            />
          )}

          {step === "sso" && (
            <div className={styles.ssoAffiliation}>
              <p>{t("ssoReasoning")}</p>
              <strong>{affiliationName} - {ssoEntityId}</strong>
            </div>
          )}

          <ToolbarContainer className={styles.formActions}>
            {step === "email" && (
              <Button
                type="submit"
                isDisabled={loading}
                data-testid="actionContinue"
              >
                {loading ? "..." : t("continue")}
              </Button>
            )}

            {step === "password" && (
              <div className="button-container">
                <Button
                  type="button"
                  className="secondary"
                  onPress={returnToEmail}
                >
                  {Global("buttons.back")}
                </Button>
                <Button
                  type="submit"
                  isDisabled={loading}
                  data-testid="actionSubmit"
                >
                  {loading ? "..." : t("login")}
                </Button>
              </div>
            )}

            {step === "sso" && (
              <div className="button-container">
                <Button
                  type="button"
                  className="secondary"
                  onPress={returnToEmail}
                >
                  {Global("buttons.back")}
                </Button>
                <Button
                  type="submit"
                  isDisabled={loading}
                  data-testid="actionSsoSubmit"
                >
                  {loading ? "..." : t("sso")}
                </Button>
              </div>
            )}
          </ToolbarContainer>

          <div className={styles.formLinks}>
            {step === "email" && <Link href="/signup/">{t("signupText")}</Link>}
            <Link href="#">{t("getHelpText")}</Link>
          </div>
        </Form>
      </ContentContainer>
    </LayoutContainer>
  );
};;

export default LoginPage;
