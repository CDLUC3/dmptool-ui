"use client";

import React, { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Breadcrumb, Breadcrumbs, Link } from "react-aria-components";

// GraphQL
import { ProjectDocument, RelatedWorksIdentifierType } from "@/generated/graphql";

// Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import { RelatedWorksTabs } from "@/components/RelatedWorksTabs";
import RelatedWorksAddPanel from "@/components/RelatedWorksAddPanel";
import RelatedWorksUnpublished from "@/components/RelatedWorksUnpublished";

// Utils and other
import { routePath } from "@/utils/routes";
import styles from "./RelatedWorksProjectPage.module.scss";

const RelatedWorksProjectPage = () => {
  const Global = useTranslations("Global");
  const t = useTranslations("RelatedWorksProjectPage");

  const params = useParams();
  const projectId = parseInt(String(params.projectId));

  const { data: projectData } = useQuery(ProjectDocument, {
    variables: { projectId },
    skip: Number.isNaN(projectId),
  });
  const plans = projectData?.project?.plans;
  const hasPublishedPlan = plans ? plans.some((plan) => plan.registered != null) : undefined;
  const unpublishedPlanIds = useMemo(
    () => (plans ?? []).filter((plan) => plan.registered == null && plan.id != null).map((plan) => plan.id as number),
    [plans],
  );
  const addHref = routePath("projects.related-works.add", { projectId });

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t.rich("description", {
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
        showBackButton={true}
        className={styles.header}
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
          <RelatedWorksAddPanel
            href={addHref}
            hasPublishedPlan={hasPublishedPlan !== false}
          />
        }
      />
      <LayoutContainer className={styles.layout}>
        <ContentContainer className="layout-content-container-full">
          <RelatedWorksTabs
            identifierType={RelatedWorksIdentifierType.ProjectId}
            identifier={projectId}
            hasPublishedPlan={hasPublishedPlan}
            unpublishedPlanIds={unpublishedPlanIds}
            addHref={addHref}
            unpublishedContent={
              <RelatedWorksUnpublished
                publishHref={routePath("projects.show", { projectId })}
                addHref={addHref}
              />
            }
          />
        </ContentContainer>
      </LayoutContainer>
    </>
  );
};

export default RelatedWorksProjectPage;
