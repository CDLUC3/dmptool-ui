'use client'

import React from 'react';
import { useTranslations } from 'next-intl';
import { Breadcrumb, Breadcrumbs, Link } from 'react-aria-components';

// Components
import PageHeader from '@/components/PageHeader';
import { ContentContainer } from '@/components/Container';

// Utils and other
import { routePath } from '@/utils/routes';
import styles from './funderRequirements.module.scss';

const FunderRequirementsPage: React.FC = () => {
  const t = useTranslations('FunderRequirements');
  const Global = useTranslations('Global');

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb>{t('title')}</Breadcrumb>
          </Breadcrumbs>
        }
      />
      <ContentContainer>
        <p className={styles.comingSoon}>{t('comingSoon')}</p>
      </ContentContainer>
    </>
  );
};

export default FunderRequirementsPage;
