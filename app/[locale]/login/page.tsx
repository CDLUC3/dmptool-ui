'use client'

import React, { useEffect } from "react";
import { ContentContainer, LayoutContainer } from '@/components/Container';
import { SSOCheckContainer } from "@/components/SSOCheck";
import { getTranslations } from "next-intl/server";
import { getInitialPendingSignup } from "@/utils/authHelper";

const LoginPage: React.FC = async () => {
  const [t, initialPendingSignup] = await Promise.all([
    getTranslations("AuthPage"),
    getInitialPendingSignup()
  ]);

  const isPendingSSO: boolean = initialPendingSignup !== undefined;

  useEffect(() => {
    document.title = `${t(isPendingSSO? "loginToLink" : "loginTitle")} | DMP Tool`;
  }, []);

  return (
    <LayoutContainer className="auth-container">
      <ContentContainer className="auth-card">
        <h3>{t( "loginTitle")}</h3>
        <SSOCheckContainer mode="login" />
      </ContentContainer>
    </LayoutContainer>
  );
};

export default LoginPage;
