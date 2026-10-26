'use client'

import React, { useEffect, useRef, useState } from "react";
import ConnectionSection from '@/components/ConnectionSection';
import PageHeader from '@/components/PageHeader';
import { ContentContainer, LayoutWithPanel, SidebarPanel } from '@/components/Container';
import { Breadcrumb, Breadcrumbs } from "react-aria-components";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { useToast } from '@/context/ToastContext';
import profileStyles from "@/app/[locale]/account/profile/profile.module.scss";
import { routePath } from "@/utils/index";
import logECS from "../../../../utils/clientLogger";
import { useMutation, useQuery } from "@apollo/client/react";
import { DisconnectFromSsoDocument, MeDocument } from "@/generated/graphql";
import { useSearchParams } from "next/navigation";
import Loading from "@/components/Loading";
import ErrorMessages from "@/components/ErrorMessages";

const FAKE_ORCID_ID = "0000-0001-2345-6789";

const ConnectionsPage: React.FC = () => {
  const t = useTranslations("UserConnections");
  const globalT = useTranslations("Global");
  const toast = useToast();
  const searchParams = useSearchParams();
  const errorRef = useRef<HTMLDivElement | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [connecting, setConnecting] = useState(false);
  const { data, loading: queryLoading, refetch } = useQuery(MeDocument);
  const [disconnectFromSsoMutation, { loading: disconnectLoading }] = useMutation(DisconnectFromSsoDocument);

  const processedSsoCallback = useRef(false);

  const [isOrcidConnected, setIsOrcidConnected] = useState(false);

  const orcidContent = t.markup("orcidConnection.content", {
    link: (chunks) => `<a href="https://orcid.org/" target="_blank" rel="noopener noreferrer">${chunks}</a>`,
  });

  const handleOrcidConnect = () => {
    setIsOrcidConnected(true);
    toast.add(t("orcidConnection.connectSuccess"), { type: "success" });
  };

  const handleOrcidDisconnect = async () => {
    setIsOrcidConnected(false);
    toast.add(t("orcidConnectionConnected.disconnectSuccess"), { type: "success" });
  };

  const handleSsoConnect = async () => {
    setConnecting(true);
    setErrors([]); // Clear previous errors

    /* eslint-disable @typescript-eslint/no-explicit-any */
    try {
      if (!data || !data.me || !data.me.email || !data.me.ssoEntityId) {
        setErrors([t("ssoConnectionConnected.ssoNotEnabled")]);
        return;
      }

      // Set the user to the SSO provider's login page. The SSO provider will redirect back to the app after
      // successful authentication.
      const queryString = new URLSearchParams({
        email: data.me.email,
        entityId: data.me.ssoEntityId || "",
      }).toString();
      window.location.href = `${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/sso/passthru?${queryString}`;
    } catch (err: any) {
      // The SSO check failed for some reason, Log the error and return to the non-SSO step so the user can try to
      // log in via that route.
      logECS("error", "SSO link error", {
        error: err,
        url: { path: "/account/connections" },
      });
      setErrors([t("ssoConnectionConnected.ssoConnectError")]);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect the user from their affiliation's SSO. This will remove the SSO ID from the user's account and prevent
  // them from logging in via SSO in the future.
  const handleSsoDisconnect = async () => {
    try {
      const response = await disconnectFromSsoMutation();
      if (!response || !response.data || !response.data.disconnectSSO) {
        const errorMessage =
          response?.data?.disconnectSSO?.errors?.general || t("ssoConnectionConnected.ssoDisconnectError");
        setErrors([errorMessage]);
      } else if (response.data.disconnectSSO.errors) {
        const errorMessage =
          response.data.disconnectSSO.errors.general || t("ssoConnectionConnected.ssoDisconnectError");
        setErrors([errorMessage]);
      } else {
        // Successfully disconnected from SSO, refetch the user data to update the UI
        await refetch();
        const successMessage = t("ssoConnectionConnected.disconnectSuccess");
        toast.add(successMessage, { type: "success", timeout: 3000 });
      }
    } catch (err: any) {
      logECS("error", "SSO disconnect error", {
        error: err,
        url: { path: "/account/connections" },
      });
      setErrors([t("ssoConnectionConnected.ssoDisconnectError")]);
    }
  };

  useEffect(() => {
    if (processedSsoCallback.current) return;

    // If the query string contains the parameter "linked=true", then the user has just linked their account to an SSO
    // provider. Show a success toast and remove the query parameter from the URL.
    const wasJustLinkedToSso: boolean = searchParams.get("linked") === "true";
    if (wasJustLinkedToSso) {
      processedSsoCallback.current = true;
      const successMessage = t("ssoConnection.connectSuccess");
      toast.add(successMessage, { type: "success", timeout: 3000 });

      // Remove the query parameter from the URL after showing the toast
      const params = new URLSearchParams(searchParams.toString());
      params.delete("linked");

      const queryString: string = params.toString();
      const pathname: string = routePath("account.connections");
      const cleanUrl: string = queryString ? `${pathname}?${queryString}` : pathname;

      // Update the address bar without adding a browser history step
      // window.history.replaceState cleans the URL instantly without triggering a Next.js re-render
      window.history.replaceState(null, "", cleanUrl);
    }
  }, []);

  // Show loading message on first page load when getting user
  const loading = queryLoading || disconnectLoading || connecting;
  if (loading) {
    return (
      <Loading variant="page" message={t("loading")} />
    );
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb>
              <Link href="/">{t("breadcrumbHome")}</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href="/account/profile">{t("breadcrumbProfile")}</Link>
            </Breadcrumb>
            <Breadcrumb>{t("breadcrumbConnections")}</Breadcrumb>
          </Breadcrumbs>
        }
        className="page-connections-list"
      />

      <LayoutWithPanel>
        <ContentContainer>
          <ErrorMessages
            errors={errors}
            ref={errorRef}
          />

          <div className="sectionContainer">
            <div className="sectionContent">
              <ConnectionSection
                type="orcid"
                isConnected={isOrcidConnected}
                connectedIdentifier={FAKE_ORCID_ID}
                title={t("orcidConnection.title")}
                content={orcidContent}
                btnImageUrl="/images/orcid.svg"
                btnText={t("orcidConnection.btnText")}
                onConnect={handleOrcidConnect}
                onDisconnect={handleOrcidDisconnect}
              />

              {data?.me?.ssoEntityId && (
                <ConnectionSection
                  type="sso"
                  isConnected={data?.me?.hasSSO || false}
                  connectedIdentifier={data?.me?.hasSSO ? globalT("form.yesLabel") : globalT("noLabel")}
                  title={t("ssoConnection.title")}
                  content={t("ssoConnection.content")}
                  btnText={t("ssoConnection.btnText")}
                  onConnect={handleSsoConnect}
                  onDisconnect={handleSsoDisconnect}
                />
              )}
            </div>
          </div>
        </ContentContainer>

        <SidebarPanel className={profileStyles.layoutSidebarPanel}>
          <h2>{t("headingRelatedActions")}</h2>
          <ul className={profileStyles.relatedItems}>
            <li>
              <Link href="/account/profile">{t("breadcrumbProfile")}</Link>
            </li>
            <li>
              <Link href="/account/update-password">{t("linkUpdatePassword")}</Link>
            </li>
            <li>
              <Link href="/account/notifications">{t("linkManageNotifications")}</Link>
            </li>
          </ul>
        </SidebarPanel>
      </LayoutWithPanel>
    </>
  );
};

export default ConnectionsPage;
