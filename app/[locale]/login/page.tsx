import React from "react";
import { getTranslations } from "next-intl/server";

import { ContentContainer, LayoutContainer } from '@/components/Container';
import { SSOCheckContainer } from "@/components/SSOCheck";
import { getInitialPendingSignup } from "@/utils/authHelper";

const LoginPage: React.FC = async () => {
  const [t, initialPendingSignup] = await Promise.all([
    getTranslations("AuthPage"),
    getInitialPendingSignup()
  ]);

  const isPendingSSO: boolean = initialPendingSignup !== undefined;

  return (
    <LayoutContainer className="auth-container">
      <ContentContainer className="auth-card">
        <h3>{t( isPendingSSO? "loginToLink" : "loginTitle")}</h3>
        <SSOCheckContainer mode="login" />
      </ContentContainer>
    </LayoutContainer>
  );
};

export default LoginPage;
