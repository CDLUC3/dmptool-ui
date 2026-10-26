import React from 'react';
import { getTranslations } from "next-intl/server";

//Components
import { ContentContainer, LayoutContainer } from '@/components/Container';
import { SSOCheckContainer } from "@/components/SSOCheck";
import { getInitialPendingSignup } from "@/lib/server/auth";
import { routePath } from "@/utils/index";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AuthPage" });
  return { title: `${t("registerTitle")} | DMP Tool` };
}

const SignUpPage: React.FC = async () => {
  const [t, initialPendingSignup] = await Promise.all([
    getTranslations('AuthPage'),
    getInitialPendingSignup(),
  ]);

  const isPendingSSO: boolean = initialPendingSignup !== undefined;

  return (
    <LayoutContainer className="auth-container">
      <ContentContainer className="auth-card">
        {isPendingSSO && (
          <>
            <h3>{t("signSignOnSuccess")}</h3>

            <h4>{t("linkAccountHeader")}</h4>
            <p>{t("linkAccountMessage")}</p>
            <a
              href={routePath("app.login")}
              className="button"
            >
              {t("loginTitle")}
            </a>

            <h4>{t("finishRegistering")}</h4>
            <SSOCheckContainer
              mode="register"
              initialPendingSignup={initialPendingSignup}
            />
          </>
        )}

        {!isPendingSSO && (
          <>
            <h3>{t("registerTitle")}</h3>
            <SSOCheckContainer
              mode="register"
              initialPendingSignup={initialPendingSignup}
            />
          </>
        )}
      </ContentContainer>
    </LayoutContainer>
  );
}

export default SignUpPage;
