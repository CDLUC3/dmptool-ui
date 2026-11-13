'use client'

import React from "react";
import { useTranslations } from "next-intl";
import { Breadcrumb, Breadcrumbs, Link } from "react-aria-components";

// Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer } from "@/components/Container";

// Utils and other
import { routePath } from "@/utils/routes";
import styles from "./ComingSoonPage.module.scss";

export interface ComingSoonBreadcrumb {
  label: string;
  href: string;
}

export interface ComingSoonPageProps {
  title: string;
  description?: string;
  /** Breadcrumbs shown between Home and this page */
  parentBreadcrumbs?: ComingSoonBreadcrumb[];
}

const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ title, description, parentBreadcrumbs = [] }) => {
  const t = useTranslations("ComingSoon");
  const Global = useTranslations("Global");

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath("app.home")}>{Global("breadcrumbs.home")}</Link></Breadcrumb>
            {parentBreadcrumbs.map((crumb) => (
              <Breadcrumb key={crumb.href}><Link href={crumb.href}>{crumb.label}</Link></Breadcrumb>
            ))}
            <Breadcrumb>{title}</Breadcrumb>
          </Breadcrumbs>
        }
      />
      <ContentContainer>
        <p className={styles.message}>{t("message")}</p>
      </ContentContainer>
    </>
  );
};

export default ComingSoonPage;
