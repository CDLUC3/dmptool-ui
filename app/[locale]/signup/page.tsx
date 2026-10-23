import React from 'react';
import { cookies } from 'next/headers';
import { getTranslations } from "next-intl/server";

//Components
import { ContentContainer, LayoutContainer } from '@/components/Container';
import { SSOCheckContainer, type PendingSSOSignup } from "@/components/SSOCheck";
import { verifyJwtToken } from "@/lib/server/auth";
import { SSO_PENDING_TOKEN_NAME } from "@/utils/authHelper";

function getPendingSignupPayload(payload: Record<string, unknown> | null): PendingSSOSignup | undefined {
  if (!payload || typeof payload.email !== "string") {
    return undefined;
  }

console.log('SSO pending signup payload:', payload);

  return {
    email: payload.email,
    affiliation: typeof payload.affiliation === "string" ? payload.affiliation : undefined,
    displayName: typeof payload.displayName === "string" ? payload.displayName : undefined,
    givenName: typeof payload.givenName === "string" ? payload.givenName : undefined,
    surName: typeof payload.surName === "string" ? payload.surName : undefined,
  };
}

async function getInitialPendingSignup(): Promise<PendingSSOSignup | undefined> {
  const token = (await cookies()).get(SSO_PENDING_TOKEN_NAME)?.value;
  if (!token) {
    return undefined;
  }

console.log('TOKEN NAME:', SSO_PENDING_TOKEN_NAME);
console.log('SSO pending signup payload:', token);

  try {
    return getPendingSignupPayload(await verifyJwtToken(token));
  } catch (error) {
    console.error("Unable to verify pending SSO signup token", error);
    return undefined;
  }
}

const SignUpPage: React.FC = async () => {
  const [t, initialPendingSignup] = await Promise.all([
    getTranslations('AuthPage'),
    getInitialPendingSignup(),
  ]);

  return (
    <LayoutContainer className="auth-container">
      <ContentContainer className="auth-card">
        <h3>{t("registerTitle")}</h3>
        <SSOCheckContainer mode="register" initialPendingSignup={initialPendingSignup} />
      </ContentContainer>
    </LayoutContainer>
  );
}

export default SignUpPage;
