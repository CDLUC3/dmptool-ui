'use client'

import React, { useState } from 'react';
import ConnectionSection from '@/components/ConnectionSection';
import PageHeader from '@/components/PageHeader';
import {
  ContentContainer,
  LayoutWithPanel,
  SidebarPanel,
} from '@/components/Container';
import { Breadcrumb, Breadcrumbs } from "react-aria-components";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { useToast } from '@/context/ToastContext';
import profileStyles from "@/app/[locale]/account/profile/profile.module.scss";

// Fake connect/disconnect until OAuth and disconnect mutations are wired.
const FAKE_ORCID_ID = '0000-0001-2345-6789';
const FAKE_SSO_INSTITUTION = 'Example University';

const ConnectionsPage: React.FC = () => {
  const t = useTranslations('UserConnections');
  const toast = useToast();
  const [isOrcidConnected, setIsOrcidConnected] = useState(false);
  const [isSsoConnected, setIsSsoConnected] = useState(false);

  const orcidContent = t.markup('orcidConnection.content', {
    link: (chunks) =>
      `<a href="https://orcid.org/" target="_blank" rel="noopener noreferrer">${chunks}</a>`
  });

  const handleOrcidConnect = () => {
    setIsOrcidConnected(true);
    toast.add(t('orcidConnection.connectSuccess'), { type: 'success' });
  };

  const handleOrcidDisconnect = async () => {
    setIsOrcidConnected(false);
    toast.add(t('orcidConnectionConnected.disconnectSuccess'), { type: 'success' });
  };

  const handleSsoConnect = () => {
    setIsSsoConnected(true);
    toast.add(t('ssoConnection.connectSuccess'), { type: 'success' });
  };

  const handleSsoDisconnect = async () => {
    setIsSsoConnected(false);
    toast.add(t('ssoConnectionConnected.disconnectSuccess'), { type: 'success' });
  };

  return (
    <>
      <PageHeader
        title={t('title')}
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href="/">{t('breadcrumbHome')}</Link></Breadcrumb>
            <Breadcrumb><Link
              href="/account/profile">{t('breadcrumbProfile')}</Link></Breadcrumb>
            <Breadcrumb>{t('breadcrumbConnections')}</Breadcrumb>
          </Breadcrumbs>
        }
        className="page-connections-list"
      />

      <LayoutWithPanel>
        <ContentContainer>
          <div className="sectionContainer">
            <div className="sectionContent">
              <ConnectionSection
                type="orcid"
                isConnected={isOrcidConnected}
                connectedIdentifier={FAKE_ORCID_ID}
                title={t('orcidConnection.title')}
                content={orcidContent}
                btnImageUrl="/images/orcid.svg"
                btnText={t('orcidConnection.btnText')}
                onConnect={handleOrcidConnect}
                onDisconnect={handleOrcidDisconnect}
              />

              <ConnectionSection
                type="sso"
                isConnected={isSsoConnected}
                connectedIdentifier={FAKE_SSO_INSTITUTION}
                title={t('ssoConnection.title')}
                content={t('ssoConnection.content')}
                btnText={t('ssoConnection.btnText')}
                onConnect={handleSsoConnect}
                onDisconnect={handleSsoDisconnect}
              />
            </div>
          </div>
        </ContentContainer>

        <SidebarPanel className={profileStyles.layoutSidebarPanel}>
          <h2>{t('headingRelatedActions')}</h2>
          <ul className={profileStyles.relatedItems}>
            <li><Link href="/account/profile">{t('breadcrumbProfile')}</Link></li>
            <li><Link href="/account/update-password">{t('linkUpdatePassword')}</Link></li>
            <li><Link href="/account/notifications">{t('linkManageNotifications')}</Link></li>
          </ul>
        </SidebarPanel>

      </LayoutWithPanel>
    </>
  )
}

export default ConnectionsPage;
