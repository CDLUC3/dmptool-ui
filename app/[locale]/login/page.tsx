'use client'

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ContentContainer, LayoutContainer } from '@/components/Container';
import { SSOCheckContainer } from "@/components/SSOCheck";

const LoginPage: React.FC = () => {
  const t = useTranslations("AuthPage");

  useEffect(() => {
    document.title = `${t("loginTitle")} | DMP Tool`;
  }, []);

  return (
    <LayoutContainer className="auth-container">
      <ContentContainer className="auth-card">
        <h3>{t("loginTitle")}</h3>
        <SSOCheckContainer mode="login" />
      </ContentContainer>
    </LayoutContainer>
  );
};

export default LoginPage;
