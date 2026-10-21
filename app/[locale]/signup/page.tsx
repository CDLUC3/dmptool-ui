'use client'

import React, { useEffect } from 'react';
import { useTranslations } from "next-intl";

//Components
import { ContentContainer, LayoutContainer } from '@/components/Container';
import { SSOCheckContainer } from "@/components/SSOCheck";

const SignUpPage: React.FC = () => {
  const t = useTranslations('AuthPage');

  useEffect(() => {
    document.title = `${t("registerTitle")} | DMP Tool`;
  }, []);

  return (
    <LayoutContainer className="auth-container">
      <ContentContainer className="auth-card">
        <h3>{t("registerTitle")}</h3>
        <SSOCheckContainer mode="register" />
      </ContentContainer>
    </LayoutContainer>
  );
}

export default SignUpPage;
