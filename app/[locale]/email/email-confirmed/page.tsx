'use client'

import React from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/PageHeader';
import { ContentContainer, LayoutContainer } from '@/components/Container';
import { TransitionButton } from '@/components/Form';
import { useRouter } from '@/i18n/routing';
import { routePath } from '@/utils/routes';

const EmailConfirmed: React.FC = () => {
  const t = useTranslations('EmailConfirmation');
  const router = useRouter();

  const handleGoToProfile = async ({ startTransition }: { startTransition: React.TransitionStartFunction }) => {
    startTransition(() => {
      router.push(routePath('account.profile'));
    });
  };

  return (
    <>
      <PageHeader title={t('confirmed.title')} showBackButton={false} />
      <LayoutContainer>
        <ContentContainer>
          <div className="sectionContainer">
            <div className="sectionContent">
              <div className="container">
                <p>{t('confirmed.description')}</p>
                <TransitionButton data-primary onPress={handleGoToProfile} loadingLabel={t('confirmed.button')}>
                  {t('confirmed.button')}
                </TransitionButton>
              </div>
            </div>
          </div>
        </ContentContainer>
      </LayoutContainer>
    </>
  )
}

export default EmailConfirmed;
