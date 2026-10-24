import React from "react";
import { getTranslations } from "next-intl/server";

import { ContentContainer, LayoutContainer } from '@/components/Container';
import { SSOCheckContainer } from "@/components/SSOCheck";

const LoginPage: React.FC = async () => {
  const t = await getTranslations("AuthPage");

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
