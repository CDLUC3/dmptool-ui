"use client";

import React from "react";
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
import styles from "./RelatedWorksPlanPage.module.scss";

const RelatedWorksPlanPage = () => {
  const Global = useTranslations("Global");
  const t = useTranslations("RelatedWorksPlanPage");

  // Get planId (dmpId) from route /projects/:projectId/dmp/:dmpId
  const params = useParams();
  const projectId = parseInt(String(params.projectId));
  const planId = parseInt(String(params.dmpid));

  const { data: projectData } = useQuery(ProjectDocument, {
    variables: { projectId },
    skip: Number.isNaN(projectId),
  });
  const plan = projectData?.project?.plans?.find((item) => item.id === planId);
  const hasPublishedPlan = plan ? plan.registered != null : undefined;
  const addHref = routePath("projects.dmp.related-works.add", { projectId, dmpId: planId });
  const allPlansHref = routePath("projects.related-works.index", { projectId });

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
            <Breadcrumb>
              <Link href={routePath("projects.dmp.show", { projectId, dmpId: planId })}>
                {Global("breadcrumbs.planOverview")}
              </Link>
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
            identifierType={RelatedWorksIdentifierType.PlanId}
            identifier={planId}
            hasPublishedPlan={hasPublishedPlan}
            planScope={{ title: plan?.title, allPlansHref }}
            addHref={addHref}
            unpublishedContent={
              <RelatedWorksUnpublished
                planTitle={plan?.title}
                viewAllPlansHref={allPlansHref}
                publishHref={routePath("projects.dmp.show", { projectId, dmpId: planId })}
                addHref={addHref}
              />
            }
          />
        </ContentContainer>
      </LayoutContainer>
    </>
  );
};

export default RelatedWorksPlanPage;
