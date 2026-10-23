import React from 'react';
import { getTranslations } from "next-intl/server";

//Components
import { ContentContainer, LayoutContainer } from '@/components/Container';
import { SSOCheckContainer } from "@/components/SSOCheck";
import { getInitialPendingSignup } from "@/lib/server/auth";

const SignUpPage: React.FC = async () => {
  const [t, initialPendingSignup] = await Promise.all([
    getTranslations('AuthPage'),
    getInitialPendingSignup(),
  ]);

  const isPendingSSO: boolean = initialPendingSignup !== undefined;

  return (
    <LayoutContainer className="auth-container">
      <ContentContainer className="auth-card">
        <h3>{t(isPendingSSO ? "finishRegistering": "registerTitle")}</h3>
        <SSOCheckContainer mode="register" initialPendingSignup={initialPendingSignup} />
      </ContentContainer>
    </LayoutContainer>
  );
}

export default SignUpPage;
