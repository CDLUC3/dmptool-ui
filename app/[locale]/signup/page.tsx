'use client'

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from "next-intl";
import {
  Button,
  Checkbox,
  Form,
  Link,
} from "react-aria-components";
import { useCsrf } from '@/context/CsrfContext';
import logECS from '@/utils/clientLogger';
import { handleErrors } from '@/utils/errorHandler';
import { useAuthContext } from '@/context/AuthContext';
import { isValidPassword } from "@/utils/index";

//Components
import {
  ContentContainer,
  LayoutContainer,
  ToolbarContainer,
} from '@/components/Container';
import ErrorMessages from '@/components/ErrorMessages';
import { FormInput } from '@/components/Form';
import { TypeAheadWithOther, useAffiliationSearch } from '@/components/Form/TypeAheadWithOther';
import PasswordRequirementsList from "@/components/PasswordRequirementsList";

import styles from './signup.module.scss';


type SignupStepState =
  | "email"
  | "sso"
  | "profile";


type signupDataMap = {
  email: string;
  givenName: string;
  surName: string;
  affiliationId: string;
  otherAffiliationName: string;
  password: string;
  acceptedTerms: boolean,
};

type fieldErrorsMap = {
  email: string;
  givenName: string;
  surName: string;
  affiliationId: string;
  otherAffiliationName: string;
  password: string;
  confirmPassword: string;
}

const SignUpPage: React.FC = () => {
  const t = useTranslations('SignupPage');
  const globalT = useTranslations('Global');

  const errorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();
  const { csrfToken } = useCsrf();
  const { setIsAuthenticated } = useAuthContext();

  const [step, setStep] = useState<SignupStepState>("email");
  const [isWorking, setIsWorking] = useState<boolean>(false);
  const [invalid, setInvalid] = useState<boolean>(false);

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

  const [email, setEmail] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [institution, setInstitution] = useState<string>("");
  const [otherField, setOtherField] = useState<boolean>(false);
  const [otherAffiliation, setOtherAffiliation] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const { suggestions, handleSearch, isSearching, searchError } = useAffiliationSearch();


  const returnToEmail = () => {
    setStep("email");
  };

  async function handleSignUp() {
    setIsWorking(true);
    setErrors([]);

    const data: signupDataMap = {
      givenName: firstName,
      surName: lastName,
      email,
      password,
      affiliationId: institution,
      otherAffiliationName: otherAffiliation,
      acceptedTerms: termsAccepted,
    };

    const signupRequest = async (token: string | null) => {
      return await fetch(`${process.env.NEXT_PUBLIC_SERVER_ENDPOINT}/apollo-signup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token || '',
        },
        body: JSON.stringify(data),
      });
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    try {
      const response = await signupRequest(csrfToken);

      if (response && response.ok) {
        setIsAuthenticated(true);
        router.push('/')
      } else {
        await handleErrors(response, signupRequest, setErrors, router, '/signup');
      }
    } catch (err: any) {
      logECS('error', 'Signup error', {
        error: err,
        url: { path: '/apollo-signup' }
      });
      setErrors(['An unexpected error occurred. Please try again.']);
    } finally {
      setIsWorking(false);
    }
  };

  function isValid(): boolean {
    let hasErrors = false;
    const globalErrors = errors || [];

    if (globalErrors.length > 0) hasErrors = true;

    if (password !== confirmPassword) {
      setFieldErrors({
        ...fieldErrors,
        confirmPassword: globalT('messaging.errors.passMissMatch'),
      });
      hasErrors = true;
    }

    if (!isValidPassword(password)) {
      setFieldErrors({
        ...fieldErrors,
        password: t('passwordRequirements'),
      });
      hasErrors = true;
    }

    if (!institution && !otherAffiliation) {
      setFieldErrors({
        ...fieldErrors,
        affiliationId: t('institutionRequired'),
      })
      hasErrors = true;
    }

    if (hasErrors) {
      globalErrors.push(globalT('messaging.fixBelow'));
      setErrors(globalErrors);
      setInvalid(true);
    }

    return !hasErrors;
  }

  function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    if (!ev.nativeEvent || invalid || hasErrors()) return;
    ev.nativeEvent.preventDefault();

    setIsWorking(true);
    switch (step) {
      case "email":
        // TODO:: How do we detect SSO? For the time being we just go
        // straight to profile
        setStep("profile");
        break;

      case "profile":
        if (isValid() && termsAccepted) {
          handleSignUp();
        }
        break;
    }
    setIsWorking(false);
  }

  function hasErrors() {
    return Object.values(fieldErrors).some(v => v.trim() !== "");
  }

  function reFocusForm() {
    const appElement = document.getElementById("App") as HTMLElement;
    if (appElement) appElement.scrollIntoView({ behavior: 'smooth' });
    if (formRef.current) {
      // Focus the first input in the form, since we cannot use focus() on
      // a form itself.
      const formEl = formRef.current as HTMLElement;
      const inputEl = formEl.querySelector('input') as HTMLElement;
      if (inputEl) inputEl.focus();
    }
  }

  function updateAffiliations(dataId: string, value: string) {
    if (dataId) {
      setInstitution(dataId);
    } else if (value.toLowerCase() === "other") {
      setInstitution("");
    }
  }

  useEffect(() => {
    reFocusForm();
  }, [step]);

  useEffect(() => {
    if (invalid || errors) {
      reFocusForm();
    }
  }, [invalid, errors]);

  return (
    <LayoutContainer className={styles.signupPage}>
      <ContentContainer className={styles.signupContent}>
        {(step === "email") ? (
          <h3>{t('register')}</h3>
        ) : (
          <h3>{t('createAccount')}</h3>
        )}

        <Form
          className={styles.signupForm}
          onSubmit={handleSubmit}
          validationErrors={fieldErrors}
          data-step={step}
          ref={formRef}
        >
          <ErrorMessages errors={errors} ref={errorRef} />

          {(step === "email") && (
            <FormInput
              name="email"
              type="email"
              label={t('emailAddress')}
              ariaLabel={t('emailAddress')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isRequired
              helpMessage={t('emailHelp')}
            />
          )}

          {(step === "profile") && (
            <>
              <div className="two-item-row">
                <FormInput
                  name="first_name"
                  type="text"
                  label={t('firstName')}
                  ariaLabel={t('firstName')}
                  isRequired
                  onChange={(e) => setFirstName(e.target.value)}
                />

                <FormInput
                  name="last_name"
                  type="text"
                  label={t('lastName')}
                  ariaLabel={t('lastName')}
                  isRequired
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <TypeAheadWithOther
                className={styles.typeAhead}
                label={t('institution')}
                isRequired={true}
                fieldName="institution"
                setOtherField={setOtherField}
                helpText={t('institutionHelp')}
                updateFormData={updateAffiliations}
                error={fieldErrors?.affiliationId ?? searchError ?? ''}
                suggestions={suggestions}
                onSearch={handleSearch}
                isLoading={isSearching}
              />
              {otherField && (
                <FormInput
                  name="otherAffiliation"
                  id="fieldInstitution"
                  label={t('institutionOther')}
                  onChange={(e) => setOtherAffiliation(e.target.value)}
                  placeholder={t('institutionOtherPlaceholder')}
                  data-testid="otherAffiliation"
                />
              )}

              <FormInput
                name="email"
                type="email"
                label={t('emailAddress')}
                ariaLabel={t('emailAddress')}
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                isRequired
                disabled={true}
              />

              <FormInput
                name="password"
                type="password"
                label={t('password')}
                ariaLabel={t('password')}
                passwordToggleLabel={t('password')}
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
                label={t('passwordConfirm')}
                ariaLabel={t('passwordConfirm')}
                passwordToggleLabel={t('passwordConfirm')}
                isRequired
                onChange={(e) => setConfirmPassword(e.target.value)}
                isInvalid={!!fieldErrors.confirmPassword}
                errorMessage={fieldErrors.confirmPassword}
                data-testid="confirmpass"
              />

              <Checkbox
                isSelected={termsAccepted}
                onChange={setTermsAccepted}>
                <div className="checkbox">
                  <svg viewBox="0 0 18 18" aria-hidden="true">
                    <polyline points="1 9 7 14 15 4" />
                  </svg>
                </div>
                {t('acceptTerms')}
              </Checkbox>
            </>
          )}

          <ToolbarContainer className={styles.formActions}>
            {(step === "email") && (
              <Button
                type="submit"
                isDisabled={isWorking}
                data-testid="continue"
              >
                {isWorking ? '...' : t('submitContinue')}
              </Button>
            )}

            {(step === "profile") && (
              <>
                <div className="button-container">
                  <Button type="submit" className="secondary" onPress={returnToEmail}>{globalT('buttons.back')}</Button>
                  <Button
                    type="submit"
                    isDisabled={(isWorking || !termsAccepted)}
                    data-testid="signup"
                  >
                    {isWorking ? t('signingUp') + ' ...' : t('submitSignup')}
                  </Button>
                </div>
              </>
            )}
          </ToolbarContainer>

          {(step === "email") && (
            <div className={styles.formLinks}>
              <Link href="/login/">{t('loginLink')}</Link>
              <Link href="#">{t('helpLink')}</Link>
            </div>
          )}
        </Form>
      </ContentContainer>
    </LayoutContainer >
  );
}

export default SignUpPage;
