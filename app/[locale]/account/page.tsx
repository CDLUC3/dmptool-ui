'use client'

import React from 'react';
import { useTranslations } from 'next-intl';

import PageHeader from '@/components/PageHeader';
import PageLinkCard, { PageLinkSection } from '@/components/PageLinkCard';
import {
  ContentContainer,
  LayoutWithPanel,
  SidebarPanel,
} from '@/components/Container';
import { routePath } from '@/utils/routes';

import styles from './account.module.scss';

const AccountOverviewPage: React.FC = () => {
  const t = useTranslations('Account');

  const accountSections: PageLinkSection[] = [
    {
      title: t('sections.userProfile.title'),
      items: [
        {
          title: t('sections.userProfile.items.profile.title'),
          description: t('sections.userProfile.items.profile.description'),
          href: routePath('account.profile')
        },
        {
          title: t('sections.userProfile.items.password.title'),
          description: t('sections.userProfile.items.password.description'),
          href: routePath('account.password')
        },
        {
          title: t('sections.userProfile.items.connections.title'),
          description: t('sections.userProfile.items.connections.description'),
          href: routePath('account.connections')
        },
        {
          title: t('sections.userProfile.items.notifications.title'),
          description: t('sections.userProfile.items.notifications.description'),
          href: routePath('account.notifications')
        },
        {
          title: t('sections.userProfile.items.developerTools.title'),
          description: t('sections.userProfile.items.developerTools.description'),
          href: routePath('account.dev-tools')
        }
      ]
    }
  ];

  return (
    <>
      <PageHeader
        title="Account"
        description="Manage your account settings and preferences"
        showBackButton={true}
        className="page-template-list"
      />
      <div className={styles.main}>
        <div className={styles.mainContent}>
          <LayoutWithPanel>
            <ContentContainer className={styles.layoutContentContainer}>
              <PageLinkCard sections={accountSections} />
            </ContentContainer>
            <SidebarPanel className={styles.layoutSidebarPanel}>
              <div>
                {/* TODO: Add sidebar content */}
              </div>
            </SidebarPanel>
          </LayoutWithPanel>
        </div>
      </div>
    </>
  )
}

export default AccountOverviewPage;
