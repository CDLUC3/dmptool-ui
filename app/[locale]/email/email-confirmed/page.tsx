'use client'

import React from 'react';
import { useRouter } from '@/i18n/routing';
import {Button} from 'react-aria-components';
import PageHeader from '@/components/PageHeader';
import {ContentContainer, LayoutContainer,} from '@/components/Container';

const EmailConfirmed: React.FC = () => {
  const router = useRouter();

  const handleGoToLogin = () => {
    router.push('/login');
  };
  return (
    <>
      <PageHeader title="Email confirmed" showBackButton={false} />
      <LayoutContainer>
        <ContentContainer>
          <div className="sectionContainer">
            <div className="sectionContent">
              <div className="container">
                <p>Thanks for confirming your alias email. Click below to log in and access your plans. Remember you still need to use your primary email to log in.</p>
                <Button data-primary onPress={handleGoToLogin}>Log in</Button>
              </div>
            </div>
          </div>
        </ContentContainer>
      </LayoutContainer>
    </>
  )
}

export default EmailConfirmed;
