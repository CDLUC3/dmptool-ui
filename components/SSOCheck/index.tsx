import React, { useEffect, useRef, useState } from "react";
import { FormInput } from "@/components/Form";
import styles from "./ssoCheck.module.scss"
import ErrorMessages from "@/components/ErrorMessages";
import { Button, Checkbox, Form, Link } from "react-aria-components";

import { ToolbarContainer } from "@/components/Container";
import { useCsrf } from "@/context/CsrfContext";
import { useRouter } from "@/i18n/routing";
import { useAuthContext } from "@/context/AuthContext";
import logECS from "../../utils/clientLogger";
import { useTranslations } from "next-intl";
import { TypeAheadWithOther, useAffiliationSearch } from "@/components/Form/TypeAheadWithOther";
import PasswordRequirementsList from "@/components/PasswordRequirementsList";
import { handleErrors, isValidPassword, isValidEmail, routePath } from "@/utils/index";

interface SSOCheckContainerProps {
  mode: Modes;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  givenName: string;
  surName: string;
  affiliationId: string;
  otherAffiliationName: string;
  password: string;
  acceptedTerms: boolean;
}

type fieldErrorsMap = {
  email: string;
  givenName: string;
  surName: string;
  affiliationId: string;
  otherAffiliationName: string;
  password: string;
  confirmPassword: string;
};

type Modes = "login" | "register";
type LoginSteps = "email" | "sso" | "non-sso";

const authTargets = {
  login: "/sign-in",
  register: "/sign-up",
}
const modePaths = {
  login: "/login",
  register: "/signup",
}
const modeButtonText = {
  login: "submitLogin",
  register: "submitSignup",
};
const modePathText = {
  login: "loginLink",
  register: "registerLink",
};

export const SSOCheckContainer: React.FC<SSOCheckContainerProps> = ({ mode }) => {
  const t = useTranslations("AuthPage");
  const globalT = useTranslations("Global");
  const errorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<fieldErrorsMap>({
    email: "",
    givenName: "",
    surName: "",
    affiliationId: "",
    otherAffiliationName: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const { getCsrfToken } = useCsrf();
  const router = useRouter();

  const [step, setStep] = useState<LoginSteps>("email");

  const [email, setEmail] = useState("");
  const [ssoEntityId, setSsoEntityId] = useState<string | null>(null);

  const [affiliation, setAffiliation] = useState<string | null>(null);
  const [affiliationId, setAffiliationId] = useState<string | null>(null);
  const [otherField, setOtherField] = useState<boolean>(false);
  const [otherAffiliation, setOtherAffiliation] = useState<string>("");
  const { suggestions, handleSearch, isSearching, searchError } = useAffiliationSearch();

  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  const { setIsAuthenticated, clearCache } = useAuthContext();

  const returnToEmail = () => {
    setStep("email");
  };

  function handleNonSsoClick() {
    setStep("non-sso");
  }

  // handle successful Login or Registration
  const onFormSubmissionSuccess = async () => {
    // Clear any cached data
    await clearCache();
    setIsAuthenticated(true);
    // Full navigation to a URL with no locale, so the middleware can choose
    // the user's saved language from their new JWT (languageId)
    window.location.assign(routePath("app.home"));
  };

  // After the user enters their email address, call the ssoCheck endpoint on the Auth service to determine which form
  // to display to the user
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
        setSsoEntityId(json.entityId);
        setAffiliation(json.displayName);
        setAffiliationId(json.affiliationId);
        setStep("sso");

      } else if (response.status === 404) {
        // If a 404 was returned then the email is not associated with an SSO provider, so we can show the non-SSO form.
        setStep("non-sso");

      } else {
        // CSRF tokens are single-use, so a token already used by sign-up or logout gets a 403 here.
        // handleErrors retries with a fresh token, and must finish the login the same way on success.
        await handleErrors(response, ssoCheckRequest, setErrors, router, mode === "login" ? "/login" : "/signup", onFormSubmissionSuccess);
      }
    } catch (err: any) {
      logECS("error", "SSO Check error", {
        error: err,
        url: { path: "/sso-check" },
      });
      // The SSO check failed for some reason, Log the error and return to the non-SSO step so the user can try to
      // log in via that route.
      logECS("error", "SSO Check error", {
        error: err,
        url: { path: "/sso-check" },
      });
      setErrors([t("ssoCheckError")]);
      setStep("non-sso");
    } finally {
      setLoading(false);
    }
  };

  // Validate the form fields based on the current mode (login or register) and set any errors found.
  function isValid(): boolean {
    let hasErrors = false;
    const globalErrors = errors || [];

    if (globalErrors.length > 0) hasErrors = true;

    if (!isValidEmail(email)) {
      setFieldErrors({
        ...fieldErrors,
        email: globalT("messaging.errors.invalidEmail"),
      });
      hasErrors = true;
    }

    if (mode === "login") {
      if (!isValidPassword(password)) {
        setFieldErrors({
          ...fieldErrors,
          confirmPassword: t("passwordRequirements"),
        });
        hasErrors = true;
      }
    } else {
      if (password !== confirmPassword) {
        setFieldErrors({
          ...fieldErrors,
          confirmPassword: globalT("messaging.errors.passMissMatch"),
        });
        hasErrors = true;
      }

      if (!isValidPassword(password)) {
        setFieldErrors({
          ...fieldErrors,
          password: t("passwordRequirements"),
        });
        hasErrors = true;
      }

      if (!affiliationId && !otherAffiliation) {
        setFieldErrors({
          ...fieldErrors,
          affiliationId: t("institutionRequired"),
        });
        hasErrors = true;
      }
    }

    return !hasErrors;
  }

  // Handle the form submission for login or registration, including CSRF token handling and error management.
  async function handleFormSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setLoading(true);
    setErrors([]); // Clear previous errors

    if (!formRef.current || !isValid()) {
      setLoading(false);
      return;
    }

    // Login or Register request to the Auth service
    const authRequest = async (token: string | null) => {
      const payload: LoginInput | RegisterInput = mode === "login"
        ? {
            email,
            password: (formRef.current?.elements.namedItem("password") as HTMLInputElement)?.value,
          }
        : {
            givenName: firstName,
            surName: lastName,
            email,
            password,
            affiliationId: affiliationId || undefined,
            otherAffiliationName: otherAffiliation,
            acceptedTerms: termsAccepted,
          };

      return await fetch(`${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}${authTargets[mode]}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": token || "",
        },
        body: JSON.stringify({
          ...payload,
          email
        }),
      });
    };

    /* eslint-disable @typescript-eslint/no-explicit-any */
    try {

      const response = await authRequest(await getCsrfToken());

      if (response.ok) {
        await onFormSubmissionSuccess();

      } else if (response.status >= 400 && response.status < 500) {
        // If it was a 400 level error just display the generic error message for the mode (login or register) so that
        // we are not giving away any information about the validity of the email or password.
        setErrors([t(mode === "login" ? "loginError" : "registerError")]);
        reFocusForm();

      } else {
        // CSRF tokens are single-use, so a token already used by sign-up or logout gets a 403 here.
        // handleErrors retries with a fresh token, and must finish the login the same way on success.
        await handleErrors(response, authRequest, setErrors, router, modePaths[mode], onFormSubmissionSuccess);
      }
    } catch (err: any) {
      logECS("error", `${mode} error`, {
        error: err,
        url: { path: authTargets[mode] },
      });
      setErrors([t(mode === "login" ?"loginError" : "registerError")]);
    } finally {
      setLoading(false);
    }
  }

  // Handle the submit button click and depending on what step the user is on, either check for SSO or attempt to submit
  // the form.
  async function processSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();

    try {

      switch (step) {
        case "email":
          // We are on the email entry step, so check if it is an SSO email
          await ssoCheck();
          break;

        case "non-sso":
          // We are on the non-SSO step, so process the form submission
          setLoading(true);
          await handleFormSubmit(ev);
          break;

        case "sso":
          // Set the user to the SSO provider's login page. The SSO provider will redirect back to the app after
          // successful authentication.
          setLoading(true);
          const queryString = new URLSearchParams({
            email,
            entityId: ssoEntityId || "",
          }).toString();

          window.location.href = `${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/sso/passthru?${queryString}`;
          break;
      }
    } catch (err: any) {
      logECS("error", "Form submission error", {
        error: err,
        step,
        mode,
      });
      setErrors([mode === "login" ? t("loginError") : t("registerError")]);
    }
  }

  function updateAffiliations(dataId: string, value: string) {
    if (dataId) {
      setAffiliationId(dataId);
    } else if (value.toLowerCase() === "other") {
      setAffiliationId("");
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
    if (step === "non-sso") {
      if (formRef.current) {
        const formEl = formRef.current as HTMLElement;
        const inputEl = formEl.querySelector(mode === "login" ? "#password" : "#first_name") as HTMLElement;
        if (inputEl) inputEl.focus();
      }
    }
  }, [step]);

  return (
    <Form
      className={styles.authForm}
      onSubmit={processSubmit}
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
        autoComplete={step === "non-sso" ? "off" : "email"}
        inputClasses={["password", "sso"].includes(step) ? "disabled-look" : ""}
        helpMessage={step === "email" ? t("singleSignOn") : undefined}
        data-testid="emailInput"
      />

      {step === "non-sso" && mode === "login" && (
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

      {step === "non-sso" && mode === "register" && (
        <>
          <div className="two-item-row">
            <FormInput
              name="first_name"
              type="text"
              label={t("firstName")}
              ariaLabel={t("firstName")}
              isRequired
              onChange={(e) => setFirstName(e.target.value)}
            />

            <FormInput
              name="last_name"
              type="text"
              label={t("lastName")}
              ariaLabel={t("lastName")}
              isRequired
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <TypeAheadWithOther
            className={styles.typeAhead}
            label={t("institution")}
            isRequired={true}
            fieldName="institution"
            setOtherField={setOtherField}
            helpText={t("institutionHelp")}
            updateFormData={updateAffiliations}
            error={fieldErrors?.affiliationId ?? searchError ?? ""}
            suggestions={suggestions}
            onSearch={handleSearch}
            isLoading={isSearching}
          />
          {otherField && (
            <FormInput
              name="otherAffiliation"
              id="fieldInstitution"
              label={t("institutionOther")}
              onChange={(e) => setOtherAffiliation(e.target.value)}
              placeholder={t("institutionOtherPlaceholder")}
              data-testid="otherAffiliation"
            />
          )}

          <FormInput
            name="email"
            type="email"
            label={t("emailAddress")}
            ariaLabel={t("emailAddress")}
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            isRequired
            disabled={true}
          />

          <FormInput
            name="password"
            type="password"
            label={t("password")}
            ariaLabel={t("password")}
            passwordToggleLabel={t("password")}
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
            label={t("passwordConfirm")}
            ariaLabel={t("passwordConfirm")}
            passwordToggleLabel={t("passwordConfirm")}
            isRequired
            onChange={(e) => setConfirmPassword(e.target.value)}
            isInvalid={!!fieldErrors.confirmPassword}
            errorMessage={fieldErrors.confirmPassword}
            data-testid="confirmpass"
          />

          <Checkbox
            isSelected={termsAccepted}
            onChange={setTermsAccepted}
          >
            <div className="checkbox">
              <svg
                viewBox="0 0 18 18"
                aria-hidden="true"
              >
                <polyline points="1 9 7 14 15 4" />
              </svg>
            </div>
            {t("acceptTerms")}
          </Checkbox>
        </>
      )}

      {step === "sso" && (
        <div className={styles.ssoAffiliation}>
          <p>{t("ssoReasoning")}</p>
          <strong>{affiliation}</strong>
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
        {step === "non-sso" && (
          <div className="button-container">
            <Button
              type="button"
              className="secondary"
              onPress={returnToEmail}
            >
              {globalT("buttons.back")}
            </Button>
            <Button
              type="submit"
              isDisabled={loading || (mode === "register" && !termsAccepted)}
              data-testid="actionSubmit"
            >
              {loading ? "..." : t(modeButtonText[mode])}
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
              {globalT("buttons.back")}
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
        {step === "sso" && (
          <Button
            type="button"
            className={`${styles.nonSsoLink} link`}
            onPress={handleNonSsoClick}
          >
            {t("nonSsoLink")}
          </Button>
        )}
        {step === "email" && (
          <Link
            href={mode === "login" ? modePaths.register : modePaths.login}>
            {t(mode === "login" ? modePathText.register : modePathText.login)}
          </Link>
        )}
        <Link href="#">{t("getHelpText")}</Link>
      </div>
    </Form>
  );
}
