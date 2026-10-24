"use client";

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
  initialPendingSignup?: PendingSSOSignup;
}

interface LoginInput {
  email: string;
  password?: string;
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

export interface PendingSSOSignup {
  email: string;
  affiliation?: string;
  displayName?: string;
  givenName?: string;
  surName?: string;
}

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

export const SSOCheckContainer: React.FC<SSOCheckContainerProps> = ({ mode, initialPendingSignup }) => {
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

  const [step, setStep] = useState<LoginSteps>(
    mode === "register" && initialPendingSignup ? "non-sso" : "email"
  );

  const [email, setEmail] = useState(mode === "register" && initialPendingSignup ? initialPendingSignup?.email : "");
  const [ssoEntityId, setSsoEntityId] = useState<string | null>(null);

  const [affiliation, setAffiliation] = useState<string | null>(initialPendingSignup?.displayName ?? null);
  const [affiliationId, setAffiliationId] = useState<string | null>(initialPendingSignup?.affiliation ?? null);
  const [otherField, setOtherField] = useState<boolean>(false);
  const [otherAffiliation, setOtherAffiliation] = useState<string>("");
  const { suggestions, handleSearch, isSearching, searchError } = useAffiliationSearch();

  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(initialPendingSignup?.givenName ?? "");
  const [lastName, setLastName] = useState(initialPendingSignup?.surName ?? "");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  const { setIsAuthenticated, clearCache } = useAuthContext();
  const isPendingSsoSignup = mode === "register" && initialPendingSignup?.email === email;

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
      let response = await ssoCheckRequest(await getCsrfToken());

      // CSRF tokens are single-use, so a token already used by sso-check gets a 403 here.
      // Retry once with a fresh token before handling the response.
      if (response.status === 403) {
        response = await ssoCheckRequest(await getCsrfToken());
      }

      if (response.ok) {
        // If successful, the response will contain the affiliationId and displayName for the SSO provider.
        const json = await response.json();

        if (json.entityId) {
          setSsoEntityId(json.entityId);
          setStep("sso");
        }

        // The check may return affiliation info even if its not SSO enabled. We want to use that info to pre-fill the
        // affiliation field on the form.
        setAffiliation(json.displayName);
        setAffiliationId(json.affiliationId);
      } else if (response.status === 404) {
        // If a 404 was returned then the email is not associated with an SSO provider, so we can show the non-SSO form.
        setStep("non-sso");
      } else {
        // Any other error (e.g. a 500) is handled by the shared error handler
        await handleErrors(response, ssoCheckRequest, setErrors, router, modePaths[mode]);
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

  // Validate the email field and return an error message if it is invalid or empty.
  function getEmailError(): string {
    if (!email.trim()) return t("emailRequired");
    if (!isValidEmail(email)) return t("invalidEmail");
    return "";
  }

  // Validate the form fields based on the current mode (login or register) and set any errors found.
  function isValid(): boolean {
    // Build up all field errors at once so later checks don't overwrite earlier ones
    const newFieldErrors: fieldErrorsMap = {
      email: "",
      givenName: "",
      surName: "",
      affiliationId: "",
      otherAffiliationName: "",
      password: "",
      confirmPassword: "",
    };

    if (!isValidEmail(email)) {
      newFieldErrors.email = globalT("messaging.errors.invalidEmail");
    }

    switch (mode) {
      case "login":
        if (!password) {
          newFieldErrors.password = t("passwordRequired");
        }
        break;

      case "register":
        if (!firstName.trim()) {
          newFieldErrors.givenName = t("firstNameRequired");
        }

        if (!lastName.trim()) {
          newFieldErrors.surName = t("lastNameRequired");
        }

        if (!isPendingSsoSignup) {
          if (!isValidPassword(password)) {
            newFieldErrors.password = t("passwordRequirements");
          }

          if (password !== confirmPassword) {
            newFieldErrors.confirmPassword = globalT("messaging.errors.passMissMatch");
          }
        }

        if (!affiliationId && !otherAffiliation) {
          newFieldErrors.affiliationId = t("institutionRequired");
        }

        if (!termsAccepted) {
          newFieldErrors.otherAffiliationName = t("termsRequired");
        }
        break;
    }

    setFieldErrors(newFieldErrors);
    return Object.values(newFieldErrors).every((msg) => !msg);
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
            affiliationId: affiliationId || undefined,
            otherAffiliationName: otherAffiliation,
            acceptedTerms: termsAccepted,
            ...(isPendingSsoSignup ? {} : { password }),
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
      let response = await authRequest(await getCsrfToken());

      // CSRF tokens are single-use, so a token already used by sign-up or sign-in gets a 403 here.
      // Retry once with a fresh token before handling the response.
      if (response.status === 403) {
        response = await authRequest(await getCsrfToken());
      }

      if (response.ok) {
        await onFormSubmissionSuccess();
      } else if (response.status === 409) {
        // If it was a 409 conflict, the email is already registered. This should only happen on registration.
        setErrors([t("accountExists")]);
        reFocusForm();
      } else if (response.status >= 400 && response.status < 500) {
        // If it was a 400 level error just display the generic error message for the mode (login or register) so that
        // we are not giving away any information about the validity of the email or password.
        setErrors([t(mode === "login" ? "loginError" : "registerError")]);
        reFocusForm();
      } else {
        // Any other error (e.g. a 500) is handled by the shared error handler
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
          // Validate the email before checking whether it belongs to an SSO provider
          const emailError = getEmailError();
          setFieldErrors((prev) => ({ ...prev, email: emailError }));
          if (emailError) break;

          // Check if it is an SSO email
          if (!isPendingSsoSignup) {
            await ssoCheck();
          }
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

  const emailHelpMessage = step === "email"
    ? t("singleSignOn")
    : isPendingSsoSignup ? t("pendingSSOEmailHelp") : undefined;

  return (
    <Form
      className={styles.authForm}
      onSubmit={processSubmit}
      validationBehavior="aria"
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
        onChange={(e) => {
          setEmail(e.target.value);
          setFieldErrors((prev) => ({ ...prev, email: "" }));
        }}
        value={email}
        isInvalid={!!fieldErrors.email}
        errorMessage={fieldErrors.email}
        isRequiredVisualOnly={true}
        readOnly={step !== "email"}
        inputClasses={step !== "email" ? "disabled-look" : ""}
        autoComplete={step === "non-sso" ? "off" : "email"}
        helpMessage={isPendingSsoSignup ? t("pendingSSOEmailHelp") : emailHelpMessage}
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
          isInvalid={!!fieldErrors.password}
          errorMessage={fieldErrors.password}
          isRequiredVisualOnly={true}
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
              isRequiredVisualOnly={true}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />

            <FormInput
              name="last_name"
              type="text"
              label={t("lastName")}
              ariaLabel={t("lastName")}
              isRequiredVisualOnly={true}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {!isPendingSsoSignup && (
            <>
              <TypeAheadWithOther
                className={styles.typeAhead}
                label={t("institution")}
                isRequiredVisualOnly={true}
                fieldName="institution"
                setOtherField={setOtherField}
                helpText={t("institutionHelp")}
                updateFormData={updateAffiliations}
                value={affiliation ?? ""}
                error={fieldErrors?.affiliationId || searchError || ""}
                suggestions={suggestions}
                onSearch={handleSearch}
                isLoading={isSearching}
                isDisabled={isPendingSsoSignup}
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
                name="password"
                type="password"
                label={t("password")}
                ariaLabel={t("password")}
                passwordToggleLabel={t("password")}
                isRequiredVisualOnly={true}
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
                isRequiredVisualOnly={true}
                onChange={(e) => setConfirmPassword(e.target.value)}
                isInvalid={!!fieldErrors.confirmPassword}
                errorMessage={fieldErrors.confirmPassword}
                data-testid="confirmpass"
              />
            </>
          )}

          <Checkbox
            isSelected={termsAccepted}
            onChange={setTermsAccepted}
            isRequired={true}
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
          <Link href={mode === "login" ? modePaths.register : modePaths.login}>
            {t(mode === "login" ? modePathText.register : modePathText.login)}
          </Link>
        )}
        <Link href={routePath("app.contact")}>{t("getHelpText")}</Link>
      </div>
    </Form>
  );
}
