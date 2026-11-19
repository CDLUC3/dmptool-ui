'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useApolloClient } from '@apollo/client/react';

// Components
import PageHeader from '@/components/PageHeader';
import { ContentContainer, LayoutContainer } from '@/components/Container';
import ErrorMessages from '@/components/ErrorMessages';
import Loading from '@/components/Loading';
import { TransitionButton } from '@/components/Form';

// Utils and other
import { useRouter } from '@/i18n/routing';
import { useAuthContext } from '@/context/AuthContext';
import { useCsrf } from '@/context/CsrfContext';
import { routePath } from '@/utils/routes';
import logECS from '@/utils/clientLogger';
import {
  isEmailConfirmationFailureReason,
  postToAuthService,
  readAuthServiceBody,
} from '@/utils/emailConfirmation';

/**
 * The page a user lands on from the link in an email confirmation email. A signed-in user's email is confirmed as
 * soon as they open the page. Signed-out users are asked to sign in first, and are sent back here afterwards.
 * Email security scanners that open the link aren't signed in, so they can't use up the link.
 */
const ConfirmEmailPage: React.FC = () => {
  const t = useTranslations('EmailConfirmation');
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated, setIsAuthenticated } = useAuthContext();
  const { getCsrfToken } = useCsrf();
  const apolloClient = useApolloClient();
  const errorRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  // The link can only be used once, so make sure only one request is sent. React runs effects twice in
  // development, and a second request would find the link already used and show the "verification failed" page
  const requestSent = useRef(false);

  const confirmEmail = useCallback(async () => {
    requestSent.current = true;
    setErrors([]);
    try {
      const response = await postToAuthService('/email-confirmation/confirm', { token }, getCsrfToken);
      if (response.ok) {
        // The email was confirmed outside of Apollo, so drop the cached user. Otherwise the profile page
        // would keep showing the email as unconfirmed until the page is reloaded
        apolloClient.cache.evict({ fieldName: 'me' });
        apolloClient.cache.gc();
        router.push(routePath('email.confirmed'));
        return;
      }

      // The session ended and could not be refreshed, so ask the user to sign in again. The link wasn't used,
      // so it is confirmed when they come back signed in
      if (response.status === 401) {
        requestSent.current = false;
        setIsAuthenticated(false);
        return;
      }

      const { reason, message } = await readAuthServiceBody(response);
      if (isEmailConfirmationFailureReason(reason)) {
        router.push(routePath('email.verificationFailed', {}, { reason }));
        return;
      }

      logECS('error', 'ConfirmEmailPage.confirmEmail', { status: response.status, message });
      setErrors([t('confirm.error')]);
    } catch (error) {
      logECS('error', 'ConfirmEmailPage.confirmEmail', { error });
      setErrors([t('confirm.error')]);
    }
  }, [token, getCsrfToken, apolloClient, router, setIsAuthenticated, t]);

  // Confirm the email as soon as we know the user is signed in
  useEffect(() => {
    if (isAuthenticated && !requestSent.current) {
      void confirmEmail();
    }
  }, [isAuthenticated, confirmEmail]);

  const handleRetry = async () => {
    await confirmEmail();
  };

  const handleSignIn = async ({ startTransition }: { startTransition: React.TransitionStartFunction }) => {
    // Send the user back to this page after they sign in, so their email is confirmed
    const returnTo = routePath('email.confirmEmail', { token });
    startTransition(() => {
      router.push(routePath('app.login', {}, { returnTo }));
    });
  };

  const renderContent = () => {
    if (isAuthenticated === null) {
      return <Loading variant="inline" />;
    }

    if (!isAuthenticated) {
      return (
        <>
          <h2>{t('confirm.signInTitle')}</h2>
          <p>{t('confirm.signInDescription')}</p>
          <TransitionButton
            data-primary
            onPress={handleSignIn}
            loadingLabel={t('confirm.signInButton')}
          >
            {t('confirm.signInButton')}
          </TransitionButton>
        </>
      );
    }

    // The request failed for an unexpected reason (e.g. a network error), so let the user try again
    if (errors.length > 0) {
      return (
        <>
          <ErrorMessages errors={errors} ref={errorRef} />
          <TransitionButton
            data-primary
            onPress={handleRetry}
            loadingLabel={t('confirm.confirming')}
          >
            {t('confirm.retryButton')}
          </TransitionButton>
        </>
      );
    }

    return <Loading variant="inline" message={t('confirm.confirming')} />;
  };

  return (
    <>
      <PageHeader title={t('confirm.title')} showBackButton={false} />
      <LayoutContainer>
        <ContentContainer>
          <div className="sectionContainer">
            <div className="sectionContent">
              <div className="container">
                {renderContent()}
              </div>
            </div>
          </div>
        </ContentContainer>
      </LayoutContainer>
    </>
  );
};

export default ConfirmEmailPage;
