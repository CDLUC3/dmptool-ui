"use client";

import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import { Breadcrumb, Breadcrumbs, Link } from "react-aria-components";
import { useTranslations } from "next-intl";
import styles from "./RelatedWorksProjectPage.module.scss";
import { RelatedWorksIdentifierType } from "@/generated/graphql";
import { useParams } from "next/navigation";
import { routePath } from "@/utils/routes";
import { RelatedWorksTabs } from "@/components/RelatedWorksTabs";

const RelatedWorksProjectPage = () => {
  const Global = useTranslations("Global");
  const t = useTranslations("RelatedWorksProjectPage");

  const params = useParams();
  const projectId = parseInt(String(params.projectId));

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb>
              <Link href={routePath("app.home")}>{Global("breadcrumbs.home")}</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href={routePath("projects.index")}>{Global("breadcrumbs.projects")}</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href={routePath("projects.show", { projectId })}>{Global("breadcrumbs.projectOverview")}</Link>
            </Breadcrumb>
            <Breadcrumb>{t("title")}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={
          <>
            <Link
              href={routePath("projects.related-works.add", { projectId })}
              className="button-link button--primary"
            >
              {t("buttons.addRelatedWorkManually")}
            </Link>
          </>
        }
      />
      <LayoutContainer>
        <ContentContainer className={`layout-content-container-full ${styles.tabWrapper}`}>
          <RelatedWorksTabs
            identifierType={RelatedWorksIdentifierType.ProjectId}
            identifier={projectId}
          />
        </ContentContainer>
      </LayoutContainer>
    </>
  );
};

export default RelatedWorksProjectPage;
