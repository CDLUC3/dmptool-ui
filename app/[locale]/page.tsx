'use client'

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/PageHeader';
import { ContentContainer, LayoutContainer } from '@/components/Container';
import PageLinkCard, { PageLinkSection } from '@/components/PageLinkCard';
import { routePath } from '@/utils/routes';

const Home = () => {
  const t = useTranslations('HomePage');
  const sections: PageLinkSection[] = [
    {
      title: t('createAndManage.title'),
      description: t('createAndManage.description'),
      items: [
        {
          title: t('sections.templateManagement.title'),
          description: t('sections.templateManagement.description'),
          href: routePath('template.index')
        },
        {
          title: t('sections.planDashboard.title'),
          description: t('sections.planDashboard.description'),
          href: routePath('projects.index')
        }
      ]
    },
    {
      title: t('accountAndAdmin.title'),
      description: t('accountAndAdmin.description'),
      items: [
        {
          title: t('sections.accountSettings.title'),
          description: t('sections.accountSettings.description'),
          href: routePath('account.index')
        },
        {
          title: t('sections.adminOverview.title'),
          description: t('sections.adminOverview.description'),
          href: routePath('admin.index')
        }
      ]
    }
  ];

  return (
    <>
      <PageHeader
        title={t('title')}
        showBackButton={false}
        className="page-template-list"
      />
      <LayoutContainer>
        <ContentContainer>
          <PageLinkCard sections={sections} />
        </ContentContainer>
      </LayoutContainer>
    </>
  )
}

export default Home;
