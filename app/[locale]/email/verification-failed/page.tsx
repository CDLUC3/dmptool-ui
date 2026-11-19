'use client'

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/PageHeader';
import { ContentContainer, LayoutContainer } from '@/components/Container';
import { TransitionButton } from '@/components/Form';
import { useRouter } from '@/i18n/routing';
import { routePath } from '@/utils/routes';
import { isEmailConfirmationFailureReason } from '@/utils/emailConfirmation';

/**
 * Explains why an email could not be confirmed. The confirm page passes the Auth service's reason as `?reason=`.
 */
const VerificationFailed: React.FC = () => {
  const t = useTranslations('EmailConfirmation');
  const router = useRouter();
  const reason = useSearchParams().get('reason');
  const messageKey = isEmailConfirmationFailureReason(reason) ? `failed.${reason}` : 'failed.generic';

  const handleGoToProfile = async ({ startTransition }: { startTransition: React.TransitionStartFunction }) => {
    startTransition(() => {
      router.push(routePath('account.profile'));
    });
  };

  return (
    <>
      <PageHeader title={t('failed.title')} showBackButton={false} />
      <LayoutContainer>
        <ContentContainer>
          <div className="sectionContainer">
            <div className="sectionContent">
              <div className="container">
                <p>{t(messageKey)}</p>
                {/* Someone signed in to the wrong account needs to sign out from the header, not go to this profile */}
                {reason !== 'wrongAccount' && (
                  <TransitionButton data-primary onPress={handleGoToProfile} loadingLabel={t('failed.profileButton')}>
                    {t('failed.profileButton')}
                  </TransitionButton>
                )}
              </div>
            </div>
          </div>
        </ContentContainer>
      </LayoutContainer>
    </>
  )
}

export default VerificationFailed;
